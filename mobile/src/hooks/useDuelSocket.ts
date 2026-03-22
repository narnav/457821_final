import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { logDuel, logError } from "../services/logger";
import { DUEL_SOCKET_URL } from "../config/network";

interface DuelRound {
  roundNumber: number;
  prompt: string;
  codeSnippet: string;
  options: string[];
  correctAnswer: string;
  type: "MULTIPLE_CHOICE" | "FIND_THE_BUG" | "TAP_TOKEN" | "CODE_FILL";
}

interface DuelState {
  playersOnline: number;
  sessionId: string | null;
  opponent: { username: string; rating: number } | null;
  round: DuelRound | null;
  score: { me: number; opp: number };
  duelEnd:
    | {
        won: boolean;
        ratingDelta: number;
        xpEarned: number;
        roundReplay: Array<{
          roundNumber: number;
          winnerUserId: string | null;
          correctAnswer: string;
          player1TimeMs: number;
          player2TimeMs: number;
        }>;
      }
    | null;
}

const listeners = new Set<(state: DuelState) => void>();
let sharedSocket: Socket | null = null;
let currentUserId: string | null = null;
let sharedState: DuelState = {
  playersOnline: 0,
  sessionId: null,
  opponent: null,
  round: null,
  score: { me: 0, opp: 0 },
  duelEnd: null,
};

function publish(nextState: Partial<DuelState>) {
  sharedState = { ...sharedState, ...nextState };
  listeners.forEach((listener) => listener(sharedState));
}

function ensureSocket(url: string) {
  if (sharedSocket) return sharedSocket;
  const socket = io(url, { transports: ["websocket"] });
  socket.on("connect", () => {
    logDuel("socket:connected", { socketId: socket.id });
  });
  socket.on("disconnect", (reason) => {
    logDuel("socket:disconnected", { reason });
  });
  socket.on("connect_error", (error) => {
    logError("[DUEL]", error, { phase: "socket-connect" });
  });
  socket.on("queue_status", (payload) => {
    publish({ playersOnline: payload.players_online ?? 0 });
  });
  socket.on("match_found", (payload) => {
    publish({
      sessionId: payload.session_id,
      opponent: {
        username: payload.opponent.username,
        rating: payload.opponent.rating,
      },
    });
  });
  socket.on("round_start", (payload) => {
    publish({
      round: {
        roundNumber: payload.round_number,
        prompt: payload.question.prompt,
        codeSnippet: payload.question.code_snippet,
        options: payload.question.options ?? [],
        correctAnswer: payload.question.correct_answer ?? "",
        type: payload.question.type ?? "MULTIPLE_CHOICE",
      },
    });
  });
  socket.on("round_result", (payload) => {
    const player1Id = payload.player_ids?.player1 as string | undefined;
    const isPlayer1 = player1Id && currentUserId ? player1Id === currentUserId : true;
    publish({
      score: {
        me: isPlayer1 ? payload.scores.player1 : payload.scores.player2,
        opp: isPlayer1 ? payload.scores.player2 : payload.scores.player1,
      },
    });
  });
  socket.on("duel_end", (payload) => {
    const winnerId = payload.winner_user_id as string;
    publish({
      duelEnd: {
        won: currentUserId ? winnerId === currentUserId : winnerId === socket.id,
        ratingDelta: payload.rating_change,
        xpEarned: payload.xp_earned,
        roundReplay: Array.isArray(payload.round_replay)
          ? payload.round_replay.map((entry: unknown) => {
              const replayEntry = entry as {
                roundNumber?: number;
                round_number?: number;
                winnerUserId?: string;
                winner_user_id?: string | null;
                correctAnswer?: string;
                correct_answer?: string;
                player1TimeMs?: number;
                player1_ms?: number;
                player2TimeMs?: number;
                player2_ms?: number;
              };
              return {
                roundNumber: Number(replayEntry.roundNumber ?? replayEntry.round_number ?? 0),
                winnerUserId:
                  typeof replayEntry.winnerUserId === "string"
                    ? replayEntry.winnerUserId
                    : replayEntry.winner_user_id ?? null,
                correctAnswer: String(replayEntry.correctAnswer ?? replayEntry.correct_answer ?? ""),
                player1TimeMs: Number(replayEntry.player1TimeMs ?? replayEntry.player1_ms ?? 0),
                player2TimeMs: Number(replayEntry.player2TimeMs ?? replayEntry.player2_ms ?? 0),
              };
            })
          : [],
      },
    });
  });
  socket.on("opponent_disconnected", () => {
    logDuel("opponent:disconnected");
    publish({
      duelEnd: { won: true, ratingDelta: 25, xpEarned: 80, roundReplay: [] },
    });
  });
  sharedSocket = socket;
  return socket;
}

