import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAppStore } from "../../stores/useAppStore";
import { colors, fontSize, radius, spacing } from "../../theme/theme";
import { apiRequest } from "../../services/api";
import { logError, logNav } from "../../services/logger";

const goals = [
  { key: "JOB", label: "Land a dev job" },
  { key: "WORK", label: "Level up at work" },
  { key: "FUN", label: "Code for fun" },
  { key: "PROJECT", label: "Build a project" },
] as const;

const levels = [
  { key: "BEGINNER", label: "Complete Beginner" },
  { key: "BASICS", label: "I Know the Basics" },
  { key: "INTERMEDIATE", label: "Intermediate" },
  { key: "ADVANCED", label: "Advanced" },
] as const;

const commitmentOptions = [
  { key: "10", label: "10 min" },
  { key: "15", label: "15 min" },
  { key: "30", label: "30 min" },
] as const;

interface ProfilePayload {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  progress: {
    goal: "JOB" | "WORK" | "FUN" | "PROJECT" | null;
    experienceLevel: "BEGINNER" | "BASICS" | "INTERMEDIATE" | "ADVANCED" | null;
    dailyCommitmentMinutes: 10 | 15 | 30 | null;
    notificationsEnabled: boolean;
    onboardingCompleted: boolean;
  } | null;
  duelRating: {
    rating: number;
    wins: number;
    losses: number;
    draws: number;
  } | null;
}

