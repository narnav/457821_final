import { prisma } from "../lib/prisma.js";
const queue = [];
const sessions = new Map();
function pickRange(entry) {
    const waited = Date.now() - entry.joinedAt;
    if (waited > 60000)
        return 500;
    if (waited > 30000)
        return 300;
    return 200;
}
export function attachDuelNamespace(io) {
    const duel = io.of("/duel");
    duel.on("connection", (socket) => {
        socket.emit("queue_status", {
            players_online: Math.max(1, duel.sockets.size),
            estimated_wait_seconds: 8,
        });
        socket.on("join_queue", async (payload) => {
            const userId = payload.userId ?? `guest-${socket.id.slice(0, 8)}`;
            const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
            const ratingFromDb = await prisma.duelRating.findUnique({ where: { userId } }).catch(() => null);
            const progress = await prisma.userProgress.findUnique({ where: { userId } }).catch(() => null);
            const entry = {
                socketId: socket.id,
                userId,
                username: user?.username ?? payload.username ?? "Anonymous",
                avatarId: user?.avatarId ?? "avatar-braces",
                rating: ratingFromDb?.rating ?? payload.rating ?? 1000,
                experienceLevel: progress?.experienceLevel ?? "BEGINNER",
                joinedAt: Date.now(),
            };
            const opponentIndex = queue.findIndex((candidate) => {
                if (candidate.socketId === entry.socketId)
                    return false;
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
                readyUserIds: new Set(),
                currentQuestionId: null,
                answered: false,
                roundTimeout: null,
                roundNonce: 0,
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
            if (idx >= 0)
                queue.splice(idx, 1);
        });
        socket.on("player_ready", async (payload) => {
            try {
                const session = sessions.get(payload.session_id);
                if (!session)
                    return;
                const userId = payload.userId ??
                    (socket.id === session.player1.socketId ? session.player1.userId : session.player2.userId);
                session.readyUserIds.add(userId);
                if (session.readyUserIds.size >= 2 && session.round === 0) {
                    await startRound(duel, session);
                }
            }
            catch (error) {
                console.error("player_ready failed", error);
            }
        });
        socket.on("submit_answer", async (payload) => {
            try {
                const session = sessions.get(payload.session_id);
                if (!session)
                    return;
                if (session.answered)
                    return;
                if (!session.currentQuestionId)
                    return;
                const question = await prisma.duelQuestion.findUnique({ where: { id: session.currentQuestionId } });
                if (!question)
                    return;
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
                if (answeredByPlayer1) {
                    session.score.player1 += 1;
                }
                else {
                    session.score.player2 += 1;
                }
                duel.to(session.roomId).emit("round_result", {
                    winner_user_id: answeredByPlayer1 ? session.player1.userId : session.player2.userId,
                    correct_answer: question.correctAnswer,
                    explanation: question.explanation,
                    scores: { player1: session.score.player1, player2: session.score.player2 },
                    player_ids: { player1: session.player1.userId, player2: session.player2.userId },
                    response_times: { player1_ms: answeredByPlayer1 ? payload.time_taken_ms : 0, player2_ms: answeredByPlayer1 ? 0 : payload.time_taken_ms },
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
            }
            catch (error) {
                console.error("submit_answer failed", error);
            }
        });
        socket.on("disconnect", () => {
            const queued = queue.findIndex((entry) => entry.socketId === socket.id);
            if (queued >= 0)
                queue.splice(queued, 1);
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
async function startRound(io, sessionOrId) {
    try {
        const session = typeof sessionOrId === "string" ? sessions.get(sessionOrId) : sessionOrId;
        if (!session)
            return;
        session.round += 1;
        session.answered = false;
        session.roundNonce += 1;
        const nonce = session.roundNonce;
        const question = await pickQuestionForSession(session);
        if (!question) {
            console.error("No duel question available for session", session.sessionId);
            return;
        }
        session.currentQuestionId = question.id;
        const options = Array.isArray(question.options) ? question.options : [];
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
            if (session.roundNonce !== nonce)
                return;
            if (session.answered)
                return;
            io.to(session.roomId).emit("round_result", {
                winner_user_id: null,
                correct_answer: question.correctAnswer,
                explanation: "No one answered correctly in time.",
                scores: { player1: session.score.player1, player2: session.score.player2 },
                player_ids: { player1: session.player1.userId, player2: session.player2.userId },
                response_times: { player1_ms: 0, player2_ms: 0 },
            });
            if (session.round >= 5) {
                await endSession(io, session);
                return;
            }
            if (session.roundNonce === nonce) {
                await startRound(io, session);
            }
        }, 15000);
    }
    catch (error) {
        console.error("startRound failed", error);
    }
}
async function endSession(io, session) {
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
    });
    io.to(session.player2.socketId).emit("duel_end", {
        winner_user_id: winner.userId,
        final_scores: { player1: session.score.player1, player2: session.score.player2 },
        rating_change: winnerIsP1 ? -20 : 50,
        xp_earned: winnerIsP1 ? 30 : 100,
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
}
async function pickQuestionForSession(session) {
    const p1Exp = session.player1.experienceLevel;
    const p2Exp = session.player2.experienceLevel;
    const beginnerLike = ["BEGINNER", "BASICS", "INTERMEDIATE"];
    const p1IsBeginnerLike = beginnerLike.includes(p1Exp);
    const p2IsBeginnerLike = beginnerLike.includes(p2Exp);
    const targetDifficulty = p1IsBeginnerLike && p2IsBeginnerLike
        ? "BEGINNER"
        : !p1IsBeginnerLike && !p2IsBeginnerLike
            ? "ADVANCED"
            : session.round % 2 === 0
                ? "ADVANCED"
                : "BEGINNER";
    const total = await prisma.duelQuestion.count({
        where: { difficulty: targetDifficulty },
    });
    if (total === 0) {
        return prisma.duelQuestion.findFirst();
    }
    return prisma.duelQuestion.findFirst({
        where: { difficulty: targetDifficulty },
        skip: Math.floor(Math.random() * Math.max(1, total - 1)),
    });
}
