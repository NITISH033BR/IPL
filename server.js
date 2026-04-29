import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // ✅ keep this consistent
import verifyToken from "./middleware/verifyToken.js";
// ROUTES
import userRoutes from "./routes/userRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // ✅ ADDED

dotenv.config();

const app = express();
const server = http.createServer(app);

// ======================
// BASIC MIDDLEWARE
// ======================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// SOCKET.IO SETUP
// ======================
const io = new Server(server, { cors: { origin: "*" } });

// Attach socket io to req object so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 🔐 Socket Auth Middleware (JWT)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );

    socket.user = decoded;
    next();
  } catch (err) {
    console.log(`Socket connection rejected: Unauthorized`);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`⚡ Socket Connected: ${socket.id}`);

  socket.on("join_match", (matchId) => {
    socket.join(matchId);
    console.log(`Socket ${socket.id} joined room ${matchId}`);
  });

  socket.on("disconnect", () =>
    console.log(`🔥 Socket Disconnected: ${socket.id}`)
  );
});

// ======================
// ROUTES
// ======================

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

// 🔐 AUTH ROUTES (NEW)
app.use("/api/v1/auth", authRoutes);

// Existing routes
app.use("/api/v1/users", verifyToken, userRoutes);
app.use("/api/v1/matches", verifyToken, matchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================
// DATABASE & SERVER START
// ======================
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ipl_betting";

mongoose.set("strictQuery", false);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on Port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`❌ Database Connection Error: ${err.message}`);
    process.exit(1);
  });   