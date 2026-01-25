import Table from "../models/Table.model.js";
import Order from "../models/Order.model.js";
import { Request, Response } from "express";
import QRCode from "qrcode";

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
    });
    await order.save();

    const io = req.app.get("io");
    io.emit("new-order", order);

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

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        completedAt:
          status === "served" || status === "paid" ? new Date() : undefined,
      },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`Order ${id} status updated to ${status}`);

    const io = req.app.get("io");
    io.emit("order-status-updated", order);

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
