import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "canceled";

interface IOrderItem {
  name: string;
  qty: number;
  price: number;
}

interface IOrder extends Document {
  tableNumber: number;
  customerId: string;
  items: IOrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date; // ← optional: when canceled
  cancelReason?: string; // ← optional: reason for cancellation
  completedAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    tableNumber: { type: Number, required: true, index: true },
    customerId: { type: String, required: true },
    items: [
      {
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "paid", "canceled"],
      default: "pending",
    },
    totalAmount: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    canceledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IOrder>("Order", orderSchema);
