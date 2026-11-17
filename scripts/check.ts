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
// (the App Store link included), and each translation matches its English page (structure, links,
// contact address, date). Every page also carries the Content-Security-Policy that makes the
// browser enforce "nothing from another site" (it must name the hash of the one inline script, and
// come before it), sends no referrer, and holds no web address in an inline script or style. The
// privacy page keeps the sections a notice needs, names the authority and the host's own
// statement, shares its contact address with the support page, and is never dated in the future;
// every page links to it.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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

/** The policy every page states, but for the hash of its inline script. */
const policy = (hash: string): string =>
  `default-src 'none'; script-src 'self' 'sha256-${hash}'; style-src 'self' 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'`;

/**
 * Every page tells the browser to load and run only the site's own files: a tag slipped into a
 * page can't reach another site. A <meta> policy only covers what comes after it, so it sits
 * before the first script; and it can't be loosened without this check noticing.
 */
function checkPolicy(file: string, text: string, problems: Problem[]): void {
  const inline = [...text.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(text);
  if (inline.length !== 1) {
    problems.push({ file, line: 1, message: "a page has exactly one inline script, the stored-theme one in <head>" });
    return;
  }
  const expected = policy(createHash("sha256").update(inline[0]?.[1] ?? "").digest("base64"));
  if (!meta) {
    problems.push({ file, line: 1, message: `missing <meta http-equiv="Content-Security-Policy" content="${expected}">` });
  } else if (meta[1] !== expected) {
    problems.push({ file, line: lineOf(text, meta.index), message: `the Content-Security-Policy must be exactly: ${expected}` });
  } else if (meta.index > text.search(/<script\b/)) {
    problems.push({ file, line: lineOf(text, meta.index), message: "the Content-Security-Policy comes before the first <script>: it only covers what follows it" });
  }
  if (!text.includes('<meta name="referrer" content="no-referrer">')) {
    problems.push({ file, line: 1, message: 'missing <meta name="referrer" content="no-referrer">: a link out never says which page it came from' });
  }
  if (/<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i.test(text)) {
    problems.push({ file, line: 1, message: "a page never redirects with <meta http-equiv=refresh>" });
  }
}

/** Code and styles written in the page itself reach no other site either: inline scripts, <style> and style attributes. */
function checkInline(file: string, text: string, problems: Problem[]): void {
  for (const block of text.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>|\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const code = block[2] ?? block[3] ?? block[4] ?? "";
    for (const match of code.matchAll(/(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)]*/gi)) {
      problems.push({ file, line: lineOf(text, block.index), message: `${match[0]}: inline code and styles never reach another site` });
    }
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

/** What a privacy notice has to carry: the controller, the website, writing to us, the rights, the changes. */
const privacySections = ["responsible-title", "site-title", "write-title", "rights-title", "changes-title"];

/** The authority a visitor can complain to, and the host's own statement: both are named, never paraphrased. */
const privacyLinks = [
  "https://www.garanteprivacy.it/",
  "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
];

/** The address the site gives, in the privacy page and on the support page: one address, both places. */
function contactAddress(text: string): string {
  return /<a href="mailto:([^"]+)"/.exec(text)?.[1] ?? "";
}

/**
 * The privacy page says who is responsible, what the website does, what happens to what you send,
 * what you can ask for and where to complain, and it is never dated in the future. A notice that
 * loses one of those stops being a notice, so the check holds them in place.
 */
function checkPrivacy(file: string, text: string, problems: Problem[]): void {
  for (const id of privacySections) {
    if (!text.includes(`id="${id}"`)) {
      problems.push({ file, line: 1, message: `missing id="${id}": the privacy page names the controller, the website, writing to us, the rights and the changes` });
    }
  }
  for (const link of privacyLinks) {
    if (!text.includes(`href="${link}"`)) {
      problems.push({ file, line: 1, message: `missing ${link}: the privacy page names the authority and the host's own statement` });
    }
  }
  const date = /<time datetime="(\d{4}-\d{2}-\d{2})"/.exec(text)?.[1];
  // The latest date it is anywhere on Earth (UTC+14), so a page dated just after midnight in Italy
  // doesn't fail on a machine or a CI runner that is still on the day before.
  const today = new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (!date) {
    problems.push({ file, line: 1, message: 'missing <time datetime="YYYY-MM-DD">: the page says when it last changed' });
  } else if (date > today) {
    problems.push({ file, line: 1, message: `"last updated" is ${date}, which is in the future: a policy can't be dated ahead` });
  }
}

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

/** Leftovers that must never ship: a TEMP placeholder, the placeholder App Store link, old names. */
function checkLeftovers(file: string, text: string, problems: Problem[]): void {
  for (const match of text.matchAll(/<!--\s*TEMP:/g)) {
    problems.push({ file, line: lineOf(text, match.index), message: "a TEMP placeholder is still here: replace it" });
  }
  for (const match of text.matchAll(/apps\.apple\.com\/[^"']*id0{6,}/g)) {
    problems.push({ file, line: lineOf(text, match.index), message: "the placeholder App Store link: dush for Mac is id6831255058" });
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
        checkPolicy(file, text, problems);
        checkInline(file, text, problems);
        checkLeftovers(file, text, problems);
        if (file.endsWith("privacy.html")) checkPrivacy(file, text, problems);
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

  // One address for support and for privacy, and a way to the policy from every page.
  const privacy = readFileSync(join(src, "privacy.html"), "utf8");
  const support = readFileSync(join(src, "support.html"), "utf8");
  if (contactAddress(privacy) !== contactAddress(support)) {
    problems.push({ file: join(src, "privacy.html"), line: 1, message: "the contact address differs from the one on support.html" });
  }
  for (const page of pages) {
    const file = join(src, page);
    if (!links(readFileSync(file, "utf8")).includes("privacy.html")) {
      problems.push({ file, line: 1, message: "every page links to privacy.html in its footer" });
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
