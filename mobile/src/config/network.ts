import Constants from "expo-constants";

const DEV_BACKEND_PORT = "4000";
const PROD_API_BASE_URL = "https://api.questcodejs.com/api";
const PROD_DUEL_SOCKET_URL = "https://api.questcodejs.com/duel";

function getExpoHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    null;
  if (!hostUri) return null;
  return hostUri.split(":")[0] ?? null;
}

export function getApiBaseUrl(): string {
  if (!__DEV__) return PROD_API_BASE_URL;
  const host = getExpoHost() ?? "localhost";
  return `http://${host}:${DEV_BACKEND_PORT}/api`;
}

export function getDuelSocketUrl(): string {
  if (!__DEV__) return PROD_DUEL_SOCKET_URL;
  const host = getExpoHost() ?? "localhost";
  return `http://${host}:${DEV_BACKEND_PORT}/duel`;
}

export const API_BASE_URL = getApiBaseUrl();
export const DUEL_SOCKET_URL = getDuelSocketUrl();
