import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/auth.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { logError, logInfo, logWarn } from "../lib/logger.js";

export const authRouter = Router();

function mapExperienceToPath(experience: string | null | undefined): "BEGINNER" | "ADVANCED" {
  if (!experience) return "BEGINNER";
  return experience === "BEGINNER" || experience === "BASICS" ? "BEGINNER" : "ADVANCED";
}

const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

authRouter.post("/register", async (req, res) => {
  logInfo("[AUTH]", "register:attempt", { email: req.body?.email, username: req.body?.username });
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    logWarn("[AUTH]", "register:validation-failed", { errors: parsed.error.flatten() });
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const { email, username, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logWarn("[AUTH]", "register:email-exists", { email });
      return res.status(409).json({ error: "Email already exists" });
    }

    const path = await prisma.learningPath.findUnique({ where: { key: "BEGINNER" } });
    if (!path) {
      logWarn("[AUTH]", "register:path-missing");
      return res.status(400).json({ error: "Path not found" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        hashedPassword: await hashPassword(password),
        progress: {
          create: {
            pathId: path.id,
            onboardingCompleted: false,
            notificationsEnabled: true,
            dailyCommitmentMinutes: 15,
          },
        },
        duelRating: {
          create: {},
        },
      },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });
    logInfo("[AUTH]", "register:success", { userId: user.id, email: user.email });
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarId: user.avatarId,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: false,
        pathKey: "BEGINNER",
        goal: null,
        experienceLevel: null,
        dailyCommitmentMinutes: 15,
        notificationsEnabled: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logError("[AUTH]", error, { phase: "register" });
    return res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  logInfo("[AUTH]", "login:attempt", { email: req.body?.email });
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    logWarn("[AUTH]", "login:validation-failed", { errors: parsed.error.flatten() });
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logWarn("[AUTH]", "login:user-not-found", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await comparePassword(password, user.hashedPassword);
    if (!valid) {
      logWarn("[AUTH]", "login:invalid-password", { userId: user.id });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    let progress = await prisma.userProgress.findUnique({
      where: { userId: user.id },
      include: { path: true },
    });
    if (!progress) {
      const defaultPath = await prisma.learningPath.findUnique({ where: { key: "BEGINNER" } });
      if (!defaultPath) {
        return res.status(400).json({ error: "Path not found" });
      }
      progress = await prisma.userProgress.create({
        data: {
          userId: user.id,
          pathId: defaultPath.id,
          onboardingCompleted: false,
          dailyCommitmentMinutes: 15,
          notificationsEnabled: true,
        },
        include: { path: true },
      });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const pathKey = mapExperienceToPath(progress.experienceLevel) ?? progress.path?.key ?? "BEGINNER";
    await prisma.duelRating.upsert({
      where: { userId: user.id },
      create: { userId: user.id, rating: 1000 },
      update: {},
    });
    const accessToken = signAccessToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });
    logInfo("[AUTH]", "login:success", { userId: user.id, onboardingCompleted: progress?.onboardingCompleted ?? false });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarId: user.avatarId,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: progress?.onboardingCompleted ?? false,
        pathKey,
        goal: progress.goal,
        experienceLevel: progress.experienceLevel,
        dailyCommitmentMinutes: progress.dailyCommitmentMinutes ?? 15,
        notificationsEnabled: progress.notificationsEnabled ?? true,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logError("[AUTH]", error, { phase: "login" });
    return res.status(500).json({ error: "Login failed" });
  }
});

authRouter.post("/refresh", async (req, res) => {
  const refreshToken = String(req.body?.refreshToken ?? "");
  if (!refreshToken) {
    return res.status(400).json({ error: "Missing refresh token" });
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const accessToken = signAccessToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });
    logInfo("[AUTH]", "refresh:success", { userId: payload.userId });
    return res.json({ accessToken });
  } catch (error) {
    logError("[AUTH]", error, { phase: "refresh" });
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

authRouter.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, avatarId: true, avatarUrl: true, tokenVersion: true },
  });
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  return res.json(user);
});

authRouter.post("/logout", async (_req, res) => {
  logInfo("[AUTH]", "logout");
  return res.json({ ok: true });
});
