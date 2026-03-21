type LogMeta = Record<string, unknown> | undefined;

function formatMeta(meta?: LogMeta) {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
}

function write(prefix: string, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${prefix} ${message}${formatMeta(meta)}`);
}

export function logApp(message: string, meta?: LogMeta) {
  write("[APP]", message, meta);
}

export function logAuth(message: string, meta?: LogMeta) {
  write("[AUTH]", message, meta);
}

export function logApi(message: string, meta?: LogMeta) {
  write("[API]", message, meta);
}

export function logNav(message: string, meta?: LogMeta) {
  write("[NAV]", message, meta);
}

export function logOnboarding(message: string, meta?: LogMeta) {
  write("[ONBOARDING]", message, meta);
}

export function logDuel(message: string, meta?: LogMeta) {
  write("[DUEL]", message, meta);
}

export function logTasks(message: string, meta?: LogMeta) {
  write("[TASKS]", message, meta);
}

export function logError(prefix: string, error: unknown, meta?: LogMeta) {
  const payload = {
    ...(meta ?? {}),
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { message: String(error) },
  };
  write(prefix, "error", payload);
}
