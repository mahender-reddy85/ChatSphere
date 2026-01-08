import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import roomRoutes from "./routes/rooms.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* =========================
   SOCKET.IO CONFIG
========================= */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-sphere-tan.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   REST ROUTES
========================= */
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ ChatSphere Backend Running");
});

/* =========================
   SOCKET EVENTS
========================= */
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_message", (message) => {
    io.to(message.roomId).emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
