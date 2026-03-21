import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/auth.js";
import { logError, logInfo } from "../lib/logger.js";

interface QueueEntry {
  socketId: string;
  userId: string;
  username: string;
  avatarId: string;
  rating: number;
  experienceLevel: string;
  joinedAt: number;
}

interface SessionState {
  sessionId: string;
  roomId: string;
  player1: QueueEntry;
  player2: QueueEntry;
  score: { player1: number; player2: number };
  round: number;
  readyUserIds: Set<string>;
  currentQuestionId: string | null;
  answered: boolean;
  roundTimeout: ReturnType<typeof setTimeout> | null;
  roundNonce: number;
  roundReplay: Array<{
    roundNumber: number;
    winnerUserId: string | null;
    correctAnswer: string;
    player1TimeMs: number;
    player2TimeMs: number;
  }>;
}

const queue: QueueEntry[] = [];
const sessions = new Map<string, SessionState>();

function pickRange(entry: QueueEntry): number {
  const waited = Date.now() - entry.joinedAt;
  if (waited > 60000) return 500;
  if (waited > 30000) return 300;
  return 200;
}

export function attachDuelNamespace(io: Server) {
  const duel = io.of("/duel");

  duel.on("connection", (socket: Socket) => {
    logInfo("[DUEL]", "socket:connected", { socketId: socket.id });
    socket.emit("queue_status", {
      players_online: Math.max(1, duel.sockets.size),
      estimated_wait_seconds: 8,
    });

    socket.on("join_queue", async (payload: { token?: string; rating?: number; userId?: string; username?: string }) => {
      let userId = payload.userId ?? `guest-${socket.id.slice(0, 8)}`;
      if (payload.token) {
        try {
          const decoded = verifyAccessToken(payload.token);
          userId = decoded.userId;
        } catch {
          logInfo("[DUEL]", "queue:invalid-token", { socketId: socket.id });
        }
      }
      const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
      const ratingFromDb = await prisma.duelRating.findUnique({ where: { userId } }).catch(() => null);
      const progress = await prisma.userProgress.findUnique({ where: { userId } }).catch(() => null);

      const entry: QueueEntry = {
        socketId: socket.id,
        userId,
        username: user?.username ?? payload.username ?? "Anonymous",
        avatarId: user?.avatarId ?? "avatar-braces",
        rating: ratingFromDb?.rating ?? payload.rating ?? 1000,
        experienceLevel: progress?.experienceLevel ?? "BEGINNER",
        joinedAt: Date.now(),
      };

      logInfo("[DUEL]", "queue:join", { userId: entry.userId, socketId: socket.id, rating: entry.rating });
      const opponentIndex = queue.findIndex((candidate) => {
        if (candidate.socketId === entry.socketId) return false;
        const range = Math.max(pickRange(candidate), pickRange(entry));
        return Math.abs(candidate.rating - entry.rating) <= range;
      });

      if (opponentIndex === -1) {
        queue.push(entry);
        socket.emit("queue_status", {
          players_online: Math.max(1, duel.sockets.size),
          estimated_wait_seconds: 12,
        });
        return;
      }

      const opponent = queue.splice(opponentIndex, 1)[0];
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const roomId = `duel_${sessionId}`;
      const opponentSocket = duel.sockets.get(opponent.socketId);
      opponentSocket?.join(roomId);
      socket.join(roomId);

      sessions.set(sessionId, {
        sessionId,
        roomId,
        player1: opponent,
        player2: entry,
        score: { player1: 0, player2: 0 },
        round: 0,
        readyUserIds: new Set<string>(),
        currentQuestionId: null,
        answered: false,
        roundTimeout: null,
        roundNonce: 0,
        roundReplay: [],
      });
      logInfo("[DUEL]", "match:created", {
        sessionId,
        player1: opponent.userId,
        player2: entry.userId,
      });

      duel.to(opponent.socketId).emit("match_found", {
        session_id: sessionId,
        opponent: { username: entry.username, avatar_id: entry.avatarId, rating: entry.rating },
      });
      socket.emit("match_found", {
        session_id: sessionId,
        opponent: { username: opponent.username, avatar_id: opponent.avatarId, rating: opponent.rating },
      });
    });

    socket.on("leave_queue", () => {
      const idx = queue.findIndex((entry) => entry.socketId === socket.id);
      if (idx >= 0) queue.splice(idx, 1);
    });

    socket.on("player_ready", async (payload: { session_id: string; userId?: string }) => {
      try {
        const session = sessions.get(payload.session_id);
        if (!session) return;
        const userId = socket.id === session.player1.socketId ? session.player1.userId : session.player2.userId;
        session.readyUserIds.add(userId);
        if (session.readyUserIds.size >= 2 && session.round === 0) {
          await startRound(duel, session);
        }
      } catch (error) {
        logError("[DUEL]", error, { phase: "player_ready" });
      }
    });

    socket.on(
      "submit_answer",
      async (payload: { session_id: string; round_number: number; answer: string; time_taken_ms: number; userId?: string }) => {
        try {
          const session = sessions.get(payload.session_id);
          if (!session) return;
          if (session.answered) return;
          if (!session.currentQuestionId) return;
          const question = await prisma.duelQuestion.findUnique({ where: { id: session.currentQuestionId } });
          if (!question) return;

          const isCorrect = payload.answer === question.correctAnswer;
          if (!isCorrect) {
            socket.emit("answer_feedback", { isCorrect: false, lockout_ms: 1000 });
            return;
          }
          session.answered = true;
          if (session.roundTimeout) {
            clearTimeout(session.roundTimeout);
            session.roundTimeout = null;
          }

          const answeredByPlayer1 = payload.userId === session.player1.userId || socket.id === session.player1.socketId;
          const player1TimeMs = answeredByPlayer1 ? payload.time_taken_ms : 0;
          const player2TimeMs = answeredByPlayer1 ? 0 : payload.time_taken_ms;
          if (answeredByPlayer1) {
            session.score.player1 += 1;
          } else {
            session.score.player2 += 1;
          }
          session.roundReplay.push({
            roundNumber: session.round,
            winnerUserId: answeredByPlayer1 ? session.player1.userId : session.player2.userId,
            correctAnswer: question.correctAnswer,
            player1TimeMs,
            player2TimeMs,
          });

          duel.to(session.roomId).emit("round_result", {
            winner_user_id: answeredByPlayer1 ? session.player1.userId : session.player2.userId,
            correct_answer: question.correctAnswer,
            explanation: question.explanation,
            scores: { player1: session.score.player1, player2: session.score.player2 },
            player_ids: { player1: session.player1.userId, player2: session.player2.userId },
            response_times: { player1_ms: player1TimeMs, player2_ms: player2TimeMs },
          });

          if (session.round >= 5) {
            await endSession(duel, session);
            return;
          }

          setTimeout(() => {
            if (sessions.has(session.sessionId)) {
              void startRound(duel, session);
            }
          }, 1800);
        } catch (error) {
          logError("[DUEL]", error, { phase: "submit_answer" });
        }
      },
    );

    socket.on("disconnect", () => {
      logInfo("[DUEL]", "socket:disconnected", { socketId: socket.id });
      const queued = queue.findIndex((entry) => entry.socketId === socket.id);
      if (queued >= 0) queue.splice(queued, 1);
      sessions.forEach((session, sessionId) => {
        if (session.player1.socketId === socket.id || session.player2.socketId === socket.id) {
          if (session.roundTimeout) {
            clearTimeout(session.roundTimeout);
            session.roundTimeout = null;
          }
          const survivor = session.player1.socketId === socket.id ? session.player2 : session.player1;
          duel.to(survivor.socketId).emit("opponent_disconnected", { at_round: session.round });
          setTimeout(() => {
            duel.to(survivor.socketId).emit("duel_end", {
              winner_user_id: survivor.userId,
              final_scores: { player1: session.score.player1, player2: session.score.player2 },
              rating_change: 25,
              xp_earned: 80,
            });
            sessions.delete(sessionId);
          }, 5000);
        }
      });
    });
  });
}

