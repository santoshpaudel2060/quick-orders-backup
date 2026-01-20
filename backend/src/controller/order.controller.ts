import Table from "../models/Table.model.js";
import Order from "../models/Order.model.js";
import { Request, Response } from "express";
import QRCode from "qrcode";

// Add order for table (guest or user)
export const addOrder = async (req: Request, res: Response) => {
  try {
    const { tableNumber, customerId, items } = req.body;

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

    // Create order document for tracking
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.qty,
      0
    );
    const order = new Order({
      tableNumber,
      customerId,
      items,
      status: "pending",
      totalAmount,
    });
    await order.save();

    // 🔥 Emit WebSocket event for new order
    const io = req.app.get("io");
    io.emit("new-order", order);

    res.json({ message: "Order added", table, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add order" });
  }
};

// Get total bill
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

// Free table (manual checkout)

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

    // 🔥 Emit WebSocket event that table is freed
    const io = req.app.get("io");
    io.emit("table-freed", tableNumber);

    console.log(`Table ${tableNumber} freed successfully`);

    res.json({ message: "Table freed successfully" });
  } catch (error) {
    console.error("Free table error:", error);
    res.status(500).json({ message: "Failed to free table" });
  }
};

// Get all orders for a table
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

// FIXED: Get all active orders (for kitchen & admin)
// Changed "cooking" to "preparing" to match frontend
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({
      status: { $in: ["pending", "preparing", "ready"] }, // FIXED: Changed "cooking" to "preparing"
    }).sort({ createdAt: 1 }); // Ascending order - oldest first

    console.log(`Found ${orders.length} active orders`);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// FIXED: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Get ID from URL params
    const { status } = req.body; // Get status from body

    // FIXED: Changed "cooking" to "preparing"
    const validStatuses = ["pending", "preparing", "ready", "served", "paid"];

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
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`Order ${id} status updated to ${status}`);

    // 🔥 Emit WebSocket event for status update
    const io = req.app.get("io");
    io.emit("order-status-updated", order);

    // If order is served, mark table as ready for next customer
    if (status === "served") {
      await Table.updateOne(
        { tableNumber: order.tableNumber },
        {
          status: "available",
          currentCustomer: null,
          orders: [],
          sessionStart: null,
          lastActive: null,
        }
      );
      // 🔥 Emit table freed event
      io.emit("table-freed", order.tableNumber);
      console.log(`Table ${order.tableNumber} freed after order served`);
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// Delete/Complete order
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`Order ${id} deleted`);

    // Free up the table
    await Table.updateOne(
      { tableNumber: order.tableNumber },
      {
        status: "available",
        currentCustomer: null,
        orders: [],
        sessionStart: null,
        lastActive: null,
      }
    );

    // 🔥 Emit table freed event
    const io = req.app.get("io");
    io.emit("table-freed", order.tableNumber);

    console.log(`Table ${order.tableNumber} freed after order deletion`);

    res.json({ message: "Order completed and removed", order });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

// Generate QR code for payment
export const generatePaymentQR = async (req: Request, res: Response) => {
  try {
    const { tableNumber, total, customerId } = req.body;

    if (!tableNumber || !total) {
      return res
        .status(400)
        .json({ message: "Table number and total are required" });
    }

    // Create payment data
    const paymentData = {
      tableNumber,
      total,
      customerId,
      timestamp: new Date().toISOString(),
      paymentLink: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payment?table=${tableNumber}&total=${total}`,
    };

    // Generate QR code
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
