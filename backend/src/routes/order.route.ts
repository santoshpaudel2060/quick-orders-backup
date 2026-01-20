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
router.get("/all", getAllOrders); // This one works with: /api/orders/all

router.get("/table/:tableNumber", getTableOrders);

// Update order status
router.put("/:id/status", updateOrderStatus);

// Delete order
// router.delete("/:id", deleteOrder);

router.delete("/customer/:tableNumber/:customerId", async (req, res) => {
  try {
    const { tableNumber, customerId } = req.params;

    console.log(
      `[DELETE ORDERS] Table: ${tableNumber}, Customer: ${customerId}`
    );

    // Delete all orders for this customer at this table
    const result = await OrderModel.deleteMany({
      tableNumber: parseInt(tableNumber),
      customerId: customerId,
    });

    console.log(`[DELETE ORDERS] Deleted ${result.deletedCount} orders`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} orders`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[DELETE ORDERS ERROR]", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete orders",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
