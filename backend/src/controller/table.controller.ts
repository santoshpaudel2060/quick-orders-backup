import { Request, Response } from "express";
import Table from "../models/Table.model.js";
import QRCode from "qrcode";
import cloudinary from "../config/cloudinary.js";

export const createTable = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.body;

    const existing = await Table.findOne({ tableNumber });
    if (existing)
      return res.status(400).json({ message: "Table already exists" });

    const tableUrl = `https://your-frontend.com/menu?table=${tableNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(tableUrl);

    const uploadResponse = await cloudinary.uploader.upload(qrCodeDataUrl, {
      folder: "table_qrcodes",
      public_id: `table_${tableNumber}`,
    });

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

export const getAllTables = async (req: Request, res: Response) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

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
