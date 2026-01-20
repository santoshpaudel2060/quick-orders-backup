import express from "express";
import { register, login, getMe } from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// GET /api/auth/me - Get current logged-in user
router.get("/me", protect, getMe);

export default router;
