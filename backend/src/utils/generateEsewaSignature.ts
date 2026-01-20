import crypto from "crypto";

export interface EsewaSignatureFields {
  total_amount: number | string;
  transaction_uuid: string;
  product_code: string;
}

export interface EsewaSignatureResult {
  signature: string;
  signedFields: string;
}

export const generateEsewaSignature = (
  fields: EsewaSignatureFields,
  secretKey: string
): EsewaSignatureResult => {
  const signedFields = Object.keys(fields).join(",");

  const concatenated = Object.entries(fields)
    .map(([key, val]) => `${key}=${val}`)
    .join(",");

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(concatenated);

  const signature = hmac.digest("base64");

  return { signature, signedFields };
};
