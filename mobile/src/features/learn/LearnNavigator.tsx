import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, AppState, AppStateStatus, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { CodeSnippet } from "../../components/CodeSnippet";
import { useAppStore } from "../../stores/useAppStore";
import { apiRequest } from "../../services/api";
import { getExercisePoolForLevel, PersonalizationLevel } from "../../data/personalizedExercisePool";
import { logError, logNav, logTasks } from "../../services/logger";

const Stack = createNativeStackNavigator();

interface ApiChapter {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
}

interface ApiLesson {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  orderIndex: number;
}

interface ApiExercise {
  id: string;
  type: "CONCEPT_CARD" | "MULTIPLE_CHOICE" | "FIND_THE_BUG" | "DRAG_DROP" | "CODE_FILL" | "TAP_TOKEN";
  prompt: string;
  codeSnippet: string;
  correctAnswer: string;
  explanation: string;
  xpReward: number;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

export function LearnNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="LearnRoadmap" component={LearnRoadmapScreen} options={{ title: "Learn" }} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="LessonResults" component={LessonResultsScreen} options={{ title: "Results" }} />
    </Stack.Navigator>
  );
}

function LearnRoadmapScreen({ navigation }: { navigation: any }) {
  const path = useAppStore((s) => s.path);
  const experience = useAppStore((s) => s.experience);
  const [chapterData, setChapterData] = useState<ApiChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logNav("screen:enter", { screen: "LearnRoadmapScreen" });
    return () => logNav("screen:leave", { screen: "LearnRoadmapScreen" });
  }, []);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      try {
        const chapters = await apiRequest<ApiChapter[]>(`/learning/chapters/${path}`);
        logTasks("chapters:loaded", { path, count: chapters.length });
        if (isActive) setChapterData(chapters);
      } catch (error) {
        logError("[TASKS]", error, { phase: "load-chapters", path });
      } finally {
        if (isActive) setLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [path]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{path} Concept Map</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          chapterData.map((chapter, index) => (
            <View key={chapter.id} style={styles.nodeWrap}>
              <View style={[styles.chapterNode, index === 0 && styles.chapterNodeActive]}>
                <Text style={styles.chapterTitle}>
                  Node {index + 1}: {chapter.title}
                </Text>
                <Text style={styles.chapterDesc}>{chapter.description}</Text>
                <Text style={styles.nodeStatus}>{index === 0 ? "Current node" : "Locked until previous node complete"}</Text>
              </View>
              <Pressable
                style={[styles.lessonButton, index > 0 && styles.disabled]}
                disabled={index > 0}
                onPress={async () => {
                  if (experience) {
                    navigation.navigate("Lesson", {
                      lessonId: `personalized-${experience}`,
                      lessonTitle: `${experience} Personalized Practice`,
                      personalizedLevel: experience,
                    });
                    return;
                  }
                  const lessons = await apiRequest<ApiLesson[]>(`/learning/lessons/${chapter.id}`);
                  if (lessons.length === 0) return;
                  navigation.navigate("Lesson", {
                    lessonId: lessons[0].id,
                    lessonTitle: lessons[0].title,
                  });
                }}
              >
                <Text style={styles.lessonButtonLabel}>{index === 0 ? "Enter Node" : "Locked"}</Text>
              </Pressable>
              {index < chapterData.length - 1 ? <View style={styles.connector} /> : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonScreen({ navigation, route }: { navigation: any; route: any }) {
  const lessonId = route.params?.lessonId as string;
  const lessonTitle = route.params?.lessonTitle as string;
  const personalizedLevel = route.params?.personalizedLevel as PersonalizationLevel | undefined;
  const addXp = useAppStore((s) => s.addXp);
  const accessToken = useAppStore((s) => s.accessToken);
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);

  useEffect(() => {
    logNav("screen:enter", { screen: "LessonScreen", lessonId });
    return () => logNav("screen:leave", { screen: "LessonScreen", lessonId });
  }, [lessonId]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      try {
        if (personalizedLevel) {
          const payload = getExercisePoolForLevel(personalizedLevel);
          logTasks("lesson:loaded-personalized", { level: personalizedLevel, count: payload.length });
          if (isActive) {
            setExercises(payload);
            setExerciseIndex(0);
            setCorrectCount(0);
            setAttemptedCount(0);
          }
          return;
        }
        const payload = await apiRequest<ApiExercise[]>(`/learning/exercises/${lessonId}`);
        logTasks("lesson:loaded-api", { lessonId, count: payload.length });
        if (isActive) {
          setExercises(payload);
          setExerciseIndex(0);
          setCorrectCount(0);
          setAttemptedCount(0);
        }
      } catch (error) {
        logError("[TASKS]", error, { phase: "load-exercises", lessonId });
      } finally {
        if (isActive) setLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [lessonId, personalizedLevel]);

  const exercise = exercises[exerciseIndex];
  const progress = exercises.length > 0 ? ((exerciseIndex + 1) / exercises.length) * 100 : 0;
  const isFocused = useIsFocused();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const trackedSecondsRef = useRef(0);

  const flushPracticeSeconds = useCallback(async () => {
    if (!accessToken || trackedSecondsRef.current <= 0) return;
    const seconds = trackedSecondsRef.current;
    trackedSecondsRef.current = 0;
    try {
      const dateKey = new Date().toLocaleDateString("en-CA");
      await apiRequest<{ practicedSeconds: number }>("/user/practice-log", {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({
          dateKey,
          practicedSeconds: seconds,
        }),
      });
    } catch {
      trackedSecondsRef.current += seconds;
    }
  }, [accessToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current === "active" && nextState !== "active") {
        void flushPracticeSeconds();
      }
      appStateRef.current = nextState;
    });
    return () => {
      subscription.remove();
    };
  }, [flushPracticeSeconds]);

  useEffect(() => {
    if (!isFocused || loading || !exercise) return;
    const timer = setInterval(() => {
      if (appStateRef.current === "active") {
        trackedSecondsRef.current += 1;
      }
    }, 1000);
    return () => {
      clearInterval(timer);
      void flushPracticeSeconds();
    };
  }, [exercise?.id, flushPracticeSeconds, isFocused, loading]);

  const onAnswer = async (isCorrect: boolean, xp: number, answer: string) => {
    setAttemptedCount((v) => v + 1);
    if (isCorrect) {
      setCorrectCount((v) => v + 1);
      if (accessToken && !personalizedLevel) {
        try {
          const result = await apiRequest<{ xpEarned: number }>("/learning/submit-exercise", {
            method: "POST",
            token: accessToken,
            body: JSON.stringify({
              exerciseId: exercise.id,
              answer,
              timeTakenMs: 1000,
              attempts: 1,
            }),
          });
          addXp(result.xpEarned);
        } catch {
          addXp(xp);
        }
      } else {
        addXp(xp);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    const next = exerciseIndex + 1;
    if (next >= exercises.length) {
      const accuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / (attemptedCount + 1)) * 100);
      navigation.replace("LessonResults", { accuracy, lessonTitle });
      return;
    }
    setExerciseIndex(next);
  };

  if (loading || !exercise) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading lesson...</Text>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.chapterDesc}>{lessonTitle}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {exerciseIndex + 1}/{exercises.length}
        </Text>
        <Text style={styles.prompt}>{exercise.prompt}</Text>
        <CodeSnippet code={exercise.codeSnippet} />
        <ExerciseRenderer exercise={exercise} onAnswer={(isCorrectAnswer, reward, answerValue) => void onAnswer(isCorrectAnswer, reward, answerValue)} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonResultsScreen({ navigation, route }: { navigation: any; route: any }) {
  const accuracy = route.params?.accuracy ?? 0;
  const lessonTitle = route.params?.lessonTitle ?? "Lesson";
  const level = useAppStore((s) => s.level);
  const xp = useAppStore((s) => s.xpTotal);
  const incrementLessonsCompleted = useAppStore((s) => s.incrementLessonsCompleted);
  const stars = accuracy > 90 ? 3 : accuracy > 70 ? 2 : 1;

  useEffect(() => {
    logNav("screen:enter", { screen: "LessonResultsScreen" });
    incrementLessonsCompleted();
    return () => logNav("screen:leave", { screen: "LessonResultsScreen" });
  }, [incrementLessonsCompleted]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={[styles.content, { justifyContent: "center" }]}>
        <Text style={styles.title}>Lesson Complete</Text>
        <Text style={styles.resultText}>{lessonTitle}</Text>
        <Text style={styles.resultText}>Accuracy: {accuracy}%</Text>
        <Text style={styles.resultText}>Level: {level}</Text>
        <Text style={styles.resultText}>Total XP: {xp}</Text>
        <Text style={styles.starRow}>{"⭐".repeat(stars)}</Text>
        <Pressable style={styles.lessonButton} onPress={() => navigation.navigate("LearnRoadmap")}>
          <Text style={styles.lessonButtonLabel}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ExerciseRenderer({
  exercise,
  onAnswer,
}: {
  exercise: ApiExercise;
  onAnswer: (isCorrect: boolean, xp: number, answer: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [orderedSelection, setOrderedSelection] = useState<string[]>([]);
  const [poolLines, setPoolLines] = useState<string[]>([]);

  const lineList = useMemo(() => exercise.codeSnippet.split("\n"), [exercise.codeSnippet]);
  useEffect(() => {
    setSelected(null);
    setInput("");
    setAttemptsLeft(3);
    setHasChecked(false);
    setIsCorrect(null);
    setOrderedSelection([]);
    setPoolLines(exercise.type === "DRAG_DROP" ? [...lineList].sort(() => Math.random() - 0.5) : []);
  }, [exercise.id, exercise.type, lineList]);

  if (exercise.type === "CONCEPT_CARD") {
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.explanation}>{exercise.explanation}</Text>
        <Pressable style={styles.lessonButton} onPress={() => onAnswer(true, exercise.xpReward, "concept-card")}>
          <Text style={styles.lessonButtonLabel}>Got it</Text>
        </Pressable>
      </View>
    );
  }

  if (exercise.type === "MULTIPLE_CHOICE") {
    const options = exercise.options.map((option) => option.text);
    const canCheck = !!selected && !hasChecked;
    return (
      <View style={styles.exerciseCard}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => setSelected(option)}
            style={[
              styles.option,
              selected === option && option === exercise.correctAnswer && styles.correct,
              selected === option && option !== exercise.correctAnswer && styles.wrong,
            ]}
          >
            <Text style={styles.optionLabel}>{option}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.lessonButton, !canCheck && styles.disabled]}
          disabled={!canCheck}
          onPress={() => {
            const nextIsCorrect = selected === exercise.correctAnswer;
            setIsCorrect(nextIsCorrect);
            setHasChecked(true);
          }}
        >
          <Text style={styles.lessonButtonLabel}>Check</Text>
        </Pressable>
        {hasChecked && (
          <>
            <Text style={[styles.feedback, isCorrect ? styles.feedbackGood : styles.feedbackBad]}>
              {isCorrect ? "Correct!" : "Not quite."}
            </Text>
            <Pressable style={styles.lessonButton} onPress={() => onAnswer(Boolean(isCorrect), exercise.xpReward, selected ?? "")}>
              <Text style={styles.lessonButtonLabel}>Next</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  if (exercise.type === "FIND_THE_BUG") {
    const canCheck = !!selected && !hasChecked;
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.hearts}>{"❤️".repeat(Math.max(0, attemptsLeft))}</Text>
        {lineList.map((line, idx) => (
          <Pressable
            key={`${line}-${idx}`}
            onPress={() => setSelected(String(idx + 1))}
            style={[styles.line, selected === String(idx + 1) && styles.lineSelected]}
          >
            <Text style={styles.lineText}>
              {idx + 1}. {line}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.lessonButton, !canCheck && styles.disabled]}
          disabled={!canCheck}
          onPress={() => {
            const nextIsCorrect = selected === exercise.correctAnswer;
            if (!nextIsCorrect) {
              setAttemptsLeft((v) => v - 1);
            }
            if (nextIsCorrect || attemptsLeft <= 1) {
              setIsCorrect(nextIsCorrect);
              setHasChecked(true);
            }
          }}
        >
          <Text style={styles.lessonButtonLabel}>Check Line</Text>
        </Pressable>
        {hasChecked && (
          <>
            <Text style={[styles.feedback, isCorrect ? styles.feedbackGood : styles.feedbackBad]}>
              {isCorrect ? "Great catch." : "Bug revealed. Review explanation and continue."}
            </Text>
            <Pressable style={styles.lessonButton} onPress={() => onAnswer(Boolean(isCorrect), exercise.xpReward, selected ?? "")}>
              <Text style={styles.lessonButtonLabel}>Next</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  if (exercise.type === "DRAG_DROP") {
    const canCheck = orderedSelection.length === lineList.length && !hasChecked;
    const normalizedAnswer = orderedSelection.join("||");
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.explanation}>Build the answer above. Tap a selected line to remove it.</Text>
        <View style={styles.answerZone}>
          <Text style={styles.answerZoneTitle}>
            Answer Zone ({orderedSelection.length}/{lineList.length})
          </Text>
          {orderedSelection.length === 0 ? (
            <Text style={styles.answerPreview}>No lines selected yet.</Text>
          ) : (
            orderedSelection.map((line, idx) => (
              <Pressable
                key={`${line}-${idx}`}
                style={styles.selectedLine}
                onPress={() => {
                  setOrderedSelection((current) => current.filter((_, itemIndex) => itemIndex !== idx));
                  setPoolLines((current) => [...current, line]);
                }}
              >
                <Text style={styles.lineText}>{line}</Text>
                <Text style={styles.removeIcon}>×</Text>
              </Pressable>
            ))
          )}
        </View>
        <Text style={styles.answerZoneTitle}>Line Pool</Text>
        {poolLines.map((line, idx) => (
          <Pressable
            key={`${line}-${idx}`}
            style={styles.option}
            onPress={() => {
              setOrderedSelection((current) => [...current, line]);
              setPoolLines((current) => current.filter((_, poolIndex) => poolIndex !== idx));
            }}
          >
            <Text style={styles.optionLabel}>{line}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.secondaryAction, orderedSelection.length === 0 && styles.disabled]}
          disabled={orderedSelection.length === 0}
          onPress={() => {
            setPoolLines([...lineList].sort(() => Math.random() - 0.5));
            setOrderedSelection([]);
            setHasChecked(false);
            setIsCorrect(null);
          }}
        >
          <Text style={styles.secondaryActionLabel}>Reset</Text>
        </Pressable>
        <Pressable
          style={[styles.lessonButton, !canCheck && styles.disabled]}
          disabled={!canCheck}
          onPress={() => {
            const nextIsCorrect = normalizedAnswer === exercise.correctAnswer;
            setIsCorrect(nextIsCorrect);
            setHasChecked(true);
          }}
        >
          <Text style={styles.lessonButtonLabel}>Check</Text>
        </Pressable>
        {hasChecked && (
          <>
            <Text style={[styles.feedback, isCorrect ? styles.feedbackGood : styles.feedbackBad]}>
              {isCorrect ? "Perfect order." : "Order is incorrect. Reset and try again, or continue."}
            </Text>
            <Pressable style={styles.lessonButton} onPress={() => onAnswer(Boolean(isCorrect), exercise.xpReward, normalizedAnswer)}>
              <Text style={styles.lessonButtonLabel}>Next</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  if (exercise.type === "CODE_FILL") {
    const tokens =
      exercise.options.length > 0
        ? exercise.options.map((option) => option.text)
        : ["const", "let", "return", "=>", "===", ".length"];
    const canCheck = input.trim().length > 0 && !hasChecked;
    return (
      <View style={styles.exerciseCard}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type answer"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <View style={styles.suggestionRow}>
          {tokens.map((token) => (
            <Pressable key={token} style={styles.token} onPress={() => setInput((v) => `${v}${token}`)}>
              <Text style={styles.tokenText}>{token}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.lessonButton, !canCheck && styles.disabled]}
          disabled={!canCheck}
          onPress={() => {
            const nextIsCorrect =
              input.replace(/\s/g, "") === exercise.correctAnswer.replace(/\s/g, "");
            setIsCorrect(nextIsCorrect);
            setHasChecked(true);
          }}
        >
          <Text style={styles.lessonButtonLabel}>Submit</Text>
        </Pressable>
        {hasChecked && (
          <>
            <Text style={[styles.feedback, isCorrect ? styles.feedbackGood : styles.feedbackBad]}>
              {isCorrect ? "Nice work." : "Try another token combination next time."}
            </Text>
            <Pressable style={styles.lessonButton} onPress={() => onAnswer(Boolean(isCorrect), exercise.xpReward, input)}>
              <Text style={styles.lessonButtonLabel}>Next</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const canCheck = !!selected && !hasChecked;
  const tokenOptions =
    exercise.options.length > 0
      ? exercise.options.map((option) => option.text)
      : exercise.codeSnippet.split(" ");
  return (
    <View style={styles.exerciseCard}>
      <Text style={styles.explanation}>Tap the correct token from this list.</Text>
      {tokenOptions.map((token, idx) => (
        <Pressable key={`${token}-${idx}`} style={styles.option} onPress={() => setSelected(token)}>
          <Text style={styles.optionLabel}>{token}</Text>
        </Pressable>
      ))}
      <Pressable
        style={[styles.lessonButton, !canCheck && styles.disabled]}
        disabled={!canCheck}
        onPress={() => {
          const nextIsCorrect = selected === exercise.correctAnswer;
          setIsCorrect(nextIsCorrect);
          setHasChecked(true);
        }}
      >
        <Text style={styles.lessonButtonLabel}>Check</Text>
      </Pressable>
      {hasChecked && (
        <>
          <Text style={[styles.feedback, isCorrect ? styles.feedbackGood : styles.feedbackBad]}>
            {isCorrect ? "Token identified." : "Wrong token. Continue and review."}
          </Text>
          <Pressable style={styles.lessonButton} onPress={() => onAnswer(Boolean(isCorrect), exercise.xpReward, selected ?? "")}>
            <Text style={styles.lessonButtonLabel}>Next</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, gap: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: "800" },
  chapterNode: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.lg },
  chapterNodeActive: { borderColor: colors.accent },
  chapterTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: "700" },
  nodeStatus: { color: colors.success, marginTop: spacing.sm, fontSize: fontSize.sm },
  nodeWrap: { alignItems: "center" },
  connector: { width: 2, height: spacing.lg, backgroundColor: colors.border, marginTop: spacing.sm },
  chapterDesc: { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.lg },
  lessonButton: { backgroundColor: colors.accent, padding: spacing.md, borderRadius: radius.button, alignItems: "center", marginTop: spacing.md },
  lessonButtonLabel: { color: "#111", fontWeight: "800" },
  progressTrack: { width: "100%", height: 8, backgroundColor: colors.surface, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: colors.accent },
  progressText: { color: colors.textSecondary },
  prompt: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: "700" },
  exerciseCard: { backgroundColor: colors.card, borderRadius: radius.card, borderColor: colors.border, borderWidth: 1, padding: spacing.lg },
  explanation: { color: colors.textSecondary, lineHeight: 22 },
  option: { padding: spacing.md, borderRadius: radius.button, borderColor: colors.border, borderWidth: 1, marginTop: spacing.sm },
  optionLabel: { color: colors.textPrimary },
  correct: { borderColor: colors.success, backgroundColor: "rgba(78,205,196,0.2)" },
  wrong: { borderColor: colors.danger, backgroundColor: "rgba(255,107,107,0.2)" },
  hearts: { fontSize: fontSize.lg, marginBottom: spacing.sm },
  line: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.button, padding: spacing.md, marginBottom: spacing.sm },
  lineSelected: { borderColor: colors.accent },
  lineText: { color: colors.textPrimary, fontFamily: "monospace" },
  answerPreview: { color: colors.textSecondary, marginTop: spacing.md },
  answerZone: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  answerZoneTitle: { color: colors.textSecondary, fontWeight: "700", marginBottom: spacing.sm },
  selectedLine: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(247,223,30,0.08)",
  },
  removeIcon: { color: colors.danger, fontSize: fontSize.md, fontWeight: "800" },
  secondaryAction: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    alignItems: "center",
  },
  secondaryActionLabel: { color: colors.textPrimary, fontWeight: "700" },
  feedback: { marginTop: spacing.md, fontWeight: "700" },
  feedbackGood: { color: colors.success },
  feedbackBad: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  suggestionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  token: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tokenText: { color: colors.accent, fontSize: fontSize.sm },
  resultText: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.md },
  starRow: { fontSize: fontSize.xl, marginTop: spacing.lg },
  disabled: { opacity: 0.5 },
});
