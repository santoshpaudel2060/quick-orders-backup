import e from "express";
import mongoose from "mongoose";

interface IMenu {
  name: string;
  price: number;
  category: "main" | "Appetizer" | "Dessert" | "Beverage";
  image: string;
}

const menuSchema = new mongoose.Schema<IMenu>({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ["main", "Appetizer", "Dessert", "Beverage"],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

export const Menu = mongoose.model<IMenu>("Menu", menuSchema);
export default Menu;
