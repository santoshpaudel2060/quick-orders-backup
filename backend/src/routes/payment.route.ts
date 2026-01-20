// import express, { Request, Response } from "express";
// import { initiatePayment } from "../controller/payment.controller.js";

// const router = express.Router();

// // Initiate payment - POST
// router.post("/initiate-payment", initiatePayment);

// // eSewa success callback - GET
// router.get("/success", (req: Request, res: Response): void => {
//   try {
//     const { data } = req.query as { data?: string };

//     if (!data) {
//       res.status(400).send("Missing data parameter");
//       return;
//     }

//     const decoded = Buffer.from(data, "base64").toString("utf-8");
//     const paymentData = JSON.parse(decoded) as {
//       status: string;
//       transaction_uuid: string;
//       total_amount: number;
//     };

//     if (paymentData.status === "COMPLETE") {
//       res.send(`
//         <html>
//           <head>
//             <style>
//               body {
//                 font-family: Arial, sans-serif;
//                 background-color: #e6f9e6;
//                 display: flex;
//                 justify-content: center;
//                 align-items: center;
//                 height: 100vh;
//                 margin: 0;
//               }
//               .success-container {
//                 background: #4CAF50;
//                 color: white;
//                 padding: 30px 50px;
//                 border-radius: 12px;
//                 box-shadow: 0 4px 15px rgba(0, 128, 0, 0.3);
//                 text-align: center;
//                 max-width: 400px;
//               }
//               .success-container h1 {
//                 margin-bottom: 15px;
//               }
//               .success-container p {
//                 font-size: 1.2em;
//               }
//               .success-container .details {
//                 margin-top: 20px;
//                 background: #3e8e41;
//                 padding: 10px;
//                 border-radius: 8px;
//                 font-size: 0.9em;
//               }
//             </style>
//           </head>
//           <body>
//             <div class="success-container">
//               <h1>Payment Successful ✅</h1>
//               <p>Thank you for your payment.</p>
//               <div class="details">
//                 <strong>Transaction ID:</strong> ${paymentData.transaction_uuid}<br/>
//                 <strong>Amount Paid:</strong> NPR ${paymentData.total_amount}
//               </div>
//             </div>
//           </body>
//         </html>
//       `);
//       return;
//     }

//     res.status(400).send("Payment not completed");
//   } catch (error) {
//     console.error("Error parsing success data:", error);
//     res.status(500).send("Error processing payment success data");
//   }
// });

// // eSewa failure callback - GET
// router.get("/failure", (req: Request, res: Response): void => {
//   console.log("Failure Query:", req.query);
//   res.status(400).send("❌ Payment failed");
//   // Optional redirect:
//   // res.redirect("http://localhost:5173/payment-failure");
// });

// export default router;

// import express, { Request, Response } from "express";
// import crypto from "crypto";
// import axios from "axios";

// const router = express.Router();

// /* =========================
//    eSewa Configuration
// ========================= */

// interface EsewaEnvConfig {
//   paymentUrl: string;
//   verificationUrl: string;
//   merchantCode: string;
//   secretKey: string;
// }

// const ESEWA_CONFIG: {
//   demo: EsewaEnvConfig;
//   production: EsewaEnvConfig;
// } = {
//   demo: {
//     paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
//     verificationUrl:
//       "https://rc-epay.esewa.com.np/api/epay/transaction/status/",
//     merchantCode: "EPAYTEST",
//     secretKey: "8gBm/:&EnhH.1/q",
//   },
//   production: {
//     paymentUrl: "https://epay.esewa.com.np/api/epay/main/v2/form",
//     verificationUrl: "https://epay.esewa.com.np/api/epay/transaction/status/",
//     // merchantCode: "YOUR_MERCHANT_CODE",
//     merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",

//     // secretKey: "YOUR_SECRET_KEY",
//     secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
//   },
// };

// // 👉 Use demo config for now
// const config = ESEWA_CONFIG.demo;

// /* =========================
//    Signature Generator
// ========================= */

// const generateSignature = (
//   totalAmount: string | number,
//   transactionUuid: string,
//   productCode: string
// ): string => {
//   const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

//   return crypto
//     .createHmac("sha256", config.secretKey)
//     .update(message)
//     .digest("base64");
// };

