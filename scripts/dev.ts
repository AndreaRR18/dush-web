// Builds the site, serves dist/ on this Mac only, and rebuilds whenever a file in src/ changes.
// The site is served under the same path as on GitHub Pages, so a link that only works at the
// root of a domain breaks here first. Reload the browser to see a change.

import { createReadStream, existsSync, statSync, watch } from "node:fs";
import { createServer } from "node:http";
import { extname, join, relative } from "node:path";
import { build, dist, src } from "./build.ts";

/** Where GitHub Pages publishes the site: https://andrearr18.github.io/dush-web/ */
const base = "/dush-web/";
const port = Number(process.env["PORT"] ?? 8000);

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function rebuild(): void {
  try {
    build();
    console.log(`Built at ${new Date().toLocaleTimeString()}.`);
  } catch {
    console.error("The build failed: fix the errors above and save again.");
  }
}

/** The file of dist/ a request path names, or nothing when it's outside dist/ or missing. */
function fileFor(pathname: string): string | undefined {
  const inside = decodeURIComponent(pathname.slice(base.length));
  let file = join(dist, inside);
  if (relative(dist, file).startsWith("..")) return undefined;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  return existsSync(file) ? file : undefined;
}

const server = createServer((request, response) => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  if (!pathname.startsWith(base)) {
    response.writeHead(302, { Location: base }).end();
    return;
  }
  const file = fileFor(pathname);
  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end(`Not found: ${pathname}\n`);
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(file).pipe(response);
});

rebuild();

let pending: NodeJS.Timeout | undefined;
watch(src, { recursive: true }, () => {
  clearTimeout(pending);
  pending = setTimeout(rebuild, 100);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving http://localhost:${port}${base} · Ctrl-C to stop`);
});
