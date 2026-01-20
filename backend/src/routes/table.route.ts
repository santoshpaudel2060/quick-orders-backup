import express from "express";
import {
  createTable,
  getAllTables,
  getTableByNumber,
  deleteTable,
} from "../controller/table.controller.js";
import TableModel from "../models/Table.model.js";
import OrderModel from "../models/Order.model.js";
import PaymentModel from "../models/Payment.model.js";

const router = express.Router();

// Admin creates a table
router.post("/create", createTable);

// Get all tables
router.get("/", getAllTables);

// Get a table by tableNumber
router.get("/:tableNumber", getTableByNumber);

// delete a table

router.delete("/:tableNumber", deleteTable);

// ============================================
// ALTERNATIVE ROUTE 3: Free table by table number only (simpler)
// ============================================
// router.post("/free/:tableNumber", async (req, res) => {
//   try {
//     const tableNumber = parseInt(req.params.tableNumber);

//     console.log(`[FREE TABLE ALT] Freeing table ${tableNumber}`);

//     const table = await TableModel.findOne({ tableNumber: tableNumber });

//     if (!table) {
//       return res.status(404).json({
//         success: false,
//         message: `Table ${tableNumber} not found`,
//       });
//     }

//     table.status = "available";
//     table.currentCustomer = null;
//     table.orders = [];
//     await table.save();

//     console.log(`[FREE TABLE ALT] Table ${tableNumber} freed successfully`);

//     res.json({
//       success: true,
//       message: `Table ${tableNumber} freed successfully`,
//       table: table,
//     });
//   } catch (error) {
//     console.error("[FREE TABLE ALT ERROR]", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to free table",
//       error: error instanceof Error ? error.message : String(error),
//     });
//   }
// });

// Free table using transaction_uuid (recommended & secure)

// POST /api/tables/free-by-uuid

router.post("/free-by-uuid", async (req, res) => {
  try {
    const { transactionUuid } = req.body;

    if (!transactionUuid) {
      return res
        .status(400)
        .json({ success: false, message: "transactionUuid is required" });
    }

    console.log(`[TEST FREE BY UUID] Received: ${transactionUuid}`);

    // Find ANY payment with this UUID (ignore status for testing)
    const payment = await PaymentModel.findOne({ transactionUuid });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "No payment found with this UUID" });
    }

    if (!payment.tableNumber) {
      return res
        .status(404)
        .json({ success: false, message: "No tableNumber in this payment" });
    }

    const tableNumber = payment.tableNumber;

    const table = await TableModel.findOneAndUpdate(
      { tableNumber },
      {
        status: "available",
        currentCustomer: null,
        orders: [],
        sessionStart: null,
        lastActive: null,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Table ${tableNumber} freed (test mode)`,
      table,
      paymentStatus: payment.status, // This will show if it's still "pending"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
});

// ============================================
// UTILITY ROUTE: Clear all completed orders (optional cleanup)
// ============================================
router.delete("/cleanup/served", async (req, res) => {
  try {
    // Delete all served/completed orders
    const result = await OrderModel.deleteMany({
      status: "served",
    });

    console.log(`[CLEANUP] Deleted ${result.deletedCount} served orders`);

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} served orders`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[CLEANUP ERROR]", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup orders",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============================================
// DEBUG ROUTE: Check table and order status
// ============================================
router.get("/debug/:tableNumber", async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber);

    // Get table info
    const table = await TableModel.findOne({ tableNumber: tableNumber });

    // Get all orders for this table
    const orders = await OrderModel.find({ tableNumber: tableNumber });

    res.json({
      success: true,
      table: table,
      orders: orders,
      orderCount: orders.length,
    });
  } catch (error) {
    console.error("[DEBUG ERROR]", error);
    res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Free table manually (Admin only - you can add auth later)
router.post("/free/:tableNumber", async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber);

    const table = await TableModel.findOneAndUpdate(
      { tableNumber },
      {
        status: "available",
        currentCustomer: null,
        orders: [],
        sessionStart: null,
        lastActive: null,
      },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json({ success: true, message: "Table freed successfully", table });
  } catch (error) {
    console.error("Free table error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **NEW** - Occupy a table (mark as occupied when customer scans QR and enters name)
router.post("/occupy", async (req, res) => {
  try {
    const { tableNumber, customerId } = req.body;

    if (!tableNumber || !customerId) {
      return res
        .status(400)
        .json({ message: "Table number and customer ID are required" });
    }

    const table = await TableModel.findOne({ tableNumber });

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Check if table is already occupied
    if (table.status === "occupied") {
      return res.status(400).json({
        message: "Table is already occupied",
        currentCustomer: table.currentCustomer,
      });
    }

    // Update table status to occupied
    table.status = "occupied";
    table.currentCustomer = customerId;

    await table.save();

    console.log(`Table ${tableNumber} occupied by ${customerId}`);

    res.json({
      message: "Table occupied successfully",
      table,
      success: true,
    });
  } catch (error) {
    console.error("Error occupying table:", error);
    res
      .status(500)
      .json({ message: "Failed to occupy table", error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
