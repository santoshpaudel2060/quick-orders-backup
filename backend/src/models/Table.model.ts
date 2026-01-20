import mongoose, { Document, Schema } from "mongoose";

interface ITable extends Document {
  tableNumber: number;
  qrCodeUrl?: string;
  status: "available" | "occupied";
  currentCustomer: string | null;
  sessionStart: Date | null;
  lastActive: Date | null;
  orders: Array<{
    items: Array<{
      name: string;
      qty: number;
      price: number;
    }>;
    createdAt: Date;
  }>;
}

const tableSchema = new Schema<ITable>({
  tableNumber: { type: Number, unique: true },
  qrCodeUrl: String,
  status: {
    type: String,
    enum: ["available", "occupied"],
    default: "available",
  },
  currentCustomer: { type: String, default: null },
  sessionStart: { type: Date, default: null },
  lastActive: { type: Date, default: null },
  orders: [
    {
      items: [
        {
          name: String,
          qty: Number,
          price: Number,
        },
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model<ITable>("Table", tableSchema);
