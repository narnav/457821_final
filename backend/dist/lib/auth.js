import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
function requireSecret(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} must be configured`);
    }
    return value;
}
const ACCESS_SECRET = requireSecret("JWT_ACCESS_SECRET");
const REFRESH_SECRET = requireSecret("JWT_REFRESH_SECRET");
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function signAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}
export function verifyAccessToken(token) {
    const payload = jwt.verify(token, ACCESS_SECRET);
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid access token payload");
    }
    return payload;
}
export function verifyRefreshToken(token) {
    const payload = jwt.verify(token, REFRESH_SECRET);
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid refresh token payload");
    }
    return payload;
}
