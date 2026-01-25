import { Request, Response, NextFunction } from "express";
import GuestSession from "../models/GuestSession.model.js";

interface GuestSessionRequest extends Request {
  guestSession?: any;
  sessionId?: string;
}

/**
 * Middleware to validate guest session
 * Can be used on protected routes that require a guest session
 */
export const validateGuestSessionMiddleware = async (
  req: GuestSessionRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get session ID from:
    // 1. Cookie (if available)
    // 2. Headers
    // 3. Query params
    const sessionId =
      req.cookies?.guestSessionId ||
      req.headers["x-guest-session-id"] ||
      req.query.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        message: "Guest session ID is required",
      });
    }

    // Find active session
    const session = await GuestSession.findOne({
      sessionId: sessionId as string,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({
        message: "Invalid or expired session",
      });
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await GuestSession.updateOne({ sessionId }, { isActive: false });
      return res.status(401).json({
        message: "Session has expired",
      });
    }

    // Update last activity
    session.lastActivityTime = new Date();
    await session.save();

    // Attach session to request
    req.guestSession = session;
    req.sessionId = sessionId as string;

    next();
  } catch (error) {
    console.error("Guest session validation error:", error);
    return res.status(500).json({
      message: "Session validation failed",
      error,
    });
  }
};

/**
 * Optional guest session middleware
 * Does not fail if session is missing, but attaches it if found
 */
export const optionalGuestSession = async (
  req: GuestSessionRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId =
      req.cookies?.guestSessionId ||
      req.headers["x-guest-session-id"] ||
      req.query.sessionId;

    if (sessionId) {
      const session = await GuestSession.findOne({
        sessionId: sessionId as string,
        isActive: true,
      });

      if (session && new Date() <= session.expiresAt) {
        session.lastActivityTime = new Date();
        await session.save();
        req.guestSession = session;
        req.sessionId = sessionId as string;
      }
    }

    next();
  } catch (error) {
    console.error("Optional guest session error:", error);
    next();
  }
};
