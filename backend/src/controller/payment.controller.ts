import { Request, Response } from "express";
import { generateEsewaSignature } from "../utils/generateEsewaSignature.js";

interface InitiatePaymentBody {
  amount: number;
  tax_amount: number;
  total_amount: number;
  transaction_uuid: string;
  product_service_charge?: number;
  product_delivery_charge?: number;
}

export const initiatePayment = async (
  req: Request<{}, {}, InitiatePaymentBody>,
  res: Response
): Promise<void> => {
  try {
    const {
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_service_charge = 0,
      product_delivery_charge = 0,
    } = req.body;

    if (!amount || !tax_amount || !total_amount || !transaction_uuid) {
      res.status(400).json({ message: "Missing required payment fields" });
      return;
    }

    const fieldsToSign = {
      total_amount,
      transaction_uuid,
      product_code: process.env.ESEWA_MERCHANT_CODE as string,
    };

    const { signature, signedFields } = generateEsewaSignature(
      fieldsToSign,
      process.env.ESEWA_SECRET_KEY as string
    );

    const formData = {
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code: process.env.ESEWA_MERCHANT_CODE,
      product_service_charge,
      product_delivery_charge,
      success_url: process.env.ESEWA_SUCCESS_URL,
      failure_url: process.env.ESEWA_FAILURE_URL,
      signed_field_names: signedFields,
      signature,
    };

    res.status(200).json({ formData });
  } catch (error) {
    console.error("eSewa initiate error:", error);
    res.status(500).json({
      message: "Error initiating eSewa payment",
    });
  }
};
