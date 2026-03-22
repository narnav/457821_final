import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { useAppStore } from "../../stores/useAppStore";
import { apiRequest } from "../../services/api";
import { logError, logNav, logOnboarding } from "../../services/logger";

const goals = [
  { key: "JOB", title: "Land a dev job", subtitle: "Build skills that get you hired" },
  { key: "WORK", title: "Level up at work", subtitle: "I am already coding. Let us go deeper." },
  { key: "FUN", title: "Code for fun", subtitle: "Explore JS as a hobby" },
  { key: "PROJECT", title: "Build a project", subtitle: "I have something specific in mind" },
] as const;

const levels = [
  { key: "BEGINNER", title: "Complete Beginner", subtitle: "Never written a line of code" },
  { key: "BASICS", title: "I know the basics", subtitle: "Variables, functions, maybe loops" },
  { key: "INTERMEDIATE", title: "Intermediate", subtitle: "I build things, but have gaps" },
  { key: "ADVANCED", title: "Advanced", subtitle: "I want real challenges and depth" },
] as const;

const commitments = [
  { key: "10", title: "10 min", subtitle: "Quick daily habit" },
  { key: "15", title: "15 min", subtitle: "Steady progress" },
  { key: "30", title: "30 min", subtitle: "Fast track" },
] as const;

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<(typeof goals)[number]["key"] | undefined>(undefined);
  const [level, setLevel] = useState<(typeof levels)[number]["key"] | undefined>(undefined);
  const [commitment, setCommitment] = useState<(typeof commitments)[number]["key"]>("15");
  const accessToken = useAppStore((s) => s.accessToken);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathText = useMemo(
    () =>
      level === "ADVANCED"
        ? "We will throw you into Express APIs, async patterns, and advanced debugging."
        : "We will start with fundamentals: variables, loops, and functions through interactive challenges.",
    [level],
  );

  React.useEffect(() => {
    logNav("screen:enter", { screen: "OnboardingFlow" });
    return () => logNav("screen:leave", { screen: "OnboardingFlow" });
  }, []);

  React.useEffect(() => {
    logOnboarding("step:view", { step });
  }, [step]);

  const submitOnboarding = async () => {
    if (!goal || !level || !accessToken || submitting) return;
    logOnboarding("submit:start", {
      step,
      hasToken: Boolean(accessToken),
      goal,
      level,
      commitment,
    });
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiRequest<{
        onboardingCompleted: boolean;
        pathKey: "BEGINNER" | "ADVANCED";
      }>("/user/onboarding", {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({
          goal,
          experienceLevel: level,
          dailyCommitmentMinutes: Number(commitment),
        }),
      });
      setOnboarding(goal, level, commitment);
      if (response.onboardingCompleted) {
        logOnboarding("submit:success", { pathKey: response.pathKey });
        completeOnboarding({
          path: response.pathKey,
          goal,
          experience: level,
          commitment,
          notificationsEnabled: true,
        });
      }
    } catch (submitError) {
      logError("[ONBOARDING]", submitError, { phase: "submit" });
      setError(submitError instanceof Error ? submitError.message : "We could not save your setup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {step === 1 && (
        <StepFrame
          title="What brings you to CodeQuest?"
          onContinue={() => {
            logOnboarding("step:complete", { step: 1, goal });
            setStep(2);
          }}
          enabled={!!goal}
        >
          {goals.map((option) => (
            <ChoiceCard
              key={option.key}
              selected={goal === option.key}
              title={option.title}
              subtitle={option.subtitle}
              onPress={() => setGoal(option.key)}
            />
          ))}
        </StepFrame>
      )}

      {step === 2 && (
        <StepFrame
          title="How comfortable are you with JavaScript?"
          onContinue={() => {
            logOnboarding("step:complete", { step: 2, level });
            setStep(3);
          }}
          enabled={!!level}
        >
          {levels.map((option) => (
            <ChoiceCard
              key={option.key}
              selected={level === option.key}
              title={option.title}
              subtitle={option.subtitle}
              onPress={() => setLevel(option.key)}
            />
          ))}
        </StepFrame>
      )}

      {step === 3 && (
        <StepFrame
          title="How much time can you dedicate daily?"
          onContinue={() => {
            logOnboarding("step:complete", { step: 3, commitment });
            setStep(4);
          }}
          enabled
        >
          <View style={styles.row}>
            {commitments.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setCommitment(option.key)}
                style={[styles.circleCard, commitment === option.key && styles.circleCardSelected]}
              >
                <Text style={styles.circleTitle}>{option.title}</Text>
                <Text style={styles.circleSubtitle}>{option.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </StepFrame>
      )}

      {step === 4 && (
        <StepFrame
          title="Your path is ready"
          onContinue={submitOnboarding}
          enabled={!!goal && !!level}
          continueLabel={submitting ? "Saving..." : "Start My Path"}
        >
          <Text style={styles.pathText}>{pathText}</Text>
          <View style={styles.previewRow}>
            <MiniNode label="Foundations" />
            <MiniNode label="Logic" />
            <MiniNode label="Projects" />
            <MiniNode label="Mastery" />
          </View>
          {submitting ? <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.accent} /> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </StepFrame>
      )}
    </SafeAreaView>
  );
}

function StepFrame({
  title,
  onContinue,
  enabled,
  continueLabel = "Continue",
  children,
}: {
  title: string;
  onContinue: () => void;
  enabled: boolean;
  continueLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={SlideInRight.duration(300)} style={styles.step}>
      <View style={styles.mainContent}>
        <Text style={styles.title}>{title}</Text>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Pressable disabled={!enabled} onPress={onContinue} style={[styles.cta, !enabled && styles.disabled]}>
          <Text style={styles.ctaLabel}>{continueLabel}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ChoiceCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceCard, selected && styles.choiceCardSelected]}>
      <Text style={styles.choiceTitle}>{title}</Text>
      <Text style={styles.choiceSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function MiniNode({ label }: { label: string }) {
  return (
    <View style={styles.node}>
      <View style={styles.nodeDot} />
      <Text style={styles.nodeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  step: { flex: 1, paddingTop: spacing.huge, paddingHorizontal: spacing.xxl, justifyContent: "space-between" },
  mainContent: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: "800", marginBottom: spacing.xl, lineHeight: 40 },
  content: { gap: spacing.md, flexGrow: 1, paddingBottom: spacing.md },
  footer: { paddingTop: spacing.lg, paddingBottom: spacing.md },
  choiceCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  choiceCardSelected: { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 12 },
  choiceTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: "700" },
  choiceSubtitle: { color: colors.textSecondary, marginTop: spacing.sm },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  ctaLabel: { color: "#111", fontWeight: "800", fontSize: fontSize.base },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  circleCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  circleCardSelected: { borderColor: colors.accent },
  circleTitle: { color: colors.textPrimary, fontWeight: "800" },
  circleSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.xs },
  pathText: { color: colors.textSecondary, fontSize: fontSize.base, lineHeight: 24 },
  previewRow: { marginTop: spacing.xxl, flexDirection: "row", justifyContent: "space-between" },
  node: { alignItems: "center", gap: spacing.sm },
  nodeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent },
  nodeLabel: { color: colors.textSecondary, fontSize: fontSize.xs },
  errorText: { marginTop: spacing.md, color: colors.danger, textAlign: "center" },
});
