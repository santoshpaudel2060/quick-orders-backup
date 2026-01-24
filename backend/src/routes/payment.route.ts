zz;

import express, { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import Payment from "../models/Payment.model.js"; // Your Payment model
import OrderModel from "../models/Order.model.js";
import TableModel from "../models/Table.model.js";

const router = express.Router();

/* =========================
   eSewa Configuration
========================= */
interface EsewaEnvConfig {
  paymentUrl: string;
  verificationUrl: string;
  merchantCode: string;
  secretKey: string;
}
const BackendUrl = process.env.BACKEND_URL;
const ESEWA_CONFIG: {
  demo: EsewaEnvConfig;
  production: EsewaEnvConfig;
} = {
  demo: {
    paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    verificationUrl:
      "https://rc-epay.esewa.com.np/api/epay/transaction/status/",
    merchantCode: "EPAYTEST",
    secretKey: "8gBm/:&EnhH.1/q",
  },
  production: {
    paymentUrl: "https://epay.esewa.com.np/api/epay/main/v2/form",
    verificationUrl: "https://epay.esewa.com.np/api/epay/transaction/status/",
    merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
    secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
  },
};

const config = ESEWA_CONFIG.demo;

/* =========================
   Signature Generator
========================= */
const generateSignature = (
  totalAmount: string | number,
  transactionUuid: string,
  productCode: string,
): string => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac("sha256", config.secretKey)
    .update(message)
    .digest("base64");
};

/* =========================
   POST /api/payment/initiate
========================= */
// router.post("/initiate", async (req: Request, res: Response) => {
//   try {
//     const { tableNumber, totalAmount, tax = 0, grandTotal } = req.body;

//     if (!tableNumber || !grandTotal) {
//       console.log("Initiate: Missing required fields", req.body);
//       res
//         .status(400)
//         .json({ success: false, message: "Missing required fields" });
//       return;
//     }

//     const transactionUuid = `QO-${tableNumber}-${Date.now()}`;
//     const signature = generateSignature(
//       grandTotal.toFixed(2),
//       transactionUuid,
//       config.merchantCode
//     );

//     console.log("Initiate: Creating pending payment in DB", {
//       transactionUuid,
//       grandTotal,
//       tableNumber,
//     });

//     // Save payment as pending
//     const payment = await Payment.create({
//       transactionUuid,
//       amount: grandTotal,
//       status: "completed",
//       tableNumber,
//       productCode: config.merchantCode,
//     });

//     console.log("Initiate: Payment saved", payment);

// const paymentData = {
//   amount: (grandTotal - tax).toFixed(2),
//   tax_amount: tax.toFixed(2),
//   total_amount: grandTotal.toFixed(2),
//   transaction_uuid: transactionUuid,
//   product_code: config.merchantCode,
//   product_service_charge: "0",
//   product_delivery_charge: "0",
//   success_url: `${
//     req.headers.origin || "http://localhost:5000"
//   }/payment-success`,
//   failure_url: `${
//     req.headers.origin || "http://localhost:5000"
//   }/payment-failure`,
//   signed_field_names: "total_amount,transaction_uuid,product_code",
//   signature,
//   tableNumber,
// };

//     res
//       .status(200)
//       .json({ success: true, paymentUrl: config.paymentUrl, paymentData });
//   } catch (error: any) {
//     console.error("Initiate: Payment initiation error", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to initiate payment",
//       error: error.message,
//     });
//   }
// });

