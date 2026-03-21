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
import { requestLogger } from "./middleware/requestLogger.js";
import { logError, logInfo } from "./lib/logger.js";

process.on("unhandledRejection", (reason) => {
  logError("[APP]", reason, { type: "unhandledRejection" });
});
process.on("uncaughtException", (error) => {
  logError("[APP]", error, { type: "uncaughtException" });
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.get("/health", (_req, res) => res.json({ ok: true, service: "codequest-backend" }));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/learning", learningRouter);
app.use("/api/duels", duelRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/daily-challenge", dailyChallengeRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError("[APP]", error, { phase: "express-handler" });
  return res.status(500).json({ error: "Internal server error" });
});

attachDuelNamespace(io);

const port = Number(process.env.PORT ?? 4000);
server.listen(port, "0.0.0.0", () => {
  logInfo("[APP]", "server-started", {
    port,
    host: "0.0.0.0",
    localUrl: `http://localhost:${port}`,
    lanUrlExample: `http://192.168.1.158:${port}`,
  });
});
