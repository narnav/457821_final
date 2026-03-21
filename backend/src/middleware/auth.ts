import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { logError, logInfo, logWarn } from "../lib/logger.js";

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; tokenVersion: number };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    logWarn("[AUTH]", "missing-bearer-token", { path: req.originalUrl });
    return res.status(401).json({ error: "Missing bearer token" });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, tokenVersion: true },
    });
    if (!user) {
      logWarn("[AUTH]", "user-not-found-for-token", { userId: decoded.userId, path: req.originalUrl });
      return res.status(401).json({ error: "Invalid token" });
    }
    if (user.tokenVersion !== decoded.tokenVersion) {
      logWarn("[AUTH]", "token-version-mismatch", { userId: decoded.userId, path: req.originalUrl });
      return res.status(401).json({ error: "Invalid token" });
    }
    logInfo("[AUTH]", "access-token-validated", { userId: decoded.userId, path: req.originalUrl });
    req.user = { userId: decoded.userId, email: decoded.email, tokenVersion: decoded.tokenVersion };
    return next();
  } catch (error) {
    logError("[AUTH]", error, { path: req.originalUrl, reason: "invalid-access-token" });
    return res.status(401).json({ error: "Invalid token" });
  }
}
