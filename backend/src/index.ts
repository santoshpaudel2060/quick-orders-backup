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
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/guest-session", guestSessionRoutes);

const PORT = process.env.PORT || 5000;

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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
