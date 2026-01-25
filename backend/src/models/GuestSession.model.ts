import mongoose, { Schema, Document } from "mongoose";

export interface IGuestSession extends Document {
  sessionId: string;
  tableNumber: number;
  customerName: string;
  customerId: string;
  cart: {
    items: Array<{
      _id: string;
      name: string;
      category: string;
      price: number;
      image: string;
      quantity: number;
    }>;
    totalAmount: number;
  };
  sessionStartTime: Date;
  lastActivityTime: Date;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date; // TTL index will auto-delete after this time
}

const GuestSessionSchema = new Schema<IGuestSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    cart: {
      items: [
        {
          _id: String,
          name: String,
          category: String,
          price: Number,
          image: String,
          quantity: Number,
        },
      ],
      totalAmount: {
        type: Number,
        default: 0,
      },
    },
    sessionStartTime: {
      type: Date,
      required: true,
    },
    lastActivityTime: {
      type: Date,
      default: () => new Date(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB will automatically delete documents 0 seconds after this time
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient querying
GuestSessionSchema.index({ tableNumber: 1, customerId: 1 });

export default mongoose.model<IGuestSession>(
  "GuestSession",
  GuestSessionSchema,
);