router.post("/initiate", async (req: Request, res: Response) => {
  try {
    const { tableNumber, totalAmount, tax = 0, grandTotal } = req.body;

    if (!tableNumber || !grandTotal) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Find the latest unpaid or relevant order for this table
    const order = await OrderModel.findOne({
      tableNumber,
      status: { $in: ["served", "ready"] }, // or whatever status means "ready to pay"
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No active order found for this table",
      });
    }

    // Optional: Validate amount matches
    if (Math.abs(order.totalAmount - grandTotal) > 1) {
      console.warn("Amount mismatch", {
        orderTotal: order.totalAmount,
        grandTotal,
      });
      // You can choose to allow or block
    }

    const transactionUuid = `QO-${tableNumber}-${Date.now()}`;

    const signature = generateSignature(
      grandTotal.toFixed(2),
      transactionUuid,
      config.merchantCode,
    );

    // Create payment with link to order and customer name
    const payment = await Payment.create({
      transactionUuid,
      amount: grandTotal,
      status: "pending", // ← Should start as pending!
      tableNumber,
      productCode: config.merchantCode,
      orderId: order._id,
      customerName: order.customerId, // ← This is the name like "santosh"
    });

    const paymentData = {
      amount: (grandTotal - tax).toFixed(2),
      tax_amount: tax.toFixed(2),
      total_amount: grandTotal.toFixed(2),
      transaction_uuid: transactionUuid,
      product_code: config.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",

      success_url: `${BackendUrl}/api/payment/success`,
      failure_url: `${BackendUrl}/api/payment/failure`,

      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
      tableNumber,
    };

    res
      .status(200)
      .json({ success: true, paymentUrl: config.paymentUrl, paymentData });
  } catch (error: any) {
    console.error("Initiate: Payment initiation error", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
      error: error.message,
    });
  }
});

/* =========================



   GET /api/payment/success
   eSewa redirect URL
========================= */
router.get("/success", async (req: Request, res: Response) => {
  try {
    const { data } = req.query as { data?: string };
    if (!data) {
      console.log("Success: No data received");
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure`);
    }

    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    );
    console.log("Success: Decoded data", decodedData);

    // === DYNAMIC SIGNATURE VERIFICATION (Fix for Invalid signature) ===
    const signedFieldNames = decodedData.signed_field_names.split(",");
    const messageParts: string[] = [];

    for (const field of signedFieldNames) {
      if (decodedData[field] !== undefined) {
        messageParts.push(`${field}=${decodedData[field]}`);
      }
    }

    const message = messageParts.join(",");
    const expectedSignature = crypto
      .createHmac("sha256", config.secretKey)
      .update(message)
      .digest("base64");

    console.log("Signature message:", message);
    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", decodedData.signature);
    console.log("Match?", decodedData.signature === expectedSignature);

    if (decodedData.signature !== expectedSignature) {
      console.log("❌ Invalid signature - rejecting");
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure`);
    }
    // === END FIX ===

    // Verify with eSewa API
    const verificationResponse = await axios.get(
      `${config.verificationUrl}?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`,
    );
    console.log("eSewa verification:", verificationResponse.data);

    const verificationData = verificationResponse.data as {
      status: string;
      [key: string]: any;
    };

    let status: "completed" | "failed" = "failed";
    if (verificationData.status === "COMPLETE") {
      status = "completed";
    }

    // Update DB
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionUuid: decodedData.transaction_uuid },
      {
        status,
        transactionCode: decodedData.transaction_code,
        rawResponse: decodedData,
      },
      { new: true },
    );

    console.log("Payment updated to:", updatedPayment?.status);

    // Redirect to frontend
    const frontendUrl =
      status === "completed"
        ? `${process.env.FRONTEND_URL}/payment-success?data=${data}`
        : `${process.env.FRONTEND_URL}/payment-failure`;

    res.redirect(frontendUrl);
    console.log("Success: Redirecting to", frontendUrl);
  } catch (error: any) {
    console.error("Success route error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failure`);
  }
});

/* =========================
   GET /api/payment/failure
========================= */
router.get("/failure", async (req: Request, res: Response) => {
  try {
    const { data } = req.query as { data?: string };
    if (!data) {
      res.status(400).send("Payment failed");
      return;
    }

    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    );
    console.log("Failure: Payment failed", decodedData);

    await Payment.findOneAndUpdate(
      { transactionUuid: decodedData.transaction_uuid },
      { status: "failed", rawResponse: decodedData },
    );

    res.redirect(`${req.headers.origin}/payment-failure`);
  } catch (error) {
    console.error("Failure: Payment failure processing error", error);
    res.status(500).send("Payment failure processing failed");
  }
});

/* =========================  
   GET /api/admin/payments
   Admin fetch all payments
========================= */
router.get("/admin/payments", async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    console.log("Admin: Fetching all payments", payments.length);
    res.json({ success: true, payments });
  } catch (error: any) {
    console.error("Admin: Fetch payments error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
});

export default router;
