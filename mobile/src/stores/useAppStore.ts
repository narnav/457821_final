import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { logAuth } from "../services/logger";

type Goal = "JOB" | "WORK" | "FUN" | "PROJECT";
type Experience = "BEGINNER" | "BASICS" | "INTERMEDIATE" | "ADVANCED";
type Commitment = "10" | "15" | "30";

interface AppState {
  hasHydrated: boolean;
  authChecked: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  hasCompletedOnboarding: boolean;
  username: string;
  email: string;
  avatarUrl: string | null;
  goal?: Goal;
  experience?: Experience;
  commitment?: Commitment;
  notificationsEnabled: boolean;
  path: "BEGINNER" | "ADVANCED";
  level: number;
  xpTotal: number;
  streakCurrent: number;
  streakDays: boolean[];
  lessonsCompleted: number;
  duelWins: number;
  duelLosses: number;
  duelDraws: number;
  duelRating: number;
  streakShieldAvailable: boolean;
  lastDailyPuzzleSolvedDate: string | null;
  puzzleSolvedIdByDate: Record<string, string>;
  xpMultiplierFactor: number;
  xpMultiplierEndsAt: number | null;
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
  currentLessonId: string;
  lessonExerciseIndex: number;
  lessonAccuracy: number;
  setOnboarding: (goal: Goal, experience: Experience, commitment: Commitment) => void;
  completeOnboarding: (payload: {
    path: "BEGINNER" | "ADVANCED";
    goal: Goal;
    experience: Experience;
    commitment: Commitment;
    notificationsEnabled: boolean;
  }) => void;
  signIn: (payload: {
    userId: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
    accessToken: string;
    refreshToken: string;
    onboardingCompleted: boolean;
    pathKey: "BEGINNER" | "ADVANCED";
    goal?: Goal | null;
    experienceLevel?: Experience | null;
    dailyCommitmentMinutes?: number | null;
    notificationsEnabled?: boolean | null;
  }) => void;
  signOut: () => void;
  addXp: (amount: number) => void;
  setProgressSnapshot: (payload: {
    xpTotal: number;
    level: number;
    streakCurrent: number;
    streakDays: boolean[];
    lessonsCompleted: number;
    duelWins: number;
    duelLosses: number;
    duelDraws: number;
    duelRating: number;
    streakShieldAvailable: boolean;
  }) => void;
  markDailyPuzzleSolved: (dateKey: string, puzzleId: string) => void;
  setXpMultiplier: (payload: { factor: number; endsAt: number | null }) => void;
  incrementLessonsCompleted: () => void;
  applyDuelResult: (payload: { won: boolean; draw?: boolean; ratingDelta: number }) => void;
  setCurrentLesson: (lessonId: string) => void;
  setExerciseIndex: (index: number) => void;
  setLessonAccuracy: (accuracy: number) => void;
  updatePreferences: (payload: {
    goal: Goal;
    experience: Experience;
    commitment: Commitment;
    notificationsEnabled: boolean;
    path: "BEGINNER" | "ADVANCED";
  }) => void;
  toggleSounds: (value?: boolean) => void;
  toggleHaptics: (value?: boolean) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  setAccessToken: (token: string | null) => void;
  setUserIdentity: (payload: { username?: string; email?: string; avatarUrl?: string | null }) => void;
  setOnboardingCompleted: (value: boolean) => void;
  setAuthChecked: (value: boolean) => void;
}