export function ProfileScreen() {
  React.useEffect(() => {
    logNav("screen:enter", { screen: "ProfileScreen" });
    return () => logNav("screen:leave", { screen: "ProfileScreen" });
  }, []);

  const username = useAppStore((s) => s.username);
  const email = useAppStore((s) => s.email);
  const avatarUrl = useAppStore((s) => s.avatarUrl);
  const level = useAppStore((s) => s.level);
  const xp = useAppStore((s) => s.xpTotal);
  const streakCurrent = useAppStore((s) => s.streakCurrent);
  const lessonsCompleted = useAppStore((s) => s.lessonsCompleted);
  const duelWins = useAppStore((s) => s.duelWins);
  const duelLosses = useAppStore((s) => s.duelLosses);
  const duelRating = useAppStore((s) => s.duelRating);
  const streakShieldAvailable = useAppStore((s) => s.streakShieldAvailable);
  const goal = useAppStore((s) => s.goal);
  const experience = useAppStore((s) => s.experience);
  const commitment = useAppStore((s) => s.commitment);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const accessToken = useAppStore((s) => s.accessToken);
  const soundsEnabled = useAppStore((s) => s.soundsEnabled);
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const toggleSounds = useAppStore((s) => s.toggleSounds);
  const toggleHaptics = useAppStore((s) => s.toggleHaptics);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const setUserIdentity = useAppStore((s) => s.setUserIdentity);
  const signOut = useAppStore((s) => s.signOut);
  const [draftGoal, setDraftGoal] = React.useState<typeof goals[number]["key"]>(goal ?? "FUN");
  const [draftLevel, setDraftLevel] = React.useState<typeof levels[number]["key"]>(experience ?? "BEGINNER");
  const [draftCommitment, setDraftCommitment] = React.useState<typeof commitmentOptions[number]["key"]>(commitment ?? "15");
  const [draftNotifications, setDraftNotifications] = React.useState<boolean>(notificationsEnabled);
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [screenLoading, setScreenLoading] = React.useState(true);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [usernameModalVisible, setUsernameModalVisible] = React.useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [draftUsername, setDraftUsername] = React.useState(username);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmDeleteText, setConfirmDeleteText] = React.useState("");
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const duelTotal = duelWins + duelLosses;
  const duelWinRate = duelTotal > 0 ? `${Math.round((duelWins / duelTotal) * 100)}%` : "0%";

  React.useEffect(() => {
    setDraftUsername(username);
  }, [username]);

  React.useEffect(() => {
    if (!accessToken) {
      setScreenLoading(false);
      return;
    }
    let isActive = true;
    const loadProfile = async () => {
      setScreenLoading(true);
      try {
        const profile = await apiRequest<ProfilePayload>("/user/profile", { token: accessToken });
        if (!isActive) return;
        setUserIdentity({ username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl });
        if (profile.progress?.goal && profile.progress.experienceLevel && profile.progress.dailyCommitmentMinutes) {
          updatePreferences({
            goal: profile.progress.goal,
            experience: profile.progress.experienceLevel,
            commitment: String(profile.progress.dailyCommitmentMinutes) as "10" | "15" | "30",
            notificationsEnabled: profile.progress.notificationsEnabled,
            path:
              profile.progress.experienceLevel === "BEGINNER" || profile.progress.experienceLevel === "BASICS"
                ? "BEGINNER"
                : "ADVANCED",
          });
          setDraftGoal(profile.progress.goal);
          setDraftLevel(profile.progress.experienceLevel);
          setDraftCommitment(String(profile.progress.dailyCommitmentMinutes) as "10" | "15" | "30");
          setDraftNotifications(profile.progress.notificationsEnabled);
        }
      } catch (error) {
        logError("[PROFILE]", error, { phase: "load-profile" });
      } finally {
        if (isActive) setScreenLoading(false);
      }
    };
    void loadProfile();
    return () => {
      isActive = false;
    };
  }, [accessToken, setUserIdentity, updatePreferences]);

  const onSavePreferences = async () => {
    if (!accessToken || saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const response = await apiRequest<{
        goal: typeof goals[number]["key"];
        experienceLevel: typeof levels[number]["key"];
        dailyCommitmentMinutes: 10 | 15 | 30;
        notificationsEnabled: boolean;
        pathKey: "BEGINNER" | "ADVANCED";
      }>("/user/preferences", {
        method: "PATCH",
        token: accessToken,
        body: JSON.stringify({
          goal: draftGoal,
          experienceLevel: draftLevel,
          dailyCommitmentMinutes: Number(draftCommitment),
          notificationsEnabled: draftNotifications,
        }),
      });

      updatePreferences({
        goal: response.goal,
        experience: response.experienceLevel,
        commitment: String(response.dailyCommitmentMinutes) as "10" | "15" | "30",
        notificationsEnabled: response.notificationsEnabled,
        path: response.pathKey,
      });
      setNotificationsEnabled(response.notificationsEnabled);
      setSaveMessage("Preferences updated.");
    } catch (error) {
      logError("[AUTH]", error, { phase: "save-preferences" });
      setSaveMessage("Could not save preferences right now.");
    } finally {
      setSaving(false);
    }
  };

  const pickImageAndUpload = async (source: "camera" | "library") => {
    if (!accessToken || uploadingAvatar) return;
    try {
      setUploadingAvatar(true);
      setUploadProgress(8);
      const permissionResult =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== "granted") {
        Alert.alert("Permission needed", "Please allow photo access to upload an avatar.");
        return;
      }

      const pickerResult =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            });

      if (pickerResult.canceled || !pickerResult.assets[0]) return;

      setUploadProgress(20);
      const manipulated = await ImageManipulator.manipulateAsync(
        pickerResult.assets[0].uri,
        [{ resize: { width: 800, height: 800 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      setUploadProgress(38);
      const fileResponse = await fetch(manipulated.uri);
      const blob = await fileResponse.blob();
      if (blob.size > 5 * 1024 * 1024) {
        Alert.alert("Image too large", "Please choose an image smaller than 5MB.");
        return;
      }

      const signed = await apiRequest<{ uploadUrl: string; publicUrl: string; maxSizeBytes: number }>(
        `/user/avatar/presigned-url?contentType=${encodeURIComponent("image/jpeg")}&fileSize=${blob.size}`,
        { token: accessToken },
      );

      setUploadProgress(62);
      const uploadResult = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!uploadResult.ok) {
        throw new Error("Upload failed");
      }

      setUploadProgress(85);
      const saved = await apiRequest<{ avatarUrl: string }>("/user/avatar", {
        method: "PATCH",
        token: accessToken,
        body: JSON.stringify({ avatarUrl: signed.publicUrl }),
      });
      setUserIdentity({ avatarUrl: saved.avatarUrl });
      setUploadProgress(100);
      setSaveMessage("Profile picture updated.");
    } catch (error) {
      logError("[PROFILE]", error, { phase: "avatar-upload" });
      Alert.alert("Upload failed", "Could not update profile picture. Please try again.");
    } finally {
      setTimeout(() => {
        setUploadProgress(0);
        setUploadingAvatar(false);
      }, 250);
    }
  };

  const onAvatarPress = () => {
    Alert.alert("Update profile picture", "Choose where to get your photo from.", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: () => void pickImageAndUpload("camera") },
      { text: "Choose from Library", onPress: () => void pickImageAndUpload("library") },
    ]);
  };

  const onSaveUsername = async () => {
    if (!accessToken || !draftUsername.trim() || busyAction) return;
    setBusyAction("username");
    try {
      const updated = await apiRequest<{ id: string; username: string; avatarUrl: string | null }>("/user/profile", {
        method: "PATCH",
        token: accessToken,
        body: JSON.stringify({ username: draftUsername.trim() }),
      });
      setUserIdentity({ username: updated.username });
      setUsernameModalVisible(false);
      setSaveMessage("Username updated.");
    } catch (error) {
      logError("[PROFILE]", error, { phase: "update-username" });
      Alert.alert("Update failed", "Could not update username right now.");
    } finally {
      setBusyAction(null);
    }
  };

  const onChangePassword = async () => {
    if (!accessToken || busyAction) return;
    if (newPassword.length < 6) {
      Alert.alert("Invalid password", "New password should be at least 6 characters.");
      return;
    }
    setBusyAction("password");
    try {
      await apiRequest<{ ok: true }>("/user/change-password", {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordModalVisible(false);
      setSaveMessage("Password changed.");
    } catch (error) {
      logError("[PROFILE]", error, { phase: "change-password" });
      Alert.alert("Could not change password", "Check your current password and try again.");
    } finally {
      setBusyAction(null);
    }
  };

  const onDeleteAccount = async () => {
    if (!accessToken || confirmDeleteText !== "DELETE" || busyAction) return;
    setBusyAction("delete");
    try {
      await apiRequest<void>("/user/account", {
        method: "DELETE",
        token: accessToken,
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      await AsyncStorage.removeItem("codequest-app-store");
      signOut();
      setDeleteModalVisible(false);
      setConfirmDeleteText("");
    } catch (error) {
      logError("[PROFILE]", error, { phase: "delete-account" });
      Alert.alert("Deletion failed", "We could not delete your account. Please try again.");
    } finally {
      setBusyAction(null);
    }
  };

  const initials = (username || "C").trim().charAt(0).toUpperCase();
  const stats = [
    { icon: "🔥", label: "Streak", value: `${streakCurrent}d` },
    { icon: "⚡", label: "XP", value: String(xp) },
    { icon: "📚", label: "Lessons", value: String(lessonsCompleted) },
  ];
  const supportRows = [
    { icon: "❓", label: "Help Center", url: "https://docs.expo.dev" },
    { icon: "⭐", label: "Rate the App", url: "https://apps.apple.com" },
    { icon: "🔐", label: "Privacy Policy", url: "https://docs.expo.dev/privacy/" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {screenLoading ? (
          <View style={styles.skeletonWrap}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonLineLg} />
            <View style={styles.skeletonLineSm} />
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonCard} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <Pressable style={styles.avatarShell} onPress={onAvatarPress}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraBadgeText}>✎</Text>
                </View>
              </Pressable>
              <Text style={styles.name}>{username}</Text>
              <Text style={styles.email}>{email}</Text>
              <Text style={styles.meta}>
                Level {level} · Duel {duelRating} · {duelWinRate} win rate
              </Text>
              <Text style={styles.shieldText}>
                {streakShieldAvailable ? "🛡️ Streak Shield active" : "No streak shield active"}
              </Text>
            </View>

            {uploadingAvatar ? (
              <View style={styles.uploadCard}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.uploadText}>Uploading avatar... {uploadProgress}%</Text>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              {stats.map((item) => (
                <View key={item.label} style={styles.statPill}>
                  <Text style={styles.statIcon}>{item.icon}</Text>
                  <Text style={styles.statPillValue}>{item.value}</Text>
                  <Text style={styles.statPillLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Account</Text>
          <SettingRow icon="👤" label="Edit Username" onPress={() => setUsernameModalVisible(true)} />
          <SettingRow icon="🔒" label="Change Password" onPress={() => setPasswordModalVisible(true)} />
          <View style={styles.rowWithSwitch}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔔</Text>
              <Text style={styles.rowText}>Notifications</Text>
            </View>
            <Switch value={draftNotifications} onValueChange={setDraftNotifications} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Learning Preferences</Text>
          <Text style={styles.fieldLabel}>My Goal</Text>
          <OptionRow
            values={goals.map((item) => ({ key: item.key, label: item.label }))}
            selected={draftGoal}
            onSelect={(value) => setDraftGoal(value as typeof goals[number]["key"])}
          />
          <Text style={styles.fieldLabel}>My JavaScript Level</Text>
          <OptionRow
            values={levels.map((item) => ({ key: item.key, label: item.label }))}
            selected={draftLevel}
            onSelect={(value) => setDraftLevel(value as typeof levels[number]["key"])}
          />
          <Text style={styles.fieldLabel}>Daily Practice Goal</Text>
          <OptionRow
            values={commitmentOptions.map((item) => ({ key: item.key, label: item.label }))}
            selected={draftCommitment}
            onSelect={(value) => setDraftCommitment(value as typeof commitmentOptions[number]["key"])}
          />
          <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} disabled={saving} onPress={onSavePreferences}>
            <Text style={styles.saveButtonLabel}>{saving ? "Saving..." : "Save Preferences"}</Text>
          </Pressable>
          {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <SettingRow icon="🌐" label="Language" subtitle="English" onPress={() => Alert.alert("Language", "Language selection is coming soon.")} />
          <SettingRow icon="🌓" label="Theme" subtitle="System default" onPress={() => Alert.alert("Theme", "Theme selection is coming soon.")} />
          <View style={styles.rowWithSwitch}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔊</Text>
              <Text style={styles.rowText}>Sounds</Text>
            </View>
            <Switch value={soundsEnabled} onValueChange={toggleSounds} />
          </View>
          <View style={styles.rowWithSwitch}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>📳</Text>
              <Text style={styles.rowText}>Haptic Feedback</Text>
            </View>
            <Switch value={hapticsEnabled} onValueChange={toggleHaptics} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Support</Text>
          {supportRows.map((row) => (
            <SettingRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              onPress={() => {
                void Linking.openURL(row.url).catch(() => {
                  Alert.alert("Unavailable", "Could not open this link right now.");
                });
              }}
            />
          ))}
        </View>

        <View style={styles.dangerCard}>
          <Text style={styles.dangerHeader}>Danger Zone</Text>
          <SettingRow
            icon="🗑️"
            label="Delete Account"
            labelStyle={styles.dangerLabel}
            onPress={() => setDeleteModalVisible(true)}
          />
          <Pressable
            onPress={() =>
              Alert.alert("Log out", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: signOut },
              ])
            }
            style={styles.logoutButton}
            accessibilityLabel="Log out"
          >
            <Text style={styles.logoutLabel}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={usernameModalVisible} transparent animationType="fade" onRequestClose={() => setUsernameModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <TextInput
              style={styles.modalInput}
              value={draftUsername}
              onChangeText={setDraftUsername}
              autoCapitalize="none"
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setUsernameModalVisible(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={() => void onSaveUsername()}>
                <Text style={styles.modalPrimaryText}>{busyAction === "username" ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={() => void onChangePassword()}>
                <Text style={styles.modalPrimaryText}>{busyAction === "password" ? "Updating..." : "Update"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              This action is permanent and cannot be undone. Type DELETE to confirm account deletion.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={confirmDeleteText}
              onChangeText={setConfirmDeleteText}
              autoCapitalize="characters"
              placeholder="Type DELETE"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDanger, confirmDeleteText !== "DELETE" && styles.saveButtonDisabled]}
                disabled={confirmDeleteText !== "DELETE" || busyAction === "delete"}
                onPress={() => void onDeleteAccount()}
              >
                <Text style={styles.modalDangerText}>{busyAction === "delete" ? "Deleting..." : "Delete"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function OptionRow({
  values,
  selected,
  onSelect,
}: {
  values: Array<{ key: string; label: string }>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {values.map((value) => (
        <Pressable
          key={value.key}
          onPress={() => onSelect(value.key)}
          style={[styles.choiceChip, selected === value.key && styles.choiceChipSelected]}
        >
          <Text style={[styles.choiceChipLabel, selected === value.key && styles.choiceChipLabelSelected]}>{value.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
  labelStyle,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  labelStyle?: object;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.settingRow, pressed && styles.settingPressed]} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <View>
          <Text style={[styles.rowText, labelStyle]}>{label}</Text>
          {subtitle ? <Text style={styles.rowSubText}>{subtitle}</Text> : null}
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, gap: spacing.lg },
  hero: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarShell: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.border },
  initialsAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: colors.accent, fontSize: 42, fontWeight: "800" },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.background,
  },
  cameraBadgeText: { color: "#111", fontWeight: "800" },
  name: { marginTop: spacing.md, color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: "800" },
  email: { color: colors.textSecondary, marginTop: spacing.xs },
  meta: { color: colors.success, marginTop: spacing.sm, fontWeight: "700" },
  shieldText: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: fontSize.sm },
  uploadCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  uploadText: { color: colors.textSecondary, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statPill: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  statIcon: { fontSize: fontSize.md },
  statPillValue: { marginTop: spacing.xs, color: colors.textPrimary, fontWeight: "800", fontSize: fontSize.md },
  statPillLabel: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: fontSize.sm },
  skeletonWrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  skeletonCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface },
  skeletonLineLg: { width: 180, height: 20, borderRadius: 10, backgroundColor: colors.surface },
  skeletonLineSm: { width: 130, height: 14, borderRadius: 8, backgroundColor: colors.surface },
  skeletonRow: { flexDirection: "row", gap: spacing.sm },
  skeletonCard: { width: 95, height: 70, borderRadius: radius.card, backgroundColor: colors.surface },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeader: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: "700", marginBottom: spacing.md },
  fieldLabel: { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm, fontWeight: "700" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choiceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  choiceChipSelected: { borderColor: colors.accent, backgroundColor: "rgba(247,223,30,0.15)" },
  choiceChipLabel: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: "600" },
  choiceChipLabelSelected: { color: colors.accent },
  settingRow: {
    minHeight: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingPressed: { opacity: 0.75 },
  rowWithSwitch: {
    minHeight: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowIcon: { fontSize: fontSize.md },
  rowText: { color: colors.textPrimary, fontWeight: "600" },
  rowSubText: { color: colors.textSecondary, fontSize: fontSize.sm },
  chevron: { color: colors.textSecondary, fontSize: fontSize.lg },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonLabel: { color: "#111", fontWeight: "800" },
  saveMessage: { marginTop: spacing.sm, color: colors.success, fontWeight: "700" },
  dangerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.lg,
  },
  dangerHeader: { color: colors.danger, fontWeight: "800", marginBottom: spacing.md },
  dangerLabel: { color: colors.danger },
  logoutButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  logoutLabel: { color: colors.danger, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: fontSize.md, marginBottom: spacing.md },
  modalText: { color: colors.textSecondary, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.button,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  modalGhost: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalGhostText: { color: colors.textSecondary, fontWeight: "700" },
  modalPrimary: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalPrimaryText: { color: "#111", fontWeight: "800" },
  modalDanger: { backgroundColor: colors.danger, borderRadius: radius.button, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalDangerText: { color: colors.background, fontWeight: "800" },
});
