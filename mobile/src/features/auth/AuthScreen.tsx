import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { useAppStore } from "../../stores/useAppStore";
import { apiRequest } from "../../services/api";
import { logAuth, logError, logNav } from "../../services/logger";
import { API_BASE_URL } from "../../config/network";

export function AuthScreen() {
  const signIn = useAppStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(
    () => email.includes("@") && password.length >= 6 && (isLogin || username.length >= 2),
    [email, password, username, isLogin],
  );
  const onSocialPress = () => {
    Alert.alert(
      "Coming Soon",
      "Social login will be available in the full app build. For now, please create an account with email and password.",
    );
  };

  React.useEffect(() => {
    logNav("screen:enter", { screen: "AuthScreen" });
    return () => logNav("screen:leave", { screen: "AuthScreen" });
  }, []);

  const onSubmit = async () => {
    if (!canSubmit || loading) return;
    logAuth("submit:start", { mode: isLogin ? "login" : "register", email });
    if (__DEV__) {
      console.log("[AUTH] submit:start", {
        mode: isLogin ? "login" : "register",
        email,
        apiBaseUrl: API_BASE_URL,
      });
    }
    setLoading(true);
    setError(null);
    try {
      const response = isLogin
        ? await apiRequest<{
            user: {
              id: string;
              email: string;
              username: string;
              avatarUrl?: string | null;
              onboardingCompleted: boolean;
              pathKey: "BEGINNER" | "ADVANCED";
              goal?: "JOB" | "WORK" | "FUN" | "PROJECT" | null;
              experienceLevel?: "BEGINNER" | "BASICS" | "INTERMEDIATE" | "ADVANCED" | null;
              dailyCommitmentMinutes?: number | null;
              notificationsEnabled?: boolean | null;
            };
            accessToken: string;
            refreshToken: string;
          }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          })
        : await apiRequest<{
            user: {
              id: string;
              email: string;
              username: string;
              avatarUrl?: string | null;
              onboardingCompleted: boolean;
              pathKey: "BEGINNER" | "ADVANCED";
              goal?: "JOB" | "WORK" | "FUN" | "PROJECT" | null;
              experienceLevel?: "BEGINNER" | "BASICS" | "INTERMEDIATE" | "ADVANCED" | null;
              dailyCommitmentMinutes?: number | null;
              notificationsEnabled?: boolean | null;
            };
            accessToken: string;
            refreshToken: string;
          }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, username, password }),
          });

      if (__DEV__) {
        console.log("[AUTH] submit:response", {
          mode: isLogin ? "login" : "register",
          userId: response.user.id,
          onboardingCompleted: response.user.onboardingCompleted,
        });
      }
      signIn({
        userId: response.user.id,
        email: response.user.email,
        username: response.user.username,
        avatarUrl: response.user.avatarUrl,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        onboardingCompleted: response.user.onboardingCompleted,
        pathKey: response.user.pathKey,
        goal: response.user.goal,
        experienceLevel: response.user.experienceLevel,
        dailyCommitmentMinutes: response.user.dailyCommitmentMinutes,
        notificationsEnabled: response.user.notificationsEnabled,
      });
      logAuth("submit:success", {
        mode: isLogin ? "login" : "register",
        userId: response.user.id,
        onboardingCompleted: response.user.onboardingCompleted,
      });
    } catch (submitError) {
      if (__DEV__) {
        console.log("[AUTH] submit:error", submitError);
      }
      logError("[AUTH]", submitError, { mode: isLogin ? "login" : "register" });
      setError(submitError instanceof Error ? submitError.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          {isLogin ? "Welcome back. Sign in to continue." : "Save your progress. Create a free account."}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email input"
        />
        {!isLogin && (
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            accessibilityLabel="Username input"
          />
        )}
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={secure}
            accessibilityLabel="Password input"
          />
          <Pressable onPress={() => setSecure((v) => !v)} style={styles.showHide}>
            <Text style={styles.showHideText}>{secure ? "Show" : "Hide"}</Text>
          </Pressable>
        </View>
        <Pressable
          disabled={!canSubmit}
          style={[styles.primaryButton, !canSubmit && styles.disabled]}
          onPress={onSubmit}
          accessibilityLabel={isLogin ? "Sign in" : "Create account"}
        >
          <Text style={styles.primaryLabel}>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</Text>
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
          onPress={onSocialPress}
          accessibilityLabel="Continue with Apple"
        >
          <View style={styles.socialRow}>
            <FontAwesome name="apple" size={20} color={colors.textPrimary} style={styles.socialIcon} />
            <Text style={styles.secondaryLabel}>Continue with Apple</Text>
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
          onPress={onSocialPress}
          accessibilityLabel="Continue with external provider"
        >
          <View style={styles.socialRow}>
            <FontAwesome name="user-circle-o" size={18} color={colors.textPrimary} style={styles.socialIcon} />
            <Text style={styles.secondaryLabel}>Continue with Provider</Text>
          </View>
        </Pressable>
        <Text style={styles.terms}>By continuing, you agree to our Terms and Privacy Policy.</Text>
        <Pressable onPress={() => setIsLogin((v) => !v)} style={styles.switchAuthBtn}>
          <Text style={styles.switchAuthText}>
            {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.xxl, paddingTop: spacing.huge, paddingBottom: spacing.xl },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: "800", marginBottom: spacing.xxl },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  passwordInput: { flex: 1, marginBottom: 0 },
  showHide: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  showHideText: { color: colors.accent, fontWeight: "700" },
  primaryButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  disabled: { opacity: 0.45 },
  primaryLabel: { color: "#111", fontWeight: "800" },
  secondaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryPressed: { opacity: 0.85 },
  socialRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  socialIcon: { marginRight: spacing.sm },
  secondaryLabel: { color: colors.textPrimary, fontWeight: "700" },
  terms: { marginTop: spacing.xl, color: colors.textSecondary, fontSize: fontSize.sm, textAlign: "center" },
  errorText: { color: colors.danger, marginTop: spacing.md, textAlign: "center" },
  switchAuthBtn: { marginTop: spacing.lg, alignItems: "center" },
  switchAuthText: { color: colors.accent, fontWeight: "700" },
});
