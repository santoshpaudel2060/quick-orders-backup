import express from "express";
import {
  createGuestSession,
  validateGuestSession,
  getGuestSession,
  updateSessionCart,
  endGuestSession,
  getTableSessions,
} from "../controller/guestSession.controller.js";

const router = express.Router();

// Create a new guest session when user scans QR
router.post("/create", createGuestSession);

// Validate if session exists and is active
router.get("/validate/:sessionId", validateGuestSession);

// Get session details
router.get("/:sessionId", getGuestSession);

// Update cart in session
router.put("/:sessionId/cart", updateSessionCart);

// End session
router.post("/:sessionId/end", endGuestSession);

// Get all active sessions for a table
router.get("/table/:tableNumber", getTableSessions);

export default router;
