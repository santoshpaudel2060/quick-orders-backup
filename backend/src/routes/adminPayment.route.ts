import express from "express";
import Payment from "../models/Payment.model.js";

const router = express.Router();

// 🔐 Protect with admin auth middleware later
// router.get("/payments", async (req, res) => {
//   try {
//     const payments = await Payment.find()
//       .sort({ createdAt: -1 })
//       .populate("userId", "name email");

//     res.json(payments);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch payments" });
//   }
// });

router.get("/payments", async (req, res) => {
  const payments = await Payment.find({})
    .select("transactionUuid amount status tableNumber customerName createdAt")
    .sort({ createdAt: -1 });

  res.json(payments);
});

export default router;