const memoryStorage = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ?? memoryStorage.get(name) ?? null;
    } catch {
      return memoryStorage.get(name) ?? null;
    }
  },
  setItem: async (name, value) => {
    memoryStorage.set(name, value);
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Keep the in-memory fallback value if native storage is unavailable.
    }
  },
  removeItem: async (name) => {
    memoryStorage.delete(name);
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Best-effort cleanup; fallback storage already cleared.
    }
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasHydrated: false,
      authChecked: false,
      accessToken: null,
      refreshToken: null,
      userId: null,
      hasCompletedOnboarding: false,
      username: "Coder",
      email: "",
      avatarUrl: null,
      goal: undefined,
      experience: undefined,
      commitment: "15",
      notificationsEnabled: true,
      path: "BEGINNER",
      level: 1,
      xpTotal: 0,
      streakCurrent: 0,
      streakDays: [false, false, false, false, false, false, false],
      lessonsCompleted: 0,
      duelWins: 0,
      duelLosses: 0,
      duelDraws: 0,
      duelRating: 0,
      streakShieldAvailable: false,
      lastDailyPuzzleSolvedDate: null,
      puzzleSolvedIdByDate: {},
      xpMultiplierFactor: 1,
      xpMultiplierEndsAt: null,
      soundsEnabled: true,
      hapticsEnabled: true,
      currentLessonId: "b1-l1",
      lessonExerciseIndex: 0,
      lessonAccuracy: 0,
      setOnboarding: (goal, experience, commitment) =>
        set({
          goal,
          experience,
          commitment,
          path: experience === "ADVANCED" ? "ADVANCED" : "BEGINNER",
        }),
      completeOnboarding: ({ path, goal, experience, commitment, notificationsEnabled }) =>
        set({
          hasCompletedOnboarding: true,
          path,
          goal,
          experience,
          commitment,
          notificationsEnabled,
        }),
      signIn: ({
        userId,
        email,
        username,
        avatarUrl,
        accessToken,
        refreshToken,
        onboardingCompleted,
        pathKey,
        goal,
        experienceLevel,
        dailyCommitmentMinutes,
        notificationsEnabled,
      }) => {
        logAuth("signin:store-session", { userId, onboardingCompleted, pathKey });
        set({
          isAuthenticated: true,
          userId,
          email,
          username,
          avatarUrl: avatarUrl ?? null,
          accessToken,
          refreshToken,
          hasCompletedOnboarding: onboardingCompleted,
          path: pathKey,
          goal: goal ?? undefined,
          experience: experienceLevel ?? undefined,
          commitment:
            dailyCommitmentMinutes === 10 || dailyCommitmentMinutes === 15 || dailyCommitmentMinutes === 30
              ? (String(dailyCommitmentMinutes) as Commitment)
              : get().commitment,
          notificationsEnabled: notificationsEnabled ?? true,
          level: 1,
          xpTotal: 0,
          streakCurrent: 0,
          streakDays: [false, false, false, false, false, false, false],
          lessonsCompleted: 0,
          duelWins: 0,
          duelLosses: 0,
          duelDraws: 0,
          duelRating: 0,
          streakShieldAvailable: false,
          puzzleSolvedIdByDate: {},
          xpMultiplierFactor: 1,
          xpMultiplierEndsAt: null,
          currentLessonId: "b1-l1",
          lessonExerciseIndex: 0,
          lessonAccuracy: 0,
        });
      },
      signOut: () => {
        logAuth("signout:clear-session");
        set({
          isAuthenticated: false,
          userId: null,
          email: "",
          username: "Coder",
          accessToken: null,
          refreshToken: null,
          avatarUrl: null,
          hasCompletedOnboarding: false,
          goal: undefined,
          experience: undefined,
          commitment: "15",
          notificationsEnabled: true,
          path: "BEGINNER",
          level: 1,
          xpTotal: 0,
          streakCurrent: 0,
          streakDays: [false, false, false, false, false, false, false],
          lessonsCompleted: 0,
          duelWins: 0,
          duelLosses: 0,
          duelDraws: 0,
          duelRating: 0,
          streakShieldAvailable: false,
          xpMultiplierFactor: 1,
          xpMultiplierEndsAt: null,
          lastDailyPuzzleSolvedDate: null,
          puzzleSolvedIdByDate: {},
          currentLessonId: "b1-l1",
          lessonExerciseIndex: 0,
          lessonAccuracy: 0,
        });
      },
      addXp: (amount) => {
        const { xpMultiplierEndsAt, xpMultiplierFactor } = get();
        const now = Date.now();
        const multiplierIsActive =
          xpMultiplierEndsAt !== null && xpMultiplierEndsAt > now && xpMultiplierFactor > 1;
        const appliedAmount = Math.round(amount * (multiplierIsActive ? xpMultiplierFactor : 1));
        const nextXp = get().xpTotal + appliedAmount;
        const nextLevel = Math.max(1, Math.floor(nextXp / 250) + 1);
        set({ xpTotal: nextXp, level: nextLevel });
      },
      setProgressSnapshot: (payload) =>
        set({
          xpTotal: payload.xpTotal,
          level: payload.level,
          streakCurrent: payload.streakCurrent,
          streakDays: payload.streakDays,
          lessonsCompleted: payload.lessonsCompleted,
          duelWins: payload.duelWins,
          duelLosses: payload.duelLosses,
          duelDraws: payload.duelDraws,
          duelRating: payload.duelRating,
          streakShieldAvailable: payload.streakShieldAvailable,
        }),
      markDailyPuzzleSolved: (dateKey, puzzleId) =>
        set({
          lastDailyPuzzleSolvedDate: dateKey,
          puzzleSolvedIdByDate: {
            ...get().puzzleSolvedIdByDate,
            [dateKey]: puzzleId,
          },
        }),
      setXpMultiplier: ({ factor, endsAt }) => set({ xpMultiplierFactor: factor, xpMultiplierEndsAt: endsAt }),
      incrementLessonsCompleted: () => set({ lessonsCompleted: get().lessonsCompleted + 1 }),
      applyDuelResult: ({ won, draw, ratingDelta }) =>
        set({
          duelWins: won ? get().duelWins + 1 : get().duelWins,
          duelLosses: !won && !draw ? get().duelLosses + 1 : get().duelLosses,
          duelDraws: draw ? get().duelDraws + 1 : get().duelDraws,
          duelRating: Math.max(0, get().duelRating + ratingDelta),
        }),
      setCurrentLesson: (lessonId) => set({ currentLessonId: lessonId, lessonExerciseIndex: 0 }),
      setExerciseIndex: (index) => set({ lessonExerciseIndex: index }),
      setLessonAccuracy: (accuracy) => set({ lessonAccuracy: accuracy }),
      updatePreferences: ({ goal, experience, commitment, notificationsEnabled, path }) =>
        set({ goal, experience, commitment, notificationsEnabled, path }),
      toggleSounds: (value) => set({ soundsEnabled: typeof value === "boolean" ? value : !get().soundsEnabled }),
      toggleHaptics: (value) => set({ hapticsEnabled: typeof value === "boolean" ? value : !get().hapticsEnabled }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
        logAuth("storage:hydrated", { value });
      },
      setAccessToken: (token) => {
        set({ accessToken: token });
        logAuth("token:set-access-token", { hasToken: Boolean(token) });
      },
      setUserIdentity: (payload) =>
        set({
          username: payload.username ?? get().username,
          email: payload.email ?? get().email,
          avatarUrl:
            typeof payload.avatarUrl === "undefined"
              ? get().avatarUrl
              : payload.avatarUrl,
        }),
      setOnboardingCompleted: (value) => set({ hasCompletedOnboarding: value }),
      setAuthChecked: (value) => set({ authChecked: value }),
    }),
    {
      name: "codequest-app-store",
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: (state) => () => {
        state?.setHasHydrated(true);
        // Intentionally swallow hydration errors to avoid boot-time crashes.
      },
    },
  ),
);
