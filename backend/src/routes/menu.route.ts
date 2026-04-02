import {
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
} from "../controller/menu.controller.js";
import upload from "../middleware/upload.js";
import express from "express";
const router = express.Router();

router.post("/create", upload.single("image"), createMenuItem);
router.get("/", getMenuItems);
router.put("/:id", upload.single("image"), updateMenuItem);
router.delete("/:id", deleteMenuItem);

export default router;
