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

// IMPORTANT: These specific routes must come BEFORE the wildcard :sessionId route
// Validate if session exists and is active
router.get("/validate/:sessionId", validateGuestSession);

// Get all active sessions for a table
router.get("/table/:tableNumber", getTableSessions);

// Generic routes with :sessionId param (MUST BE LAST)
// Get session details
router.get("/:sessionId", getGuestSession);

// Update cart in session
router.put("/:sessionId/cart", updateSessionCart);

// End session
router.post("/:sessionId/end", endGuestSession);

export default router;
