import { logApi } from "./logger";
import { API_BASE_URL } from "../config/network";

interface ApiOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const url = `${API_BASE_URL}${path}`;
  const startedAt = Date.now();
  const bodyForLog =
    typeof options.body === "string"
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined;
  if (__DEV__) {
    console.log(`[Request] URL: ${url} | Method: ${method} | Body: ${bodyForLog ?? "<empty>"}`);
  }
  logApi("request:start", { method, path, url });
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.log("[Error] Full Error Object:", error);
    }
    logApi("request:exception", {
      method,
      path,
      url,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  if (!response.ok) {
    let message = "API request failed";
    let responseData: unknown = null;
    try {
      const json = (await response.json()) as { error?: unknown };
      responseData = json;
      if (typeof json.error === "string") {
        message = json.error;
      } else if (json.error) {
        message = JSON.stringify(json.error);
      }
    } catch {
      const text = await response.text();
      responseData = text;
      message = text || message;
    }
    if (__DEV__) {
      console.log(`[Response] Status: ${response.status} | Data:`, responseData);
    }
    logApi("request:fail", {
      method,
      path,
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      message,
    });
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const rawContentLength = response.headers.get("content-length");
  if (rawContentLength === "0") {
    return undefined as T;
  }
  const data = (await response.json()) as T;
  if (__DEV__) {
    console.log(`[Response] Status: ${response.status} | Data:`, data);
  }
  logApi("request:success", {
    method,
    path,
    url,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });
  return data;
}