// /* =========================
//    POST /api/payment/initiate
// ========================= */

// router.post("/initiate", async (req: Request, res: Response): Promise<void> => {
//   try {
//     const {
//       tableNumber,
//       customerId,
//       totalAmount,
//       tax = 0,
//       grandTotal,
//     }: {
//       tableNumber: number;
//       customerId: string;
//       totalAmount?: number;
//       tax?: number;
//       grandTotal: number;
//     } = req.body;

//     if (!tableNumber || !customerId || !grandTotal) {
//       res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//       return;
//     }

//     const transactionUuid = `QO-${tableNumber}-${Date.now()}`;

//     const signature = generateSignature(
//       grandTotal.toFixed(2),
//       transactionUuid,
//       config.merchantCode
//     );

//     const paymentData = {
//       amount: (grandTotal - tax).toFixed(2),
//       tax_amount: tax.toFixed(2),
//       total_amount: grandTotal.toFixed(2),
//       transaction_uuid: transactionUuid,
//       product_code: config.merchantCode,
//       product_service_charge: "0",
//       product_delivery_charge: "0",
//       success_url: `${
//         req.headers.origin || "http://localhost:3000"
//       }/payment-success`,
//       failure_url: `${
//         req.headers.origin || "http://localhost:3000"
//       }/payment-failure`,
//       signed_field_names: "total_amount,transaction_uuid,product_code",
//       signature,
//       tableNumber,
//       customerId,
//     };

//     res.status(200).json({
//       success: true,
//       paymentUrl: config.paymentUrl,
//       paymentData,
//     });
//   } catch (error: any) {
//     console.error("Payment initiation error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to initiate payment",
//       error: error.message,
//     });
//   }
// });

// /* =========================
//    GET /api/payment/verify
// ========================= */

// router.get("/verify", async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { data } = req.query as { data?: string };

//     if (!data) {
//       res.status(400).json({
//         success: false,
//         message: "No payment data received",
//       });
//       return;
//     }

//     const decodedData = JSON.parse(
//       Buffer.from(data, "base64").toString("utf-8")
//     ) as {
//       transaction_code: string;
//       status: string;
//       total_amount: string;
//       transaction_uuid: string;
//       product_code: string;
//       signature: string;
//     };

//     const expectedSignature = generateSignature(
//       decodedData.total_amount,
//       decodedData.transaction_uuid,
//       decodedData.product_code
//     );

//     if (decodedData.signature !== expectedSignature) {
//       res.status(400).json({
//         success: false,
//         message: "Invalid signature",
//       });
//       return;
//     }

//     const verificationResponse = await axios.get(
//       `${config.verificationUrl}?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`
//     );

//     if (verificationResponse.data.status === "COMPLETE") {
//       res.json({
//         success: true,
//         message: "Payment verified successfully",
//         transaction: {
//           transactionCode: decodedData.transaction_code,
//           transactionUuid: decodedData.transaction_uuid,
//           amount: decodedData.total_amount,
//           status: "completed",
//         },
//       });
//       return;
//     }

//     res.status(400).json({
//       success: false,
//       message: "Payment verification failed",
//       status: verificationResponse.data.status,
//     });
//   } catch (error: any) {
//     console.error("Payment verification error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify payment",
//       error: error.message,
//     });
//   }
// });

// /* =========================
//    POST /api/payment/verify-transaction
// ========================= */

