import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    transactionUuid: { type: String, required: true, unique: true },
    transactionCode: String,

    amount: Number,
    productCode: String,

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    customerName: {
      type: String,
      trim: true,
    },

    tableNumber: Number, // optional (restaurant case)

    rawResponse: Object, // store full eSewa payload
  },
  { timestamps: true }
);

export default model("Payment", paymentSchema);
