type LogMeta = Record<string, unknown> | undefined;

const SENSITIVE_KEYS = [
  "password",
  "hashedPassword",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
];

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
        key.toLowerCase().includes(sensitiveKey.toLowerCase()),
      );
      result[key] = isSensitive ? "***MASKED***" : redactValue(item);
    });
    return result;
  }
  return value;
}

function formatMeta(meta?: LogMeta) {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(redactValue(meta))}`;
  } catch {
    return " [unserializable-meta]";
  }
}

function write(level: "INFO" | "ERROR" | "WARN", prefix: string, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${prefix} ${message}${formatMeta(meta)}`;
  if (level === "ERROR") {
    console.error(line);
    return;
  }
  if (level === "WARN") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function logInfo(prefix: string, message: string, meta?: LogMeta) {
  write("INFO", prefix, message, meta);
}

export function logWarn(prefix: string, message: string, meta?: LogMeta) {
  write("WARN", prefix, message, meta);
}

export function logError(prefix: string, error: unknown, meta?: LogMeta) {
  const payload = {
    ...(meta ?? {}),
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { message: String(error) },
  };
  write("ERROR", prefix, "failure", payload);
}

export function sanitizeBody(body: unknown) {
  return redactValue(body);
}
