import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { authRouter } from "./routes/auth.js";
import { userRouter } from "./routes/user.js";
import { learningRouter } from "./routes/learning.js";
import { duelRouter } from "./routes/duels.js";
import { badgesRouter } from "./routes/badges.js";
import { dailyChallengeRouter } from "./routes/dailyChallenge.js";
import { attachDuelNamespace } from "./socket/duelSocket.js";
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
    },
});
app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "codequest-backend" }));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/learning", learningRouter);
app.use("/api/duels", duelRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/daily-challenge", dailyChallengeRouter);
attachDuelNamespace(io);
const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
    console.log(`CodeQuest backend listening on http://localhost:${port}`);
});
