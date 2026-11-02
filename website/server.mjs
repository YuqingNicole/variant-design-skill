import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./server/api-handler.mjs";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const envPath = join(projectRoot, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
const root = join(projectRoot, "dist");
const port = Number(process.env.PORT || 4173);
const mime = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".txt": "text/plain", ".xml": "application/xml" };

createServer(async (request, response) => {
  if (await handleApi(request, response)) return;
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  // Vercel resizes remote previews at /_vercel/image; locally the original is served instead.
  if (pathname === "/_vercel/image") {
    const source = new URL(request.url, "http://localhost").searchParams.get("url") || "";
    response.writeHead(source.startsWith("https://") ? 302 : 400, source.startsWith("https://") ? { location: source } : {});
    return response.end();
  }
  const candidate = normalize(join(root, pathname === "/" ? "index.html" : pathname));
  // Prerendered routes are directories with index.html; other routes fall back to the app shell and,
  // as on Vercel (vercel.json), a missing file with an extension is a 404.
  const page = candidate.startsWith(root) && existsSync(candidate) ? (statSync(candidate).isFile() ? candidate : existsSync(join(candidate, "index.html")) ? join(candidate, "index.html") : null) : null;
  if (!page && /\.[A-Za-z0-9]+$/.test(pathname)) { response.writeHead(404); return response.end(); }
  const file = page ?? (existsSync(join(root, "app.html")) ? join(root, "app.html") : join(root, "index.html"));
  response.writeHead(200, { "content-type": `${mime[extname(file)] || "application/octet-stream"}; charset=utf-8` });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`Variant Design running at http://127.0.0.1:${port}`));
