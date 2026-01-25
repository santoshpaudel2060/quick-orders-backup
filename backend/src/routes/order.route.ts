import express from "express";
import {
  addOrder,
  getBill,
  freeTable,
  generatePaymentQR,
  getAllOrders,
  getTableOrders,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
} from "../controller/order.controller.js";
import OrderModel from "../models/Order.model.js";

const router = express.Router();

// Order management
router.post("/add", addOrder);
router.post("/bill", getBill);
router.post("/free", freeTable);
router.post("/generate-qr", generatePaymentQR);

// Get orders - BOTH endpoints for compatibility
router.get("/", getAllOrders); // This one works with: /api/orders

router.get("/table/:tableNumber", getTableOrders);

// Update order status
router.put("/:id/status", updateOrderStatus);

// Delete order
// router.delete("/:id", deleteOrder);

router.post("/:id/cancel", cancelOrder);

router.delete("/:id", deleteOrder);

export default router;
