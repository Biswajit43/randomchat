import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { connectDB } from "./src/config/db.js";
import apiRoutes from "./src/routes/api.js";
import { registerSignaling } from "./src/sockets/signaling.js";
import { registerGroupRooms } from "./src/sockets/groupRooms.js";

dotenv.config();

// Last line of defense: if something still throws or rejects outside the
// per-route/per-socket-handler guards added throughout this codebase, log it
// loudly instead of letting the process die silently or leave a request
// hanging with no response. This should rarely fire — it's a safety net,
// not a substitute for the try/catch wrapping already in api.js,
// groupRooms.js, and signaling.js.
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[server] uncaught exception:", err);
});

const app = express();
const server = http.createServer(app);
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173")
  .trim()
  .replace(/\/+$/, "");

app.use(helmet());
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api", apiRoutes);

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
  // Cap payloads — signaling messages are small; this blocks abuse of the
  // socket as a generic data channel.
  maxHttpBufferSize: 1e5,
});

registerSignaling(io);
registerGroupRooms(io);

const PORT = process.env.PORT || 5000;
app.get('/' , (req,res) => {
res.send("working ... ")
})

connectDB().finally(() => {
  server.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
});
