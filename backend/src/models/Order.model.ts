import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus = "pending" | "cooking" | "ready" | "served" | "paid";

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
      enum: ["pending", "cooking", "ready", "served", "paid"],
      default: "pending",
    },
    totalAmount: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
