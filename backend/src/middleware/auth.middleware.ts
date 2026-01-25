import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res
      .status(401)
      .json({ message: "Not authorized, invalid or expired token" });
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admins only" });
};
