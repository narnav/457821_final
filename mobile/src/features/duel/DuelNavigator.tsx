import React, { useEffect, useMemo, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { useDuelSocket } from "../../hooks/useDuelSocket";
import { CodeSnippet } from "../../components/CodeSnippet";
import { useAppStore } from "../../stores/useAppStore";
import { logDuel, logNav } from "../../services/logger";

const Stack = createNativeStackNavigator();

export function DuelNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="DuelHome" component={DuelHomeScreen} options={{ title: "Duel" }} />
      <Stack.Screen name="Matchmaking" component={MatchmakingScreen} options={{ title: "Matchmaking" }} />
      <Stack.Screen name="ActiveDuel" component={ActiveDuelScreen} options={{ title: "Live Duel" }} />
      <Stack.Screen name="DuelResults" component={DuelResultsScreen} options={{ title: "Results" }} />
    </Stack.Navigator>
  );
}

function DuelHomeScreen({ navigation }: { navigation: any }) {
  const { resetDuel } = useDuelSocket();
  const duelRating = useAppStore((s) => s.duelRating);
  const duelWins = useAppStore((s) => s.duelWins);
  const duelLosses = useAppStore((s) => s.duelLosses);
  const duelDraws = useAppStore((s) => s.duelDraws);
  useEffect(() => {
    logNav("screen:enter", { screen: "DuelHomeScreen" });
    return () => logNav("screen:leave", { screen: "DuelHomeScreen" });
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Text style={styles.title}>Duel Rating: {duelRating} RP</Text>
      <Text style={styles.sub}>
        Win/Loss/Draw: {duelWins} / {duelLosses} / {duelDraws}
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Duels</Text>
        <Text style={styles.sub}>vs AsyncNinja · Win · +0.8s faster</Text>
        <Text style={styles.sub}>vs ScopeMaster · Loss · -1.4s slower</Text>
      </View>
      <Pressable
        style={styles.matchBtn}
        onPress={() => {
          logDuel("matchmaking:start");
          resetDuel();
          navigation.navigate("Matchmaking");
        }}
      >
        <Text style={styles.matchLabel}>Find a Match</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function MatchmakingScreen({ navigation }: { navigation: any }) {
  const { playersOnline, sessionId, opponent, joinQueue, leaveQueue, startLocalMockMatch } = useDuelSocket();
  const userId = useAppStore((s) => s.userId);
  const username = useAppStore((s) => s.username);
  const duelRating = useAppStore((s) => s.duelRating);
  const accessToken = useAppStore((s) => s.accessToken);
  const [seconds, setSeconds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const hasJoinedQueueRef = React.useRef(false);

  useEffect(() => {
    logNav("screen:enter", { screen: "MatchmakingScreen" });
    return () => logNav("screen:leave", { screen: "MatchmakingScreen" });
  }, []);

  useEffect(() => {
    if (!userId || hasJoinedQueueRef.current) return;
    hasJoinedQueueRef.current = true;
    joinQueue({ userId, username, rating: duelRating, token: accessToken });
    logDuel("queue:join", { userId });
    const interval = setInterval(() => setSeconds((v) => v + 1), 1000);
    const timeout = setTimeout(() => {
      if (!sessionId) {
        startLocalMockMatch();
      }
    }, 20000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      logDuel("queue:leave", { userId: userId ?? "unknown" });
      leaveQueue();
      hasJoinedQueueRef.current = false;
    };
  }, [accessToken, duelRating, joinQueue, leaveQueue, startLocalMockMatch, userId, username]);

  useEffect(() => {
    if (sessionId && opponent) {
      const timer = setInterval(() => {
        setCountdown((value) => Math.max(0, value - 1));
      }, 700);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [sessionId, opponent]);

  useEffect(() => {
    if (sessionId && opponent && countdown === 0) {
      navigation.replace("ActiveDuel");
    }
  }, [countdown, navigation, opponent, sessionId]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Text style={styles.searching}>Searching for an opponent...</Text>
      <Text style={styles.sub}>⚡ {playersOnline || 143} players online</Text>
      <Text style={styles.sub}>Estimated wait: {seconds}s</Text>
      {opponent && <Text style={styles.vs}>VS {opponent.username} · {countdown}</Text>}
      <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryLabel}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function ActiveDuelScreen({ navigation }: { navigation: any }) {
  const { round, score, sessionId, submitAnswer, playerReady, duelEnd, opponent } = useDuelSocket();
  const addXp = useAppStore((s) => s.addXp);
  const applyDuelResult = useAppStore((s) => s.applyDuelResult);
  const userId = useAppStore((s) => s.userId);
  const username = useAppStore((s) => s.username);
  const opponentName = opponent?.username ?? "Opponent";
  const [roundNumber, setRoundNumber] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const currentRound = useMemo(() => roundNumber, [roundNumber]);

  useEffect(() => {
    logNav("screen:enter", { screen: "ActiveDuelScreen" });
    return () => logNav("screen:leave", { screen: "ActiveDuelScreen" });
  }, []);

  useEffect(() => {
    setMyScore(score.me);
    setOppScore(score.opp);
    if (round) {
      setOverlayVisible(true);
      const timeout = setTimeout(() => setOverlayVisible(false), 1600);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [score]);

  useEffect(() => {
    if (round) {
      setRoundNumber(round.roundNumber);
      setSelected(null);
    }
  }, [round]);

  useEffect(() => {
    if (sessionId && userId) {
      playerReady(sessionId);
    }
  }, [playerReady, sessionId, userId]);

  useEffect(() => {
    if (duelEnd) {
      logDuel("duel:end", { won: duelEnd.won, xpEarned: duelEnd.xpEarned });
      addXp(duelEnd.xpEarned);
      applyDuelResult({ won: duelEnd.won, ratingDelta: duelEnd.ratingDelta });
      navigation.replace("DuelResults", {
        won: duelEnd.won,
        score: `${myScore}-${oppScore}`,
        replay: duelEnd.roundReplay,
      });
    }
  }, [addXp, applyDuelResult, duelEnd, myScore, navigation, oppScore]);

  useEffect(() => {
    setTimeLeft(15);
    const interval = setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(interval);
  }, [currentRound]);

  if (!round) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={styles.sub}>Waiting for round start...</Text>
      </SafeAreaView>
    );
  }

  const submit = (answer: string) => {
    if (!sessionId || !userId) return;
    submitAnswer({
      sessionId,
      roundNumber,
      answer,
      timeTakenMs: (15 - timeLeft) * 1000,
    });
    setSelected(answer);
  };

  const renderAnswerZone = () => {
    if (round.type === "FIND_THE_BUG") {
      return round.codeSnippet.split("\n").map((line, idx) => (
        <Pressable
          key={`${line}-${idx}`}
          style={[styles.option, selected === String(idx + 1) && styles.correct]}
          onPress={() => submit(String(idx + 1))}
        >
          <Text style={styles.optionLabel} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.9}>
            {idx + 1}. {line}
          </Text>
        </Pressable>
      ));
    }

    return round.options.map((option) => (
      <Pressable
        key={option}
        style={[
          styles.option,
          selected === option && option === round.correctAnswer && styles.correct,
          selected === option && option !== round.correctAnswer && styles.wrong,
        ]}
        onPress={() => submit(option)}
      >
        <Text style={styles.optionLabel} numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.9}>
          {option}
        </Text>
      </Pressable>
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.duelContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressBar}>
          <View style={[styles.progressInner, { width: `${(timeLeft / 15) * 100}%` }]} />
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{username} {myScore}</Text>
          <Text style={styles.score}>Round {roundNumber}/5</Text>
          <Text style={styles.score}>{opponentName} {oppScore}</Text>
        </View>
        <Text style={styles.cardTitle}>{round.prompt}</Text>
        <View style={styles.codeWrap}>
          <CodeSnippet code={round.codeSnippet} />
        </View>
        <View style={styles.card}>
          <ScrollView style={styles.answersScroll} nestedScrollEnabled>
            {renderAnswerZone()}
          </ScrollView>
        </View>
      </ScrollView>
      {overlayVisible && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Round Update</Text>
          <Text style={styles.overlayText}>
            {myScore === oppScore ? "Tie round" : myScore > oppScore ? "You lead" : "Opponent leads"}
          </Text>
          <Text style={styles.overlayText}>Score: {myScore} - {oppScore}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function DuelResultsScreen({ route, navigation }: { route: any; navigation: any }) {
  const { won, score } = route.params;
  const replay = (route.params?.replay ?? []) as Array<{
    roundNumber: number;
    player1TimeMs: number;
    player2TimeMs: number;
    winnerUserId: string | null;
  }>;

  useEffect(() => {
    logNav("screen:enter", { screen: "DuelResultsScreen" });
    return () => logNav("screen:leave", { screen: "DuelResultsScreen" });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.duelContent}>
        <Text style={styles.title}>{won ? "Victory!" : "Defeat"}</Text>
        <Text style={styles.sub}>Final score: {score}</Text>
        <Text style={styles.sub}>{won ? "+50 RP · +100 XP" : "-20 RP · +30 XP"}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Code Replay</Text>
          {replay.length === 0 ? (
            <Text style={styles.sub}>Replay is unavailable for this duel.</Text>
          ) : (
            replay.map((item) => {
              const total = Math.max(1, item.player1TimeMs + item.player2TimeMs);
              const p1Flex = Math.max(0.25, item.player1TimeMs / total);
              const p2Flex = Math.max(0.25, item.player2TimeMs / total);
              return (
                <View key={`replay-${item.roundNumber}`} style={styles.replayRow}>
                  <Text style={styles.sub}>Round {item.roundNumber}</Text>
                  <View style={styles.replayTrack}>
                    <View style={[styles.replayBarMine, { flex: p1Flex }]} />
                    <View style={[styles.replayBarOpp, { flex: p2Flex }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
        <Pressable style={styles.matchBtn} onPress={() => navigation.navigate("DuelHome")}>
          <Text style={styles.matchLabel}>Back to Duel Home</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.replace("Matchmaking")}>
          <Text style={styles.secondaryLabel}>Play Again</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xxl },
  duelContent: { gap: spacing.md, paddingBottom: spacing.massive },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: "800" },
  sub: { color: colors.textSecondary, marginTop: spacing.sm },
  card: { marginTop: spacing.xl, backgroundColor: colors.card, borderRadius: radius.card, borderColor: colors.border, borderWidth: 1, padding: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: fontSize.md, marginTop: spacing.lg },
  matchBtn: { marginTop: spacing.xxl, backgroundColor: colors.duel, borderRadius: radius.button, padding: spacing.lg, alignItems: "center" },
  matchLabel: { color: colors.textPrimary, fontWeight: "800" },
  secondaryBtn: { marginTop: spacing.xl, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: "center" },
  secondaryLabel: { color: colors.textPrimary },
  searching: { color: colors.duel, fontWeight: "800", fontSize: fontSize.lg },
  vs: { color: colors.textPrimary, marginTop: spacing.xl, fontSize: fontSize.xl, fontWeight: "800" },
  progressBar: { height: 6, backgroundColor: colors.surface, borderRadius: 4, overflow: "hidden", marginBottom: spacing.lg },
  progressInner: { height: 6, backgroundColor: colors.duel },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  score: { color: colors.textPrimary, fontWeight: "800" },
  option: { padding: spacing.md, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  optionLabel: { color: colors.textPrimary, flexShrink: 1, lineHeight: 20 },
  correct: { borderColor: colors.success, backgroundColor: "rgba(78,205,196,0.2)" },
  wrong: { borderColor: colors.danger, backgroundColor: "rgba(255,107,107,0.2)" },
  overlay: {
    position: "absolute",
    left: spacing.xxl,
    right: spacing.xxl,
    top: "40%",
    backgroundColor: "rgba(13,13,13,0.95)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  overlayTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: fontSize.md },
  overlayText: { color: colors.textSecondary, marginTop: spacing.sm },
  codeWrap: { maxHeight: 220 },
  answersScroll: { maxHeight: 250 },
  replayRow: { marginTop: spacing.md },
  replayTrack: {
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
    flexDirection: "row",
  },
  replayBarMine: { height: 10, backgroundColor: colors.success },
  replayBarOpp: { height: 10, backgroundColor: colors.duel },
});
