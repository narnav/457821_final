import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../stores/useAppStore";
import { OnboardingFlow } from "../features/onboarding/OnboardingFlow";
import { AuthScreen } from "../features/auth/AuthScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { LearnNavigator } from "../features/learn/LearnNavigator";
import { DuelNavigator } from "../features/duel/DuelNavigator";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { DailyPuzzleScreen } from "../features/puzzle/DailyPuzzleScreen";
import { colors } from "../theme/theme";
import { logNav } from "../services/logger";

const Tabs = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false, title: "Home" }} />
      <HomeStack.Screen name="DailyPuzzle" component={DailyPuzzleScreen} options={{ title: "Daily Puzzle" }} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarIcon: () => <TabIcon label="🏠" />, tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="LearnTab"
        component={LearnNavigator}
        options={{ tabBarIcon: () => <TabIcon label="📚" />, tabBarLabel: "Learn" }}
      />
      <Tabs.Screen
        name="DuelTab"
        component={DuelNavigator}
        options={{ tabBarIcon: () => <TabIcon label="⚔️" />, tabBarLabel: "Duel" }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <TabIcon label="👤" />, tabBarLabel: "Profile" }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const authChecked = useAppStore((s) => s.authChecked);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const routeNameRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (!hasHydrated) return;
    const route = !isAuthenticated ? "Auth" : !hasCompletedOnboarding ? "Onboarding" : "MainTabs";
    logNav("root:route-selected", { route });
  }, [hasCompletedOnboarding, hasHydrated, isAuthenticated]);

  if (!hasHydrated || !authChecked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textPrimary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <NavigationContainer
      onReady={() => {
        const currentRoute = routeNameRef.current;
        logNav("screen:enter", { screen: currentRoute ?? "Home" });
      }}
      onStateChange={(state) => {
        const route = state?.routes[state.index];
        const current = route?.name;
        const previous = routeNameRef.current;
        if (previous && previous !== current) {
          logNav("screen:leave", { screen: previous });
        }
        if (current && previous !== current) {
          logNav("screen:enter", { screen: current });
        }
        routeNameRef.current = current;
      }}
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.textPrimary,
          border: colors.border,
          primary: colors.accent,
        },
      }}
    >
      <MainTabs />
    </NavigationContainer>
  );
}

function TabIcon({ label }: { label: string }) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}
