import { Request, Response } from "express";
import GuestSession, { IGuestSession } from "../models/GuestSession.model.js";
import { v4 as uuidv4 } from "uuid";

const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

interface GuestSessionRequest extends Request {
  guestSession?: IGuestSession;
}

export const createGuestSession = async (req: Request, res: Response) => {
  try {
    const { tableNumber, customerName } = req.body;

    if (!tableNumber || !customerName) {
      return res.status(400).json({
        message: "Table number and customer name are required",
      });
    }

    // Generate unique session ID
    const sessionId = `${tableNumber}-${uuidv4()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION);

    const guestSession = await GuestSession.create({
      sessionId,
      tableNumber,
      customerName,
      customerId: customerName,
      cart: {
        items: [],
        totalAmount: 0,
      },
      sessionStartTime: now,
      lastActivityTime: now,
      isActive: true,
      expiresAt,
    });

    // Set cookie with session ID
    res.cookie("guestSessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return res.status(201).json({
      success: true,
      sessionId,
      session: guestSession,
      message: "Guest session created successfully",
    });
  } catch (error) {
    console.error("Create guest session error:", error);
    return res.status(500).json({
      message: "Failed to create guest session",
      error,
    });
  }
};

export const validateGuestSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID is required",
      });
    }

    const session = await GuestSession.findOne({
      sessionId,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or expired",
      });
    }

    // Check if session has expired (should not happen due to TTL, but double-check)
    if (new Date() > session.expiresAt) {
      await GuestSession.updateOne({ sessionId }, { isActive: false });
      return res.status(401).json({
        success: false,
        message: "Session has expired",
      });
    }

    // Update last activity time
    session.lastActivityTime = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      session,
      message: "Session validated successfully",
    });
  } catch (error) {
    console.error("Validate guest session error:", error);
    return res.status(500).json({
      message: "Failed to validate session",
      error,
    });
  }
};

export const getGuestSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await GuestSession.findOne({
      sessionId,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error("Get guest session error:", error);
    return res.status(500).json({
      message: "Failed to retrieve session",
      error,
    });
  }
};

export const updateSessionCart = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { items, totalAmount } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID is required",
      });
    }

    const session = await GuestSession.findOneAndUpdate(
      { sessionId, isActive: true },
      {
        "cart.items": items,
        "cart.totalAmount": totalAmount,
        lastActivityTime: new Date(),
      },
      { new: true },
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    return res.status(200).json({
      success: true,
      session,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Update session cart error:", error);
    return res.status(500).json({
      message: "Failed to update cart",
      error,
    });
  }
};

export const endGuestSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await GuestSession.findOneAndUpdate(
      { sessionId },
      { isActive: false },
      { new: true },
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // Clear cookie
    res.clearCookie("guestSessionId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.error("End guest session error:", error);
    return res.status(500).json({
      message: "Failed to end session",
      error,
    });
  }
};

export const getTableSessions = async (req: Request, res: Response) => {
  try {
    const { tableNumber } = req.params;

    const sessions = await GuestSession.find({
      tableNumber: parseInt(tableNumber),
      isActive: true,
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Get table sessions error:", error);
    return res.status(500).json({
      message: "Failed to retrieve table sessions",
      error,
    });
  }
};
