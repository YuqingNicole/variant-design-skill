import { buildWithModel, generateWithModel, getProviderStatus, iterateWithModel } from "./ai.mjs";

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  if (body.length > 1_000_000) throw new Error("request_too_large");
  return JSON.parse(body || "{}");
}

function send(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

export async function handleApi(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) return false;

  try {
    if (request.method === "GET" && url.pathname === "/api/status") {
      send(response, 200, getProviderStatus());
      return true;
    }
    if (request.method !== "POST") {
      send(response, 405, { error: "method_not_allowed" });
      return true;
    }
    const input = await readJson(request);
    if (typeof input.brief !== "string" || !input.brief.trim() || input.brief.length > 600) {
      send(response, 400, { error: "invalid_brief" });
      return true;
    }
    if (url.pathname === "/api/generate") {
      send(response, 200, await generateWithModel(input));
      return true;
    }
    if (url.pathname === "/api/build") {
      if (!input.direction) {
        send(response, 400, { error: "invalid_direction" });
        return true;
      }
      send(response, 200, await buildWithModel(input));
      return true;
    }
    if (url.pathname === "/api/iterate") {
      if (!input.direction || typeof input.instruction !== "string" || !input.instruction.trim() || input.instruction.length > 1_200) {
        send(response, 400, { error: "invalid_iteration" });
        return true;
      }
      send(response, 200, await iterateWithModel(input));
      return true;
    }
    send(response, 404, { error: "not_found" });
  } catch (error) {
    const timedOut = error?.name === "AbortError" || error?.name === "TimeoutError";
    const code = timedOut ? "model_timeout" : error instanceof Error ? error.message : "generation_failed";
    send(response, timedOut ? 504 : error?.statusCode || 500, { error: code });
  }
  return true;
}

export function variantApiPlugin() {
  return {
    name: "variant-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!(await handleApi(request, response))) next();
      });
    },
  };
}
