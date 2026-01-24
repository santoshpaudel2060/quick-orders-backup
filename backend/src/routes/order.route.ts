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
router.delete("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(`[CANCEL ORDER] Order ID: ${orderId} deleted`);

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      orderId,
    });
  } catch (err) {
    console.error("[CANCEL ORDER ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
});

// // DELETE /api/orders/:orderId
// router.delete("/:orderId", async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     // Find the order first
//     const order = await OrderModel.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     // Only pending orders can be cancelled
//     if (order.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: "Only pending orders can be cancelled",
//       });
//     }

//     // Delete the order
//     await OrderModel.findByIdAndDelete(orderId);
//     const io = req.app.get("io");
//     // Emit socket event for kitchen (real-time update)
//     io.emit("order:deleted", { orderId });

//     console.log(`[CANCEL ORDER] Order ID: ${orderId} cancelled by customer`);

//     return res.json({
//       success: true,
//       message: "Order cancelled successfully",
//       orderId,
//     });
//   } catch (err) {
//     console.error("[CANCEL ORDER ERROR]", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to cancel order",
//     });
//   }
// });

router.delete("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only pending orders can be cancelled
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    // Delete the order
    await OrderModel.findByIdAndDelete(orderId);

    console.log(`[CANCEL ORDER] Order ID: ${orderId} cancelled by customer`);
    const io = req.app.get("io");
    // Emit real-time event to kitchen
    io.emit("order-cancelled", { orderId });

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      orderId,
    });
  } catch (err) {
    console.error("[CANCEL ORDER ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
});

export default router;
