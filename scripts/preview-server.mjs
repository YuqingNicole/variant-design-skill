#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "variant-output");
const requestedPort = Number.parseInt(process.argv[3] ?? "3333", 10);
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Preview directory does not exist: ${root}`);
  process.exit(2);
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function handler(request, response) {
  const requestPath = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const candidate = path.resolve(root, relativePath);

  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  let file = candidate;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(response);
}

function listen(port, attemptsLeft = 20) {
  const server = http.createServer(handler);
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) listen(port + 1, attemptsLeft - 1);
    else {
      console.error(error.message);
      process.exit(1);
    }
  });
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`Preview: http://127.0.0.1:${actualPort}`);
    console.log(`Root: ${root}`);
  });
}

listen(Number.isFinite(requestedPort) ? requestedPort : 3333);
