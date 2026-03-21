import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function requireSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

const ACCESS_SECRET = requireSecret("JWT_ACCESS_SECRET");
const REFRESH_SECRET = requireSecret("JWT_REFRESH_SECRET");

export interface AuthTokenPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET);
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid access token payload");
  }
  if (typeof payload.userId !== "string" || typeof payload.email !== "string" || typeof payload.tokenVersion !== "number") {
    throw new Error("Invalid access token shape");
  }
  return { userId: payload.userId, email: payload.email, tokenVersion: payload.tokenVersion };
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, REFRESH_SECRET);
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid refresh token payload");
  }
  if (typeof payload.userId !== "string" || typeof payload.email !== "string" || typeof payload.tokenVersion !== "number") {
    throw new Error("Invalid refresh token shape");
  }
  return { userId: payload.userId, email: payload.email, tokenVersion: payload.tokenVersion };
}
