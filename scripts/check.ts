// The gate every change passes, locally and before each deploy:
//   1. type-checks the page's TypeScript and these scripts;
//   2. checks the page's own rules on src/ (below);
//   3. builds dist/.
//
// The rules: the page loads nothing from another site (no CDN, font service, analytics or
// embed), every local file it references exists, no reference starts with "/", because
// GitHub Pages serves the site under /dush-web/, not at the root of a domain, no link leads
// to the Mac app's repository, which is private, every page has the theme toggle: the
// header button, its sun/moon icons and the stored-theme script in <head>, no placeholder is left
// but the Mac App Store link, and each translation matches its English page (structure, links,
// contact address, date).

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

/** A link the visitor or a search engine follows, not a file the page loads: <a>, and <link rel="alternate"> (hreflang URLs must be absolute). */
function isNavigation(name: string | undefined, tag: string): boolean {
  return name === "a" || (name === "link" && /\srel\s*=\s*["'](alternate|canonical)["']/i.test(tag));
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
      for (const reference of references) checkReference(file, line, reference, !isNavigation(name, tag[0]), problems);
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

/** Every page carries the theme toggle: the button, its icons and the stored-theme head script. */
function checkThemeToggle(file: string, text: string, problems: Problem[]): void {
  for (const marker of ["<!-- theme-toggle:start -->", "data-theme-toggle", 'id="icon-sun"', 'id="icon-moon"', '"dush-theme"']) {
    if (!text.includes(marker)) {
      problems.push({ file, line: 1, message: `missing ${marker}: every page has the theme toggle and the stored-theme script in <head>` });
    }
  }
}

const languages = ["de", "es", "fr", "it", "nl", "pl", "pt"];
const pages = ["index.html", "support.html", "privacy.html"];

/** The body's tags with their classes: the structure of a page, whatever language its text is in. */
function skeleton(text: string): string[] {
  const body = text.slice(text.indexOf("<body"));
  return [...body.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)].map((tag) => {
    const classes = /\sclass\s*=\s*"([^"]*)"/i.exec(tag[2] ?? "")?.[1] ?? "";
    return `${tag[1]?.toLowerCase()}.${classes}`;
  });
}

/** The visitor's links, without the folder prefix a translation adds ("../de/index.html" is "de/index.html"). */
function links(text: string): string[] {
  const body = text.slice(text.indexOf("<body"));
  return [...body.matchAll(/<a\b[^>]*\shref\s*=\s*"([^"]*)"/gi)].map((link) => (link[1] ?? "").replace(/^(\.\.\/)+/, "")).sort();
}

function first(text: string, pattern: RegExp): string {
  return pattern.exec(text)?.[1] ?? "";
}

/** The English page is the reference: every translation has its structure, links, contact address and date. */
function checkLanguages(): Problem[] {
  const problems: Problem[] = [];
  for (const page of pages) {
    const englishFile = join(src, page);
    const english = readFileSync(englishFile, "utf8");
    const englishSkeleton = skeleton(english);
    const englishLinks = links(english);
    for (const language of languages) {
      const file = join(src, language, page);
      const text = readFileSync(file, "utf8");
      if (first(text, /<html lang="([^"]*)"/) !== language) {
        problems.push({ file, line: 1, message: `<html lang> must be "${language}"` });
      }
      const mine = skeleton(text);
      const at = mine.findIndex((tag, index) => tag !== englishSkeleton[index]);
      if (at !== -1 || mine.length !== englishSkeleton.length) {
        problems.push({ file, line: 1, message: `structure differs from ${page} in English (first difference at tag ${Math.max(at, 0) + 1}: ${mine[at] ?? "end"} instead of ${englishSkeleton[at] ?? "end"})` });
      }
      if (links(text).join("\n") !== englishLinks.join("\n")) {
        const missing = englishLinks.filter((link) => !links(text).includes(link));
        const extra = links(text).filter((link) => !englishLinks.includes(link));
        problems.push({ file, line: 1, message: `links differ from ${page} in English (missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"})` });
      }
      if (first(text, /<time datetime="([^"]*)"/) !== first(english, /<time datetime="([^"]*)"/)) {
        problems.push({ file, line: 1, message: `"last updated" date differs from ${page} in English` });
      }
    }
  }
  return problems;
}

/** Leftovers that must never ship: the one allowed TEMP is the Mac App Store link. */
function checkLeftovers(file: string, text: string, problems: Problem[]): void {
  for (const match of text.matchAll(/<!--\s*TEMP:(?![^>]*Mac App Store link)/g)) {
    problems.push({ file, line: lineOf(text, match.index), message: "a TEMP placeholder is still here: replace it" });
  }
  for (const match of text.matchAll(/Full Scan|CONTACT DETAILS GO HERE/g)) {
    problems.push({ file, line: lineOf(text, match.index), message: `"${match[0]}": the app calls it Caches & Temp, and contact details are real` });
  }
}

function checkRules(): Problem[] {
  const problems: Problem[] = [];
  for (const file of filesIn(src)) {
    const text = readFileSync(file, "utf8");
    switch (extname(file)) {
      case ".html":
        checkHTML(file, text, problems);
        checkThemeToggle(file, text, problems);
        checkLeftovers(file, text, problems);
        break;
      case ".css":
        checkCSS(file, text, problems);
        break;
      case ".ts":
        checkTypeScript(file, text, problems);
        break;
    }
  }
  problems.push(...checkLanguages());
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
