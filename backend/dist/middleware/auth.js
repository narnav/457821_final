import { verifyAccessToken } from "../lib/auth.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = authHeader.slice(7);
    try {
        const decoded = verifyAccessToken(token);
        req.user = { userId: decoded.userId, email: decoded.email };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