async function startRound(io: ReturnType<Server["of"]>, sessionOrId: string | SessionState) {
  try {
    const session = typeof sessionOrId === "string" ? sessions.get(sessionOrId) : sessionOrId;
    if (!session) return;
    session.round += 1;
    session.answered = false;
    session.roundNonce += 1;
    const nonce = session.roundNonce;

    const question = await pickQuestionForSession(session);
    if (!question) {
      logInfo("[DUEL]", "question:none-available", { sessionId: session.sessionId });
      return;
    }
    session.currentQuestionId = question.id;
    const options = Array.isArray(question.options) ? (question.options as string[]) : [];

    const payload = {
      round_number: session.round,
      question: {
        id: question.id,
        code_snippet: question.codeSnippet,
        prompt: question.questionText,
        type: question.type,
        options,
        correct_answer: question.correctAnswer,
      },
      starts_at: Date.now(),
    };
    io.to(session.roomId).emit("round_start", payload);
    session.roundTimeout = setTimeout(async () => {
      if (session.roundNonce !== nonce) return;
      if (session.answered) return;
      io.to(session.roomId).emit("round_result", {
        winner_user_id: null,
        correct_answer: question.correctAnswer,
        explanation: "No one answered correctly in time.",
        scores: { player1: session.score.player1, player2: session.score.player2 },
        player_ids: { player1: session.player1.userId, player2: session.player2.userId },
        response_times: { player1_ms: 0, player2_ms: 0 },
      });
      session.roundReplay.push({
        roundNumber: session.round,
        winnerUserId: null,
        correctAnswer: question.correctAnswer,
        player1TimeMs: 0,
        player2TimeMs: 0,
      });
      if (session.round >= 5) {
        await endSession(io, session);
        return;
      }
      if (session.roundNonce === nonce) {
        await startRound(io, session);
      }
    }, 15000);
  } catch (error) {
    logError("[DUEL]", error, { phase: "start-round" });
  }
}