// router.post(
//   "/verify-transaction",
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       const {
//         transaction_uuid,
//         total_amount,
//         product_code,
//       }: {
//         transaction_uuid: string;
//         total_amount: string;
//         product_code: string;
//       } = req.body;

//       if (!transaction_uuid || !total_amount || !product_code) {
//         res.status(400).json({
//           success: false,
//           message: "Missing required parameters",
//         });
//         return;
//       }

//       const response = await axios.get(
//         `${config.verificationUrl}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`
//       );

//       if (response.data.status === "COMPLETE") {
//         res.json({
//           success: true,
//           verified: true,
//           transaction: response.data,
//         });
//         return;
//       }

//       res.json({
//         success: true,
//         verified: false,
//         status: response.data.status,
//       });
//     } catch (error: any) {
//       console.error("Transaction verification error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to verify transaction",
//         error: error.message,
//       });
//     }
//   }
// );

// /* =========================
//    GET /api/payment/status/:transactionUuid
// ========================= */

// router.get(
//   "/status/:transactionUuid",
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { transactionUuid } = req.params;

//       res.json({
//         success: true,
//         transaction: {
//           transactionUuid,
//           status: "pending",
//           amount: 0,
//           createdAt: new Date(),
//         },
//       });
//     } catch (error: any) {
//       console.error("Status check error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to check payment status",
//         error: error.message,
//       });
//     }
//   }
// );

// export default router;

// import express, { Request, Response } from "express";
// import crypto from "crypto";
// import axios from "axios";
// import Payment from "../models/Payment.model.js"; // <-- Your Payment model
// // import { isAdminMiddleware } from "../middleware/auth"; // optional: secure admin routes

// const router = express.Router();

// /* =========================
//    eSewa Configuration
// ========================= */

// interface EsewaEnvConfig {
//   paymentUrl: string;
//   verificationUrl: string;
//   merchantCode: string;
//   secretKey: string;
// }

// const ESEWA_CONFIG: {
//   demo: EsewaEnvConfig;
//   production: EsewaEnvConfig;
// } = {
//   demo: {
//     paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
//     verificationUrl:
//       "https://rc-epay.esewa.com.np/api/epay/transaction/status/",
//     merchantCode: "EPAYTEST",
//     secretKey: "8gBm/:&EnhH.1/q",
//   },
//   production: {
//     paymentUrl: "https://epay.esewa.com.np/api/epay/main/v2/form",
//     verificationUrl: "https://epay.esewa.com.np/api/epay/transaction/status/",
//     merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
//     secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
//   },
// };

// const config = ESEWA_CONFIG.demo;

// /* =========================
//    Signature Generator
// ========================= */
// const generateSignature = (
//   totalAmount: string | number,
//   transactionUuid: string,
//   productCode: string
// ): string => {
//   const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

//   return crypto
//     .createHmac("sha256", config.secretKey)
//     .update(message)
//     .digest("base64");
// };

// /* =========================
//    POST /api/payment/initiate
// ========================= */
// router.post("/initiate", async (req: Request, res: Response) => {
//   try {
//     const {
//       tableNumber,
//       // customerId,
//       totalAmount,
//       tax = 0,
//       grandTotal,
//     } = req.body;

//     if (!tableNumber || !grandTotal) {
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

//     // ✅ Save payment as pending
//     await Payment.create({
//       transactionUuid,
//       amount: grandTotal,
//       status: "pending",
//       tableNumber,
//       // userId: customerId,
//       productCode: config.merchantCode,
//     });

//     const paymentData = {
//       amount: (grandTotal - tax).toFixed(2),
//       tax_amount: tax.toFixed(2),
//       total_amount: grandTotal.toFixed(2),
//       transaction_uuid: transactionUuid,
//       product_code: config.merchantCode,
//       product_service_charge: "0",
//       product_delivery_charge: "0",
//       success_url: `${
//         req.headers.origin || "http://localhost:3000"
//       }/payment-success`,
//       failure_url: `${
//         req.headers.origin || "http://localhost:3000"
//       }/payment-failure`,
//       signed_field_names: "total_amount,transaction_uuid,product_code",
//       signature,
//       tableNumber,
//       // customerId,
//     };

//     res.status(200).json({
//       success: true,
//       paymentUrl: config.paymentUrl,
//       paymentData,
//     });
//   } catch (error: any) {
//     console.error("Payment initiation error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to initiate payment",
//       error: error.message,
//     });
//   }
// });

// /* =========================
//    GET /api/payment/success
//    eSewa redirect URL
// ========================= */
// router.get("/success", async (req: Request, res: Response) => {
//   try {
//     const { data } = req.query as { data?: string };

//     if (!data) {
//       res.status(400).send("No payment data received");
//       return;
//     }

//     const decodedData = JSON.parse(
//       Buffer.from(data, "base64").toString("utf-8")
//     );

//     const expectedSignature = generateSignature(
//       decodedData.total_amount,
//       decodedData.transaction_uuid,
//       decodedData.product_code
//     );

//     if (decodedData.signature !== expectedSignature) {
//       res.status(400).send("Invalid signature");
//       return;
//     }

//     // ✅ Verify with eSewa API
//     const verificationResponse = await axios.get(
//       `${config.verificationUrl}?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`
//     );

//     let status: "completed" | "failed" = "failed";
//     if (verificationResponse.data.status === "COMPLETE") status = "completed";

//     // ✅ Update payment in DB
//     const updatedPayment = await Payment.findOneAndUpdate(
//       { transactionUuid: decodedData.transaction_uuid },
//       {
//         status,
//         transactionCode: decodedData.transaction_code,
//         rawResponse: decodedData,
//       }
//     );

//     console.log("Payment after update:", updatedPayment);

//     // Redirect to frontend success/failure page
//     const redirectUrl =
//       status === "completed"
//         ? `${req.headers.origin}/payment-success?data=${data}`
//         : `${req.headers.origin}/payment-failure`;

//     res.redirect(redirectUrl);
//   } catch (error) {
//     console.error("Payment success processing error:", error);
//     res.status(500).send("Payment processing failed");
//   }
// });

// /* =========================
//    GET /api/payment/failure
// ========================= */
// router.get("/failure", async (req: Request, res: Response) => {
//   try {
//     const { data } = req.query as { data?: string };

//     if (!data) {
//       res.status(400).send("Payment failed");
//       return;
//     }

//     const decodedData = JSON.parse(
//       Buffer.from(data, "base64").toString("utf-8")
//     );

//     await Payment.findOneAndUpdate(
//       { transactionUuid: decodedData.transaction_uuid },
//       { status: "failed", rawResponse: decodedData }
//     );

//     res.redirect(`${req.headers.origin}/payment-failure`);
//   } catch (error) {
//     console.error("Payment failure processing error:", error);
//     res.status(500).send("Payment failure processing failed");
//   }
// });

// /* =========================
//    GET /api/admin/payments
//    List all payments for Admin
// ========================= */
// // router.get(
// //   "/admin/payments",
// //   // isAdminMiddleware,
// //   async (req: Request, res: Response) => {
// //     try {
// //       const payments = await Payment.find()
// //         .sort({ createdAt: -1 })
// //         .populate("userId", "name email");

// //       res.json(payments);
// //     } catch (error: any) {
// //       console.error("Admin payments fetch error:", error);
// //       res
// //         .status(500)
// //         .json({ success: false, message: "Failed to fetch payments" });
// //     }
// //   }
// // );

// router.get("/admin/payments", async (req: Request, res: Response) => {
//   try {
//     const payments = await Payment.find().sort({ createdAt: -1 });
//     res.json({ success: true, payments });
//   } catch (error: any) {
//     console.error("Admin payments fetch error:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch payments" });
//   }
// });

// export default router;

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
  productCode: string
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
      config.merchantCode
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

      success_url: "http://localhost:5000/api/payments/success",
      failure_url: "http://localhost:5000/api/payments/failure",

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
      return res.redirect("http://localhost:3000/payment-failure");
    }

    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8")
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
      return res.redirect("http://localhost:3000/payment-failure");
    }
    // === END FIX ===

    // Verify with eSewa API
    const verificationResponse = await axios.get(
      `${config.verificationUrl}?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`
    );
    console.log("eSewa verification:", verificationResponse.data);

    let status: "completed" | "failed" = "failed";
    if (verificationResponse.data.status === "COMPLETE") {
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
      { new: true }
    );

    console.log("Payment updated to:", updatedPayment?.status);

    // Redirect to frontend
    const frontendUrl =
      status === "completed"
        ? `http://localhost:3000/payment-success?data=${data}`
        : "http://localhost:3000/payment-failure";

    res.redirect(frontendUrl);
  } catch (error: any) {
    console.error("Success route error:", error);
    res.redirect("http://localhost:3000/payment-failure");
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
      Buffer.from(data, "base64").toString("utf-8")
    );
    console.log("Failure: Payment failed", decodedData);

    await Payment.findOneAndUpdate(
      { transactionUuid: decodedData.transaction_uuid },
      { status: "failed", rawResponse: decodedData }
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