export function useDuelSocket() {
  const [state, setState] = useState<DuelState>(sharedState);
  const mockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const url = useMemo(() => DUEL_SOCKET_URL, []);

  useEffect(() => {
    ensureSocket(url);
    const listener = (nextState: DuelState) => setState(nextState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [url]);

  useEffect(() => {
    return () => {
      if (mockTimeoutRef.current) {
        clearTimeout(mockTimeoutRef.current);
      }
    };
  }, []);

  const startLocalMockMatch = useCallback(() => {
    publish({
      sessionId: sharedState.sessionId ?? "local-session",
      opponent: sharedState.opponent ?? { username: "GlobalRival", rating: 1210 },
    });
    if (mockTimeoutRef.current) {
      clearTimeout(mockTimeoutRef.current);
    }
    mockTimeoutRef.current = setTimeout(() => {
      publish({
        round: {
          roundNumber: 1,
          prompt: "What is the output?",
          codeSnippet: "console.log(typeof null);",
          options: ["object", "null", "undefined", "number"],
          correctAnswer: "object",
          type: "MULTIPLE_CHOICE",
        },
      });
    }, 900);
  }, []);

  const joinQueue = useCallback(
    (payload: { userId: string; username: string; rating: number; token?: string | null }) => {
      const socket = ensureSocket(url);
      currentUserId = payload.userId;
      socket.emit("join_queue", payload);
    },
    [url],
  );

  const leaveQueue = useCallback(() => {
    if (!sharedSocket) return;
    sharedSocket.emit("leave_queue");
  }, []);

  const playerReady = useCallback(
    (sessionId: string) => {
      if (!sharedSocket) return;
      sharedSocket.emit("player_ready", { session_id: sessionId });
    },
    [],
  );

  const submitAnswer = useCallback(
    (payload: {
      sessionId: string;
      roundNumber: number;
      answer: string;
      timeTakenMs: number;
    }) => {
      if (!sharedSocket) return;
      sharedSocket.emit("submit_answer", {
        session_id: payload.sessionId,
        round_number: payload.roundNumber,
        answer: payload.answer,
        time_taken_ms: payload.timeTakenMs,
      });
    },
    [],
  );

  const resetDuel = useCallback(() => {
    publish({
      sessionId: null,
      opponent: null,
      round: null,
      score: { me: 0, opp: 0 },
      duelEnd: null,
    });
  }, []);

  return {
    socket: sharedSocket,
    playersOnline: state.playersOnline,
    sessionId: state.sessionId,
    opponent: state.opponent,
    round: state.round,
    score: state.score,
    duelEnd: state.duelEnd,
    setDuelEnd: (duelEnd: DuelState["duelEnd"]) => publish({ duelEnd }),
    setRound: (round: DuelRound | null) => publish({ round }),
    setScore: (score: DuelState["score"]) => publish({ score }),
    joinQueue,
    leaveQueue,
    playerReady,
    submitAnswer,
    resetDuel,
    startLocalMockMatch,
  };
}
