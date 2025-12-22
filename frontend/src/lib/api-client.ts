import { ApiResponse } from "../../shared/types";
import { useAuthStore } from "./auth-store";
const BASE_URL = "/api";
export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token ?? 'bnk_guest';
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new ApiError(401, "Session expired. Please re-authenticate.");
  }
  if (response.status === 429) {
    throw new ApiError(429, "Rate limit exceeded. Systems cooling down.");
  }
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new ApiError(
      response.status,
      json.error || `Request failed with status ${response.status}`,
      json.data
    );
  }
  if (json.data === undefined) {
    throw new ApiError(500, "Malformed API response: missing data payload");
  }
  return json.data;
}