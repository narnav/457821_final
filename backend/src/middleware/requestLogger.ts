import { NextFunction, Request, Response } from "express";
import { logInfo, sanitizeBody } from "../lib/logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const sanitizedBody = sanitizeBody(req.body);

  console.log(`${req.method} ${req.url} - Body:`, sanitizedBody);

  logInfo("[REQ]", "incoming", {
    method: req.method,
    url: fullUrl,
    body: sanitizedBody,
  });

  res.on("finish", () => {
    logInfo("[RES]", "completed", {
      method: req.method,
      url: fullUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
