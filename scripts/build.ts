// Builds the site into dist/: every file of src/ as it is, except src/ts, which tsc compiles to
// dist/js. dist/ is what GitHub Pages serves.

import { execFileSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("..", import.meta.url));
export const src = join(root, "src");
export const dist = join(root, "dist");
export const tsc = join(root, "node_modules", ".bin", "tsc");

export function build(): void {
  rmSync(dist, { recursive: true, force: true });
  cpSync(src, dist, { recursive: true, filter: (path) => !isTypeScript(path) && basename(path) !== ".DS_Store" });
  execFileSync(tsc, ["--project", join(root, "tsconfig.json")], { stdio: "inherit" });
}

function isTypeScript(path: string): boolean {
  const inside = relative(src, path);
  return inside === "ts" || inside.startsWith(`ts${sep}`);
}

if (import.meta.main) {
  try {
    build();
    console.log("Built dist/.");
  } catch {
    console.error("The build failed: fix the errors above.");
    process.exitCode = 1;
  }
}
