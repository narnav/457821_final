import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { comparePassword, hashPassword, signAccessToken, signRefreshToken, verifyRefreshToken, } from "../lib/auth.js";
export const authRouter = Router();
function mapExperienceToPath(experience) {
    if (!experience)
        return "BEGINNER";
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
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email, username, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ error: "Email already exists" });
    }
    const path = await prisma.learningPath.findUnique({ where: { key: "BEGINNER" } });
    if (!path) {
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
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    return res.status(201).json({
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatarId: user.avatarId,
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
});
authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await comparePassword(password, user.hashedPassword);
    if (!valid) {
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
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    return res.json({
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatarId: user.avatarId,
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
});
authRouter.post("/refresh", async (req, res) => {
    const refreshToken = String(req.body?.refreshToken ?? "");
    if (!refreshToken) {
        return res.status(400).json({ error: "Missing refresh token" });
    }
    try {
        const payload = verifyRefreshToken(refreshToken);
        const accessToken = signAccessToken(payload);
        return res.json({ accessToken });
    }
    catch {
        return res.status(401).json({ error: "Invalid refresh token" });
    }
});
authRouter.post("/logout", async (_req, res) => {
    return res.json({ ok: true });
});
