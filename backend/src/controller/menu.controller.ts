// // import { Request, Response } from "express";

// // import Menu from "../models/menu.model.js";

// // export const createMenuItem = async (req: Request, res: Response) => {
// //   try {
// //     const { name, price, category, image } = req.body;
// //     if (!name || !price || !category || !image) {
// //       return res.status(400).json({ message: "All fields are required" });
// //     }
// //     const newMenuItem = await Menu.create({
// //       name,
// //       price,
// //       category,
// //       image,
// //     });
// //     res
// //       .status(201)
// //       .json({ message: "Menu item created", menuItem: newMenuItem });
// //   } catch (error) {
// //     res.status(500).json({ message: "Server error", error });
// //   }
// // };
// import { Request, Response } from "express";
// import Menu from "../models/menu.model.js";
// import { uploadToCloudinary } from "../utils/cloudinary.js";
// import cloudinary from "../config/cloudinary.js";

// export const createMenuItem = async (req: Request, res: Response) => {
//   try {
//     const { name, price, category, image } = req.body;

//     if (!name || !price || !category) {
//       return res
//         .status(400)
//         .json({ message: "Name, price & category required" });
//     }

//     let imageUrl: string | undefined;

//     // ✅ CASE 1: multipart/form-data (file)
//     if (req.file) {
//       imageUrl = await uploadToCloudinary(req.file.buffer, "menu-items");
//     }

//     // ✅ CASE 2: JSON with image URL
//     else if (typeof image === "string" && image.startsWith("http")) {
//       imageUrl = image;
//     }

//     // ✅ CASE 3: JSON with base64 image
//     else if (typeof image === "string" && image.startsWith("data:image")) {
//       const uploadRes = await cloudinary.uploader.upload(image, {
//         folder: "menu-items",
//         resource_type: "image",
//       });
//       imageUrl = uploadRes.secure_url;
//     }

//     if (!imageUrl) {
//       return res.status(400).json({ message: "Image is required" });
//     }

//     const newMenuItem = await Menu.create({
//       name,
//       price,
//       category,
//       image: imageUrl,
//     });

//     res.status(201).json({
//       message: "Menu item created",
//       menuItem: newMenuItem,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Get all menu items
// export const getMenuItems = async (req: Request, res: Response) => {
//   try {
//     const menuItems = await Menu.find();
//     res.status(200).json(menuItems);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err });
//   }
// };

// // Update menu item
// // export const updateMenuItem = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const { name, price, category, image } = req.body;

// //     const updated = await Menu.findByIdAndUpdate(
// //       id,
// //       { name, price, category, image },
// //       { new: true }
// //     );
// //     if (!updated) return res.status(404).json({ message: "Item not found" });

// //     res.status(200).json(updated);
// //   } catch (err) {
// //     res.status(500).json({ message: "Server error", error: err });
// //   }
// // };

// export const updateMenuItem = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     // Apply multer middleware directly or via route
//     // This function expects req to have been processed by upload.single("image")

//     const { name, price, category } = req.body;

//     if (!name || !price || !category) {
//       return res
//         .status(400)
//         .json({ message: "Name, price, and category are required" });
//     }

//     const updateData: any = {
//       name,
//       price: parseFloat(price),
//       category,
//     };

//     // If a new image file is uploaded
//     if (req.file) {
//       // Upload to Cloudinary (recommended)
//       const result = await new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.v2.uploader.upload_stream(
//           { folder: "menu_items" },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve(result);
//           }
//         );
//         uploadStream.end(req.file.buffer);
//       });

//       updateData.image = (result as any).secure_url;

//       // If using local storage:
//       // updateData.image = `/uploads/${req.file.filename}`;
//     }
//     // If no new file, keep old image (no change needed)

//     const updated = await Menu.findByIdAndUpdate(id, updateData, { new: true });

//     if (!updated) {
//       return res.status(404).json({ message: "Menu item not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Menu item updated successfully",
//       menuItem: updated,
//     });
//   } catch (err: any) {
//     console.error("Update menu item error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // Delete menu item
// export const deleteMenuItem = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const deleted = await Menu.findByIdAndDelete(id);
//     if (!deleted) return res.status(404).json({ message: "Item not found" });

//     res.status(200).json({ message: "Deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err });
//   }
// };

import { Request, Response } from "express";
import Menu from "../models/menu.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // your helper
import cloudinary from "../config/cloudinary.js"; // direct access if needed

/* =========================
   CREATE Menu Item
   Supports: multipart file OR base64 string OR existing URL
========================= */
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, price, category, image } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, and category are required" });
    }

    let imageUrl: string;

    // Priority 1: New file upload (multipart/form-data)
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "menu-items");
    }
    // Priority 2: Base64 string in body (e.g., from canvas or frontend preview)
    else if (typeof image === "string" && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "menu-items",
        resource_type: "image",
      });
      imageUrl = uploadRes.secure_url;
    }
    // Priority 3: Direct URL (rare, but allowed)
    else if (typeof image === "string" && image.startsWith("http")) {
      imageUrl = image;
    }
    // No image provided
    else {
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

/* =========================
   GET All Menu Items
========================= */
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const menuItems = await Menu.find().sort({ createdAt: -1 });
    res.status(200).json(menuItems);
  } catch (error: any) {
    console.error("Get menu items error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE Menu Item
   Supports optional image update (keep old if no new file)
========================= */
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

    // If new file uploaded → upload to Cloudinary
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "menu-items");
      updateData.image = imageUrl;
    }
    // If base64 sent in body
    else if (typeof image === "string" && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "menu-items",
      });
      updateData.image = uploadRes.secure_url;
    }
    // If valid URL sent
    else if (typeof image === "string" && image.startsWith("http")) {
      updateData.image = image;
    }
    // Else: no image change → keep existing

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

/* =========================
   DELETE Menu Item
========================= */
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Menu.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Optional: Delete image from Cloudinary
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
