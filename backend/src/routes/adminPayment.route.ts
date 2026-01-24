import express from "express";
import Payment from "../models/Payment.model.js";

const router = express.Router();

router.get("/payments", async (req, res) => {
  const payments = await Payment.find({})
    .select("transactionUuid amount status tableNumber customerName createdAt")
    .sort({ createdAt: -1 });

  res.json(payments);
});

export default router;
