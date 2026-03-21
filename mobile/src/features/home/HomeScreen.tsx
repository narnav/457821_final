import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../stores/useAppStore";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { logNav } from "../../services/logger";

export function HomeScreen({ navigation }: { navigation: any }) {
  React.useEffect(() => {
    logNav("screen:enter", { screen: "HomeScreen" });
    return () => logNav("screen:leave", { screen: "HomeScreen" });
  }, []);

  const username = useAppStore((s) => s.username);
  const level = useAppStore((s) => s.level);
  const xp = useAppStore((s) => s.xpTotal);
  const streak = useAppStore((s) => s.streakCurrent);
  const streakDays = useAppStore((s) => s.streakDays);
  const streakShieldAvailable = useAppStore((s) => s.streakShieldAvailable);
  const multiplierFactor = useAppStore((s) => s.xpMultiplierFactor);
  const multiplierEndsAt = useAppStore((s) => s.xpMultiplierEndsAt);
  const setXpMultiplier = useAppStore((s) => s.setXpMultiplier);

  React.useEffect(() => {
    const now = Date.now();
    if (multiplierEndsAt && multiplierEndsAt > now) return;
    const shouldSpawnWindow = new Date().getDay() === 0 || Math.random() < 0.35;
    if (!shouldSpawnWindow) {
      setXpMultiplier({ factor: 1, endsAt: null });
      return;
    }
    setXpMultiplier({ factor: 2, endsAt: now + 30 * 60 * 1000 });
  }, [multiplierEndsAt, setXpMultiplier]);

  const levelFloorXp = (level - 1) * 250;
  const nextLevelXp = level * 250;
  const currentLevelProgress = Math.min(100, ((xp - levelFloorXp) / 250) * 100);
  const remainingMultiplierMs = multiplierEndsAt ? Math.max(0, multiplierEndsAt - Date.now()) : 0;
  const multiplierMinutes = Math.floor(remainingMultiplierMs / 60000);
  const multiplierSeconds = Math.floor((remainingMultiplierMs % 60000) / 1000);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Good morning, {username} 👋</Text>
        <Text style={styles.date}>{new Date().toDateString()}</Text>

        {multiplierEndsAt && remainingMultiplierMs > 0 ? (
          <View style={styles.multiplierCard}>
            <Text style={styles.cardTitle}>
              ⚡ {multiplierFactor.toFixed(0)}x XP Window
            </Text>
            <Text style={styles.timer}>
              Ends in {String(multiplierMinutes).padStart(2, "0")}:{String(multiplierSeconds).padStart(2, "0")}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 {streak}-day streak!</Text>
          <Text style={styles.subText}>
            {streakShieldAvailable ? "🛡️ Streak Shield ready (one miss protected)" : "Reach 7 days to unlock a Streak Shield"}
          </Text>
          <View style={styles.row}>
            {streakDays.map((done, idx) => (
              <View key={idx} style={[styles.dot, done && styles.dotDone, idx === 6 && styles.dotToday]} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Level {level} · {xp} / {nextLevelXp} XP
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${currentLevelProgress}%` }]} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.cardTitle}>Continue Learning</Text>
          <Text style={styles.subText}>Jump back into your roadmap and keep your streak alive.</Text>
          <Pressable style={styles.primary} onPress={() => navigation.navigate("LearnTab")}>
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>

        <View style={styles.dailyCard}>
          <Text style={styles.cardTitle}>👑 Daily Challenge</Text>
          <Text style={styles.subText}>Find the bug in a loop boundary and earn +80 XP bonus.</Text>
          <Text style={styles.timer}>Resets daily</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧩 Daily Code Puzzle</Text>
          <Text style={styles.subText}>Solve one expression puzzle each day for a bonus badge.</Text>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate("DailyPuzzle")}>
            <Text style={styles.secondaryText}>Open Puzzle</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚔️ Duel Mode</Text>
          <Text style={styles.subText}>Challenge players worldwide.</Text>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate("DuelTab")}>
            <Text style={styles.secondaryText}>Find a Match</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.massive },
  greeting: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: "800" },
  date: { color: colors.textSecondary, marginBottom: spacing.md },
  multiplierCard: {
    backgroundColor: "#2a2300",
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(247,223,30,0.45)",
  },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  heroCard: { backgroundColor: "#243b53", borderRadius: radius.card, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  dailyCard: {
    backgroundColor: "#3b3200",
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(247,223,30,0.4)",
  },
  cardTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: fontSize.md },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.textMuted },
  dotDone: { backgroundColor: colors.accent },
  dotToday: { borderWidth: 2, borderColor: colors.success },
  progressTrack: { marginTop: spacing.md, height: 10, borderRadius: 5, backgroundColor: "#0f172a", overflow: "hidden" },
  progressFill: { height: 10, backgroundColor: colors.accent },
  subText: { color: colors.textSecondary, marginTop: spacing.sm },
  primary: { marginTop: spacing.lg, backgroundColor: colors.accent, borderRadius: radius.button, padding: spacing.md, alignItems: "center" },
  primaryText: { color: "#111", fontWeight: "800" },
  timer: { color: colors.accent, marginTop: spacing.md, fontWeight: "700" },
  secondary: { marginTop: spacing.md, borderColor: colors.duel, borderWidth: 1, borderRadius: radius.button, padding: spacing.md, alignItems: "center" },
  secondaryText: { color: colors.duel, fontWeight: "700" },
});