async function endSession(io: ReturnType<Server["of"]>, session: SessionState) {
  if (session.roundTimeout) {
    clearTimeout(session.roundTimeout);
    session.roundTimeout = null;
  }
  const winnerIsP1 = session.score.player1 >= session.score.player2;
  const winner = winnerIsP1 ? session.player1 : session.player2;
  const loser = winnerIsP1 ? session.player2 : session.player1;

  io.to(session.player1.socketId).emit("duel_end", {
    winner_user_id: winner.userId,
    final_scores: { player1: session.score.player1, player2: session.score.player2 },
    rating_change: winnerIsP1 ? 50 : -20,
    xp_earned: winnerIsP1 ? 100 : 30,
    round_replay: session.roundReplay,
  });
  io.to(session.player2.socketId).emit("duel_end", {
    winner_user_id: winner.userId,
    final_scores: { player1: session.score.player1, player2: session.score.player2 },
    rating_change: winnerIsP1 ? -20 : 50,
    xp_earned: winnerIsP1 ? 30 : 100,
    round_replay: session.roundReplay,
  });

  await prisma.duelSession
    .create({
      data: {
        player1Id: session.player1.userId,
        player2Id: session.player2.userId,
        winnerId: winner.userId,
        player1Score: session.score.player1,
        player2Score: session.score.player2,
        roundsPlayed: session.round,
        roundReplay: session.roundReplay,
        endedAt: new Date(),
      },
    })
    .catch(() => null);

  sessions.delete(session.sessionId);

  await prisma.duelRating
    .upsert({
      where: { userId: winner.userId },
      create: { userId: winner.userId, rating: 1050, wins: 1 },
      update: { rating: { increment: 50 }, wins: { increment: 1 } },
    })
    .catch(() => null);
  await prisma.duelRating
    .upsert({
      where: { userId: loser.userId },
      create: { userId: loser.userId, rating: 980, losses: 1 },
      update: { rating: { decrement: 20 }, losses: { increment: 1 } },
    })
    .catch(() => null);

  await applyXpReward(session.player1.userId, winnerIsP1 ? 100 : 30);
  await applyXpReward(session.player2.userId, winnerIsP1 ? 30 : 100);
}

async function pickQuestionForSession(session: SessionState) {
  const p1Exp = session.player1.experienceLevel;
  const p2Exp = session.player2.experienceLevel;
  const beginnerLike = ["BEGINNER", "BASICS", "INTERMEDIATE"];
  const p1IsBeginnerLike = beginnerLike.includes(p1Exp);
  const p2IsBeginnerLike = beginnerLike.includes(p2Exp);

  const targetDifficulty =
    p1IsBeginnerLike && p2IsBeginnerLike
      ? "BEGINNER"
      : !p1IsBeginnerLike && !p2IsBeginnerLike
        ? "ADVANCED"
        : session.round % 2 === 0
          ? "ADVANCED"
          : "BEGINNER";

  const total = await prisma.duelQuestion.count({
    where: { difficulty: targetDifficulty as "BEGINNER" | "ADVANCED" },
  });
  if (total === 0) {
    return prisma.duelQuestion.findFirst();
  }
  return prisma.duelQuestion.findFirst({
    where: { difficulty: targetDifficulty as "BEGINNER" | "ADVANCED" },
    skip: Math.floor(Math.random() * Math.max(1, total - 1)),
  });
}

async function applyXpReward(userId: string, xpToAdd: number) {
  const progress = await prisma.userProgress.findUnique({ where: { userId } }).catch(() => null);
  if (!progress) return;
  const nextXp = progress.xpTotal + xpToAdd;
  const nextLevel = Math.max(1, Math.floor(nextXp / 250) + 1);
  await prisma.userProgress
    .update({
      where: { userId },
      data: {
        xpTotal: nextXp,
        level: nextLevel,
      },
    })
    .catch(() => null);
}
