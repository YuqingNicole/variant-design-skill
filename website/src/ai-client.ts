import type { DesignDirection, Language } from "./direction-engine";

type ApiError = Error & { code?: string };

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
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

export async function generateRealDirections(input: { brief: string; language: Language; palette?: string[] }) {
  const result = await request<{ directions: DesignDirection[] }>("/api/generate", input);
  if (!Array.isArray(result.directions) || result.directions.length !== 3) throw new Error("invalid_response");
  return result.directions;
}

export async function iterateRealDirection(input: { brief: string; language: Language; direction: DesignDirection; instruction: string }) {
  const result = await request<{ direction: DesignDirection }>("/api/iterate", input);
  if (!result.direction?.html) throw new Error("invalid_response");
  return result.direction;
}

export async function buildRealDirection(input: { brief: string; language: Language; direction: DesignDirection }) {
  const result = await request<{ direction: DesignDirection }>("/api/build", input);
  if (!result.direction?.html) throw new Error("invalid_response");
  return result.direction;
}
