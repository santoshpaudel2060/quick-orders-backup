// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import authRoutes from "./routes/auth.route.js";
// import tableRoutes from "./routes/table.route.js";
// import orderRoutes from "./routes/order.route.js";
// import menuRoutes from "./routes/menu.route.js";
// import paymentRoutes from "./routes/payment.route.js";
// // import adminPaymentRoutes from "./routes/adminPayment.route.js";
// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/menus", menuRoutes);
// app.use("/api/payments", paymentRoutes);
// // app.use("/api/admin", adminPaymentRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import tableRoutes from "./routes/table.route.js";
import orderRoutes from "./routes/order.route.js";
import menuRoutes from "./routes/menu.route.js";
import paymentRoutes from "./routes/payment.route.js";
import guestSessionRoutes from "./routes/guestSession.route.js";

dotenv.config();

// Global error handlers for better debugging
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️  Unhandled Rejection!");
  console.error("Promise:", promise);
  console.error("Reason:", reason);
  try {
    console.error("Reason JSON:", JSON.stringify(reason, null, 2));
  } catch (e) {
    console.error("Could not stringify reason");
  }
  if (reason instanceof Error) {
    console.error("Error message:", reason.message);
    console.error("Stack trace:", reason.stack);
  }
});

process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION!");
  console.error("Error object:", error);
  try {
    console.error("Error as JSON:", JSON.stringify(error, null, 2));
  } catch (e) {
    console.error("Could not stringify error");
  }
  if (error instanceof Error) {
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Stack trace:", error.stack);
  } else {
    console.error("Error type:", typeof error);
    console.error("Error keys:", Object.keys(error as any));
  }
  process.exit(1);
});

// Initialize and start server
const startServer = async () => {
  try {
    await connectDB();

    const app = express();

    // CORS Configuration for credentials
    const corsOptions = {
      origin: function (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) {
        // Allow requests from all origins (development)
        // For production, specify exact origins
        const allowedOrigins = [
          process.env.FRONTEND_URL || "http://localhost:3000",
          process.env.CORS_ORIGIN || "*",
          // Add your production frontend URLs here
          // "https://yourdomain.com",
          // "https://app.yourdomain.com",
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }

        // For development, allow wildcard
        if (process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }

        // For production, check against allowed list
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true, // ← IMPORTANT: Allow cookies
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Guest-Session-Id"],
      optionsSuccessStatus: 200,
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(cookieParser());

    app.use("/api/auth", authRoutes);
    app.use("/api/tables", tableRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/menus", menuRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/guest-session", guestSessionRoutes);

    const portString = process.env.PORT || "5000";
    const PORT = parseInt(portString, 10);

    if (isNaN(PORT)) {
      throw new Error(`Invalid PORT: ${portString}`);
    }

    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "UPDATE", "DELETE", "PUT"],
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Function to find an available port
    const startServerOnAvailablePort = (startPort: number) => {
      console.log(`Attempting to start server on port ${startPort}...`);
      const server = httpServer;

      server.listen(startPort, () => {
        console.log(`✓ Server running on port ${startPort}`);
      });

      server.on("error", (err: any) => {
        console.error(
          `Server error on port ${startPort}:`,
          err.code,
          err.message,
        );
        if (err.code === "EADDRINUSE") {
          console.log(
            `Port ${startPort} is already in use, trying port ${startPort + 1}...`,
          );
          server.close();
          startServerOnAvailablePort(startPort + 1);
        } else {
          console.error("Fatal server error:", err);
          process.exit(1);
        }
      });
    };

    startServerOnAvailablePort(PORT);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to start server:", error.message);
      console.error(error.stack);
    } else {
      console.error("Failed to start server:", error);
    }
    process.exit(1);
  }
};

// Start the server
startServer();
