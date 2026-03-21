import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { useAppStore } from "../../stores/useAppStore";
import { getPuzzleForDate, isPuzzleAnswerCorrect } from "../../data/dailyPuzzles";

export function DailyPuzzleScreen({ navigation }: { navigation: any }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const addXp = useAppStore((s) => s.addXp);
  const markDailyPuzzleSolved = useAppStore((s) => s.markDailyPuzzleSolved);
  const solvedDate = useAppStore((s) => s.lastDailyPuzzleSolvedDate);
  const puzzleSolvedIdByDate = useAppStore((s) => s.puzzleSolvedIdByDate);
  const dateKey = new Date().toLocaleDateString("en-CA");
  const puzzle = useMemo(() => getPuzzleForDate(new Date()), []);
  const alreadySolved = solvedDate === dateKey || puzzleSolvedIdByDate[dateKey] === puzzle.id;

  const onSubmit = () => {
    if (alreadySolved) {
      setMessage("You already solved today's puzzle.");
      return;
    }
    if (!input.trim()) {
      setMessage("Please enter a one-line JavaScript expression.");
      return;
    }
    if (!isPuzzleAnswerCorrect(puzzle, input)) {
      setMessage("Not quite. Try another valid one-line expression.");
      return;
    }
    addXp(40);
    markDailyPuzzleSolved(dateKey, puzzle.id);
    setMessage("Puzzle solved! +40 XP and today's Puzzle Solved badge progress updated.");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Daily Code Puzzle</Text>
        <Text style={styles.prompt}>{puzzle.prompt}</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Type one-line expression"
          placeholderTextColor={colors.textMuted}
          multiline={false}
          accessibilityLabel="Daily puzzle answer input"
        />
        <Pressable style={styles.submitButton} onPress={onSubmit} accessibilityLabel="Submit daily puzzle answer">
          <Text style={styles.submitLabel}>Submit Puzzle</Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityLabel="Close daily puzzle">
          <Text style={styles.secondaryLabel}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xxl, paddingTop: spacing.giant, gap: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: "800" },
  prompt: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 28 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.base,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  submitLabel: { color: "#111", fontWeight: "800", fontSize: fontSize.md },
  message: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24 },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: { color: colors.textPrimary, fontWeight: "700" },
});
