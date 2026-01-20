import { Request, Response } from "express";
import Table from "../models/Table.model.js";
import QRCode from "qrcode";
import cloudinary from "../config/cloudinary.js";

// Create a new table
export const createTable = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.body;

    // Check if table already exists
    const existing = await Table.findOne({ tableNumber });
    if (existing)
      return res.status(400).json({ message: "Table already exists" });

    // Generate QR code URL for table
    const tableUrl = `https://your-frontend.com/menu?table=${tableNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(tableUrl);

    // Upload QR code to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(qrCodeDataUrl, {
      folder: "table_qrcodes",
      public_id: `table_${tableNumber}`,
    });

    // Save table in DB
    const table = await Table.create({
      tableNumber,
      qrCodeUrl: uploadResponse.secure_url,
    });

    res.status(201).json({ message: "Table created", table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all tables
export const getAllTables = async (req: Request, res: Response) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get a single table by tableNumber
export const getTableByNumber = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.params;

    const table = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.status(200).json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.params;
    const table = await Table.findOneAndDelete({
      tableNumber: Number(tableNumber),
    });
    if (!table) return res.status(404).json({ message: "Table not found" });
    res.status(200).json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
