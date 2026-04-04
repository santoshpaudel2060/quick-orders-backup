import Table from "../models/Table.model.js";
import Order from "../models/Order.model.js";
import { Request, Response } from "express";
import QRCode from "qrcode";
import {
  startOrderTracking,
  stopOrderTracking,
} from "../services/orderTracking.service.js";

export const addOrder = async (req: Request, res: Response) => {
  try {
    const { tableNumber, customerId, items, sessionId } = req.body;

    const table = await Table.findOne({ tableNumber });
    if (!table) return res.status(404).json({ message: "Table not found" });

    if (table.status === "occupied" && table.currentCustomer !== customerId) {
      return res
        .status(400)
        .json({ message: "Table is occupied by another customer" });
    }

    if (table.status === "available") {
      table.status = "occupied";
      table.currentCustomer = customerId;
      table.sessionStart = new Date();
    }

    table.lastActive = new Date();
    table.orders.push({ items, createdAt: new Date() });
    await table.save();

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.qty,
      0,
    );
    const order = new Order({
      tableNumber,
      customerId,
      sessionId, // Store session ID
      items,
      status: "pending",
      totalAmount,
      progress: 0, // Initialize progress to 0%
    });
    await order.save();

    const io = req.app.get("io");
    io.emit("new-order", order);

    // DO NOT automatically track - wait for kitchen staff to manually change status
    // Only emit the new order event

    res.json({ message: "Order added", table, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add order" });
  }
};

export const getBill = async (req: Request, res: Response) => {
  try {
    const { tableNumber, customerId } = req.body;

    const table = await Table.findOne({ tableNumber });
    if (!table || table.currentCustomer !== customerId) {
      return res
        .status(400)
        .json({ message: "No active session for this customer" });
    }

    let total = 0;
    table.orders.forEach((order) => {
      order.items.forEach((item) => {
        const qty = item.qty ?? 0;
        const price = item.price ?? 0;
        total += qty * price;
      });
    });

    res.json({ total, orders: table.orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get bill" });
  }
};

export const freeTable = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.body;

    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    table.status = "available";
    table.currentCustomer = null;
    table.sessionStart = null;
    table.lastActive = null;
    table.orders = [];

    await table.save();

    const io = req.app.get("io");
    io.emit("table-freed", tableNumber);

    console.log(`Table ${tableNumber} freed successfully`);

    res.json({ message: "Table freed successfully" });
  } catch (error) {
    console.error("Free table error:", error);
    res.status(500).json({ message: "Failed to free table" });
  }
};

export const getTableOrders = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.params;
    const orders = await Order.find({
      tableNumber: parseInt(tableNumber),
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({
      status: { $in: ["pending", "preparing", "ready"] },
    }).sort({ createdAt: 1 });

    console.log(`Found ${orders.length} active orders`);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "preparing",
      "ready",
      "served",
      "paid",
      "canceled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    // Determine progress based on status
    let progressValue = 0;
    let updateData: any = { status };

    if (status === "pending") {
      progressValue = 0;
      updateData.progress = 0;
    } else if (status === "ready") {
      progressValue = 95;
      updateData.progress = 95;
    } else if (status === "served") {
      progressValue = 100;
      updateData.progress = 100;
      updateData.completedAt = new Date();
    } else if (status === "preparing") {
      // Start at 5% when transitioning to preparing
      updateData.progress = 5;
      progressValue = 5;
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(
      `Order ${id} status updated to ${status} | Progress: ${progressValue}%`,
    );

    const io = req.app.get("io");

    // Stop tracking if transitioning away from "preparing"
    if (status !== "preparing") {
      console.log(`Stopping automatic progress tracking for order ${id}`);
      stopOrderTracking(order._id.toString());

      // Emit final progress value when transitioning to ready/served
      if (status === "ready" || status === "served") {
        io.emit("order-progress", {
          orderId: order._id.toString(),
          progress: progressValue,
          status,
          tableNumber: order.tableNumber,
        });
      }
    }

    // If status is changing to "preparing", start automatic progress tracking
    if (status === "preparing") {
      console.log(`Starting automatic progress tracking for order ${id}`);

      // First, stop any existing tracker to prevent duplicates
      stopOrderTracking(order._id.toString());

      // Start tracking - smooth progress updates more frequently
      startOrderTracking(order._id.toString(), io, {
        progressIncrement: 1, // 1% per interval for super smooth progression
        updateInterval: 500, // Update every 500ms = 2x per second = smooth 120 progress/min
      });
    }

    if (status === "served") {
      await Table.updateOne(
        { tableNumber: order.tableNumber },
        {
          status: "available",
          currentCustomer: null,
          orders: [],
          sessionStart: null,
          lastActive: null,
        },
      );
      io.emit("table-freed", order.tableNumber);
      console.log(`Table ${order.tableNumber} freed after order served`);
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`Order ${id} deleted`);

    await Table.updateOne(
      { tableNumber: order.tableNumber },
      {
        status: "available",
        currentCustomer: null,
        orders: [],
        sessionStart: null,
        lastActive: null,
      },
    );

    const io = req.app.get("io");
    io.emit("order:deleted", { orderId: order._id });
    io.emit("table-freed", order.tableNumber);

    console.log(`Table ${order.tableNumber} freed after order deletion`);

    res.json({ message: "Order completed and removed", order });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

export const generatePaymentQR = async (req: Request, res: Response) => {
  try {
    const { tableNumber, total, customerId } = req.body;

    if (!tableNumber || !total) {
      return res
        .status(400)
        .json({ message: "Table number and total are required" });
    }

    const paymentData = {
      tableNumber,
      total,
      customerId,
      timestamp: new Date().toISOString(),
      paymentLink: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payment?table=${tableNumber}&total=${total}`,
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(paymentData));

    res.json({
      message: "QR code generated",
      qrCode,
      paymentData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // order _id

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only pending orders can be canceled
    if (order.status !== "pending") {
      return res.status(400).json({
        message:
          "Cannot cancel order — it has already been accepted or is being prepared",
      });
    }

    // Soft cancel — keep record for analytics/history
    order.status = "canceled";
    order.canceledAt = new Date();
    await order.save();

    const io = req.app.get("io");

    io.emit("order:canceled", {
      orderId: order._id.toString(),
      tableNumber: order.tableNumber,
      status: "canceled",
    });

    const activeOrders = await Order.countDocuments({
      tableNumber: order.tableNumber,
      status: { $nin: ["canceled", "paid", "served"] },
    });

    if (activeOrders === 0) {
      await Table.updateOne(
        { tableNumber: order.tableNumber },
        {
          status: "available",
          currentCustomer: null,
          sessionStart: null,
          lastActive: null,
          // orders: []   ← decide if you want to clear array or keep history
        },
      );

      io.emit("table-freed", order.tableNumber);
      console.log(
        `Table ${order.tableNumber} auto-freed after last order canceled`,
      );
    }

    console.log(`Order ${id} canceled by customer`);

    res.json({
      message: "Order canceled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};
