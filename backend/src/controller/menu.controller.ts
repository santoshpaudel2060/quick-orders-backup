import { Request, Response } from "express";
import Menu from "../models/menu.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // your helper
import cloudinary from "../config/cloudinary.js"; // direct access if needed

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, price, category, image } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, and category are required" });
    }

    let imageUrl: string;

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "menu-items");
    } else if (typeof image === "string" && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "menu-items",
        resource_type: "image",
      });
      imageUrl = uploadRes.secure_url;
    } else if (typeof image === "string" && image.startsWith("http")) {
      imageUrl = image;
    } else {
      return res
        .status(400)
        .json({ message: "Image is required (file, base64, or URL)" });
    }

    const newMenuItem = await Menu.create({
      name,
      price: parseFloat(price),
      category,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem: newMenuItem,
    });
  } catch (error: any) {
    console.error("Create menu item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const menuItems = await Menu.find().sort({ createdAt: -1 });
    res.status(200).json(menuItems);
  } catch (error: any) {
    console.error("Get menu items error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, category, image } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, and category are required" });
    }

    const updateData: any = {
      name,
      price: parseFloat(price),
      category,
    };

    let imageUrl: string | undefined;

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "menu-items");
      updateData.image = imageUrl;
    } else if (typeof image === "string" && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "menu-items",
      });
      updateData.image = uploadRes.secure_url;
    } else if (typeof image === "string" && image.startsWith("http")) {
      updateData.image = image;
    }

    const updated = await Menu.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem: updated,
    });
  } catch (error: any) {
    console.error("Update menu item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Menu.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (deleted.image) {
      const publicId = deleted.image.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`menu-items/${publicId}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
