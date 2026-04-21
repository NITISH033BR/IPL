import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

// ✅ IMPORT ROUTES
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ======================
// 1. CONFIGURATION
// ======================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Validate critical env
if (!MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in .env");
  process.exit(1);
}

// ======================
// 2. BASIC SECURITY
// ======================
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// ======================
// 3. CORS & SOCKET SETUP
// ======================
const allowedOrigins = Array.isArray(CLIENT_URL)
  ? CLIENT_URL
  : [CLIENT_URL];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

// ======================
// 4. MIDDLEWARE
// ======================
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ======================
// 5. SOCKET.IO LOGIC
// ======================
io.use((socket, next) => {
  next(); // later JWT auth
});

io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  socket.on("join_match", (matchId) => {
    socket.join(matchId);
    console.log(`📊 ${socket.id} joined match: ${matchId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔥 User disconnected: ${socket.id}`);
  });
});

// ======================
// 6. ROUTES
// ======================
app.get("/", (req, res) => {
  res.status(200).send("Betting API is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ✅ ADD THIS (IMPORTANT)
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ======================
// 7. GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`❌ Error [${statusCode}]:`, err.message);

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// ======================
// 8. DB CONNECT & START
// ======================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Allowed origin(s): ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ======================
// 9. PROCESS SAFETY
// ======================
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

// ======================
// 10. GRACEFUL SHUTDOWN
// ======================
const shutdown = async () => {
  console.log("🛑 Shutting down...");
  try {
    await mongoose.connection.close();
    server.close(() => {
      console.log("✅ Server & DB closed");
      process.exit(0);
    });
  } catch (err) {
    console.error("Shutdown error:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);