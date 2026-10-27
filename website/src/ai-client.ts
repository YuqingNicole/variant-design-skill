import type { DesignDirection, Language } from "./direction-engine";

import { validDirection, validDirections } from "./workspace-lifecycle";

type ApiError = Error & { code?: string };

async function request<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ error: "invalid_response" }));
  if (!response.ok) {
    const error = new Error(payload.error || "generation_failed") as ApiError;
    error.code = payload.error;
    throw error;
  }
  return payload;
}

export async function generateRealDirections(input: { brief: string; language: Language; palette?: string[] }, signal?: AbortSignal) {
  const result = await request<{ directions: DesignDirection[] }>("/api/generate", input, signal);
  if (!validDirections(result.directions)) throw new Error("invalid_response");
  return result.directions;
}

export async function iterateRealDirection(input: { brief: string; language: Language; direction: DesignDirection; instruction: string }, signal?: AbortSignal) {
  const result = await request<{ direction: DesignDirection }>("/api/iterate", input, signal);
  if (!validDirection(result.direction) || !result.direction.html || result.direction.id !== input.direction.id) throw new Error("invalid_response");
  return result.direction;
}

export async function buildRealDirection(input: { brief: string; language: Language; direction: DesignDirection }, signal?: AbortSignal) {
  const result = await request<{ direction: DesignDirection }>("/api/build", input, signal);
  if (!validDirection(result.direction) || !result.direction.html || result.direction.id !== input.direction.id) throw new Error("invalid_response");
  return result.direction;
}
