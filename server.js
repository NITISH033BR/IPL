import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

// ROUTES
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ======================
// CONFIG
// ======================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing");
  process.exit(1);
}

// ======================
// CORS (DEV MODE)
// ======================
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

// ======================
// MIDDLEWARE
// ======================
app.use(cors(corsOptions));
app.use(express.json());

// attach io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ======================
// SOCKET
// ======================
io.on("connection", (socket) => {
  console.log(`⚡ ${socket.id} connected`);

  socket.on("join_match", (matchId) => {
    socket.join(matchId);
  });

  socket.on("disconnect", () => {
    console.log(`🔥 ${socket.id} disconnected`);
  });
});

// ======================
// ROUTES
// ======================
app.get("/", (req, res) => {
  res.send("Betting API running 🚀");
});

app.use("/api/users", userRoutes);

// ======================
// DB + START
// ======================
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });