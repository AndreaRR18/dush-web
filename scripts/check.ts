// The gate every change passes, locally and before each deploy:
//   1. type-checks the page's TypeScript and these scripts;
//   2. checks the page's own rules on src/ (below);
//   3. builds dist/.
//
// The rules: the page loads nothing from another site (no CDN, font service, analytics or
// embed), every local file it references exists, no reference starts with "/", because
// GitHub Pages serves the site under /dush-web/, not at the root of a domain, and no link leads
// to the Mac app's repository, which is private.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { build, root, src, tsc } from "./build.ts";

type Problem = { file: string; line: number; message: string };

const external = /^(https?:)?\/\//i;
const elsewhere = /^(mailto:|tel:|data:|#)/i;
const privateRepository = /codeberg\.org\/Andre_Rori\/dush-desktop/i;

function filesIn(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: "utf8" })
    .map((name) => join(folder, name))
    .filter((path) => statSync(path).isFile());
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

/** Whether a relative reference from `file` names a file in src/: dist/js/x.js comes from src/ts/x.ts. */
function exists(file: string, reference: string): boolean {
  const target = resolve(dirname(file), reference.replace(/[?#].*$/, ""));
  const inside = relative(src, target);
  if (inside.startsWith(`js${sep}`) && inside.endsWith(".js")) {
    return existsSync(join(src, "ts", inside.slice(3, -3) + ".ts"));
  }
  if (existsSync(target) && statSync(target).isDirectory()) return existsSync(join(target, "index.html"));
  return existsSync(target);
}

/** A reference in HTML or CSS. `isResource` is false only for a link the visitor follows (<a href>). */
function checkReference(file: string, line: number, reference: string, isResource: boolean, problems: Problem[]): void {
  const value = reference.trim();
  if (value === "" || elsewhere.test(value)) return;
  if (external.test(value)) {
    if (isResource) problems.push({ file, line, message: `loads ${value} from another site: put the file in src/ instead` });
    if (privateRepository.test(value)) problems.push({ file, line, message: `${value} is private: visitors get a 404` });
    return;
  }
  if (value.startsWith("/")) {
    problems.push({ file, line, message: `"${value}" starts with "/": use a path relative to this file` });
    return;
  }
  if (!exists(file, value)) problems.push({ file, line, message: `"${value}" doesn't exist in src/` });
}

function checkHTML(file: string, text: string, problems: Problem[]): void {
  for (const tag of text.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    const name = tag[1]?.toLowerCase();
    const line = lineOf(text, tag.index);
    for (const attribute of tag[0].matchAll(/\s(src|href|srcset|poster|data|action)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const value = attribute[2] ?? attribute[3] ?? "";
      const references = attribute[1]?.toLowerCase() === "srcset"
        ? value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0] ?? "")
        : [value];
      for (const reference of references) checkReference(file, line, reference, name !== "a", problems);
    }
  }
}

function checkCSS(file: string, text: string, problems: Problem[]): void {
  for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi)) {
    checkReference(file, lineOf(text, match.index), match[1] ?? match[2] ?? "", true, problems);
  }
}

function checkTypeScript(file: string, text: string, problems: Problem[]): void {
  for (const match of text.matchAll(/["'`](https?:)?\/\/[^"'`\s]*/gi)) {
    problems.push({ file, line: lineOf(text, match.index), message: `${match[0].slice(1)}: the page's code never reaches another site` });
  }
}

function checkRules(): Problem[] {
  const problems: Problem[] = [];
  for (const file of filesIn(src)) {
    const text = readFileSync(file, "utf8");
    switch (extname(file)) {
      case ".html":
        checkHTML(file, text, problems);
        break;
      case ".css":
        checkCSS(file, text, problems);
        break;
      case ".ts":
        checkTypeScript(file, text, problems);
        break;
    }
  }
  return problems;
}

function step(title: string, run: () => void): boolean {
  console.log(`· ${title}`);
  try {
    run();
    return true;
  } catch {
    return false;
  }
}

const passed = [
  step("Type-checking the page", () => {
    execFileSync(tsc, ["--project", join(root, "tsconfig.json"), "--noEmit"], { stdio: "inherit" });
  }),
  step("Type-checking the scripts", () => {
    execFileSync(tsc, ["--project", join(root, "tsconfig.scripts.json")], { stdio: "inherit" });
  }),
  step("Checking the page's rules", () => {
    const problems = checkRules();
    for (const { file, line, message } of problems) console.error(`  ${relative(root, file)}:${line}: ${message}`);
    if (problems.length > 0) throw new Error(`${problems.length} problems`);
  })
].every(Boolean);

if (passed && step("Building dist/", build)) {
  console.log("All checks passed.");
} else {
  console.error("The check failed: fix the errors above.");
  process.exitCode = 1;
}
