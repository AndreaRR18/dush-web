# AGENTS.md — dush-web

Instructions for every coding agent (Claude Code, Mistral Vibe, Codex, Cursor, Copilot, Gemini
CLI…) working in this repository. This is the single source of truth: `CLAUDE.md` and `GEMINI.md`
only point here, so edit this file, never those two. The repository is public, so this file is
committed.

## Skills

Project skills live in `.agents/skills/` (one `SKILL.md` each); `.claude/skills/` and
`.vibe/skills/` link to them, so every tool loads the same files. Edit them in `.agents/skills/`,
never through the links. A tool without skills opens the `SKILL.md` itself.

| Skill | Use it for |
|---|---|
| `dush-web-copy-voice` | any text, in English or a translation: the voice, the app's own wording, the eight-language workflow, `tools/copy_scan.py` |
| `dush-web-design` | anything visual: the Paper style, tokens, components, a section or page, the review of a change |

## Any agent, the same rules

What enforces the rules is tool-agnostic: `npm run check` and the git hook in `.githooks/`. An
agent without hooks or skills is held to exactly the same gate.

| Tool | Reads |
|---|---|
| Codex, Cursor, Copilot, Zed, Mistral Vibe… | this file |
| Claude Code | `CLAUDE.md` → this file |
| Gemini CLI | `GEMINI.md` → this file |

1. **Start:** `npm run setup` once per checkout (installs the two tools, turns on the git hook).
2. **While working:** `npm run dev`, and `npm run check` often. For copy or design work, open the matching skill first.
3. **At the end:** `npm run check`, quoted. Not done until it passes; never claim it did without
   running it. The hook runs it again before every commit.
4. **Copy in eight languages.** Any text change goes into `src/` (English) and into the seven
   folders `src/{de,es,fr,it,nl,pl,pt}/`, with the app's own wording from
   `../dush-desktop/DushMac/Sources/Translations/Resources/Localizable.xcstrings`. The check
   compares the structure, links, contact address and dates of every language with the English page.

# dush-web

The website of **dush**, a fast, read-only disk space analyzer for macOS: the `dush` CLI, its
engine DushCore and the Mac app "dush for Mac". All free. The CLI and DushCore are open source
(MIT); the app's source is private.

Tagline: *"See what's taking up space. What to do about it is up to you."*

## How this site is built

Plain **HTML, CSS and TypeScript**. No framework, no UI library, no bundler, and nothing the page
loads from another site: no CDN, font service, analytics, cookies or embeds. The only packages are
the two development tools in `package.json` (`typescript`, `@types/node`), pinned to exact
versions. Nothing from `node_modules` reaches the page.

```text
src/                 the site, as it is published
  index.html         one HTML file per page
  css/tokens.css     the Paper tokens (colors light/dark, type, radii, spacing); nothing else
  css/site.css       base and components, using tokens only
  ts/*.ts            the page's TypeScript → dist/js/*.js (import siblings as "./x.ts")
  favicon.svg        the logo and the tab icon (the app icon, simplified)
scripts/             the harness, TypeScript run directly by Node (no compile step)
  build.ts           src/ → dist/: copies everything but ts/, then tsc compiles ts/ to js/
  dev.ts             builds, serves dist/ at http://localhost:8000/dush-web/, rebuilds on save
  check.ts           the gate: type checks, the page's rules, then the build
  setup.sh           npm run setup: installs the tools, turns on the git hook
.githooks/pre-commit  runs npm run check before every commit (any tool, any person)
.github/workflows/deploy.yml   publishes to GitHub Pages on every push to main
```

| Command | Does |
|---|---|
| `npm run setup` | Once per checkout: `npm ci` (Node 26, see `.nvmrc`) and the git hook |
| `npm run dev` | Builds, serves, rebuilds on every save in `src/`; reload the browser to see it |
| `npm run check` | The gate: run it before every commit; the deploy runs the same |
| `npm run build` | Only the build, into `dist/` (gitignored) |

`npm run check` fails when:

- the page's TypeScript or the scripts don't type-check (`strict`, no unused code, erasable
  syntax only);
- the HTML, CSS or TypeScript loads anything from another site. Plain links (`<a href>`) to
  Codeberg and elsewhere are fine;
- a `src`, `href` or `url()` starts with `/`. GitHub Pages serves the site under `/dush-web/`, so
  every path is relative to its file. The dev server uses the same prefix, so a root-relative
  path breaks locally too;
- a referenced local file doesn't exist (`js/x.js` must have `ts/x.ts`);
- a link leads to `codeberg.org/Andre_Rori/dush-desktop`, which is private;
- an HTML page is missing part of the theme toggle: the `<!-- theme-toggle:start -->` button in
  the header, its `icon-sun`/`icon-moon` symbols, or the stored-theme script in `<head>`;
- a page still has a `<!-- TEMP: -->` placeholder (the Mac App Store link is the only allowed
  one), the words "Full Scan" or "CONTACT DETAILS GO HERE";
- a translation (`src/{de,es,fr,it,nl,pl,pt}/`) differs from its English page in `<html lang>`,
  tag structure, links (so the contact address too) or "last updated" date.

A new rule of this file that a script can check gets a check in `scripts/check.ts`.

### Deploying

Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm run check` (which ends
with the build), then `dist/` goes to GitHub Pages at https://andrearr18.github.io/dush-web/. A
failed check deploys nothing, and the previous version stays online. The workflow can also be run
by hand from the Actions tab. The repository's Pages source must be **GitHub Actions** (Settings ›
Pages › Build and deployment). The compiled JavaScript is never committed.

### Code style

- Linear and simple: one file per page, one small TypeScript module per behavior, wired in
  `ts/main.ts`. No classes or abstractions until two places need them.
- HTML works without JavaScript; TypeScript only adds behavior (copying, toggles).
- Colors, type, radii and spacing only from `tokens.css`. Add a token instead of a literal.
- Fonts are self-hosted in `src/fonts/` (Fraunces is not added yet; until it is, the serif stack
  falls back to New York in Safari through `ui-serif`, and to Georgia elsewhere).
- Illustrations live in `src/img/<name>-{light,dark}.svg`, copied from
  `../dush-desktop/Design/illustrations` without their `<metadata>` block, and shown through a
  `<picture>` whose dark `<source>` follows `prefers-color-scheme`.

### Motion

Small, quick and optional, as in the app (design guide §11):

- An element with `data-reveal` that starts below the fold waits out of sight, then fades and
  slides up 28px once, as it scrolls into view (`ts/reveal.ts`). Elements arriving together come
  in 90ms apart. Nothing on screen at load ever hides.
- Inside a revealed element, share bars and the composition bar grow from the left, and a number
  with `data-count` (plus `data-decimals`) counts up from zero (`ts/count.ts`). The final value is
  written in the HTML; an inline number keeps its width while it counts.
- The header draws its hairline once the page scrolls (`ts/header.ts`).
- With `prefers-reduced-motion`, nothing moves: the scripts skip the effects and the CSS drops
  every transition. Without JavaScript, everything is simply shown.
- No looping, parallax or decorative animation. Timings are tokens in `tokens.css`.

### Light and dark

- Every color token is declared once in `tokens.css` with `light-dark(light, dark)` and follows the
  page's `color-scheme`. By default the page follows the OS (`color-scheme: light dark` on `:root`).
- The header's theme toggle (the `<!-- theme-toggle:start -->` block in every page) switches between
  light and dark. It stores the choice in `localStorage` under `dush-theme`; an inline script in each
  page's `<head>` applies it as `data-theme` on `<html>` before the first paint, so there is no flash
  of the wrong theme. `:root[data-theme]` then just sets `color-scheme`, and every token follows.
- `ts/theme.ts` also points the illustrations' `<picture>` dark sources and the two `theme-color`
  metas at a forced theme (their `media` attributes can't see `data-theme`), swapping `media` between
  the original and `all`/`not all`, and keeps the button's icon, label and `aria-pressed` in step.
- Without JavaScript the button stays hidden (`html.js`) and the page simply follows the OS.

### Placeholders to replace

- The **Mac App Store link** is temporary: `https://apps.apple.com/app/id0000000000`, in the hero
  and the closing section of `src/index.html` (each marked `TEMP`). Replace both when the app is
  listed.
- The **contact details** are in `src/privacy.html` and `src/support.html` and in the seven translated pairs
  (`gibbone-aromi-3e@icloud.com`). Change the address in all 16 files at once.
- `hreflang` links are absolute (`https://andrearr18.github.io/dush-web/…`), as search engines require. Move them
  with the site if it ever gets another domain.

## The platform (sibling folders in `../`)

| Folder | What | State |
|---|---|---|
| `../dush` | The CLI (Swift). `brew tap andre_rori/tap https://codeberg.org/Andre_Rori/homebrew-tap.git` then `brew install andre_rori/tap/dush` | v1.2.0, released |
| `../dush-core` | The scanning engine, shared by CLI and app, so both report the same sizes as `du` | v1.0.0 |
| `../dush-desktop` | dush for Mac, SwiftUI, macOS 26+ | All features implemented, **not released yet** (Developer ID + Homebrew cask, to be confirmed) |

The CLI and the engine live on Codeberg: `https://codeberg.org/Andre_Rori/{dush,dush-core}`.
`dush-desktop` is private for good, and visitors get a 404 there. So the site never calls the app
open source and never links to that repository. Reports about the app go to
`https://codeberg.org/Andre_Rori/dush/issues`.

**Where the truth lives.** The sibling repos win over this file. Read them before writing copy or
styles:

- `../dush-desktop/docs/macos-app-spec.md`: product, principles (§2), features (§6–7), copy (§10),
  sample data (§11).
- `../dush-desktop/docs/macos-app-visual-style.md`: the "Paper" style.
- `../dush-desktop/docs/macos-app-design-guide.md`: tokens, spacing, components, copy rules.
- `../dush-desktop/DushMac/Sources/DesignSystem/Theme/`: `DushTheme.swift` (exact colors),
  `Sketch.swift` (the hand-drawn pen), `PaperButtonStyle.swift`, `DushLogo.swift`.
- `../dush-desktop/DushMac/Sources/Translations/Resources/Localizable.xcstrings`: every English
  and Italian string of the app.
- `../dush/README.md`, `../dush-core/README.md`: CLI usage and how sizes are measured.

## Promises (never break them on the site)

- **dush only looks. It never deletes.** No "Delete", "Clean", "Clean Up", "Free Up Space",
  "Move to Trash" or a bare "Remove" about files; no trash, bin, broom, eraser or "clean up"
  imagery. In Italian: never *Elimina*, *Cancella*, *Cestina*, *Pulisci*, *Libera spazio*.
- **No tracking, no accounts, no in-app purchases, no network.** The AI is Apple Intelligence,
  on the Mac. So the site has no analytics, no "Sign in", "Upgrade" or "Rate us".
- Say: *scan, look, see, biggest, Show in Finder, Copy Path, rebuilds itself, review first*.
  Don't say: *clean, optimize, boost, junk, delete, free up space*.

## Voice

Playful and friendly where nothing is at stake, plain and exact about risk. Short sentences,
active voice, no jargon, no emoji. Italian uses informal *tu* and the terms macOS uses.

| Use | English | Italian |
|---|---|---|
| Title | What's eating your disk? | Cosa si sta mangiando il tuo disco? |
| Promise | dush only looks. It never deletes. | dush guarda e basta. Non elimina mai. |
| Playful line | It's a tape measure, not a snoop. | È un metro, non una spia. |
| Welcome | Drop a folder, see what's big. | Trascina una cartella, scopri cosa pesa. |
| Promises | No tracking. No accounts. No in-app purchases. dush never deletes your files. | Nessun tracciamento. Nessun account. Nessun acquisto in-app. dush non elimina mai i tuoi file. |

Scan messages, for flavor: *Mapping your disk galaxy…*, *It's not a tumor! It's your cache…*,
*Houston, we have a storage problem…* (full list: `../dush/Sources/dush/FunnyMessages.swift`).

## The "Paper" style

A measuring notebook: warm paper, ink drawn by hand, two watercolor washes, one big number in a
book face.

### Colors

Define them once as CSS custom properties with `light-dark(light, dark)` in `tokens.css` — one
declaration per color, following the page's `color-scheme` (the OS's, or the one forced by the
header's theme toggle, see "Light and dark" above). Pick by what a color paints, never by how it
looks.

| Token | Light | Dark | Paints | Never |
|---|---|---|---|---|
| `--sand` | `#E9E2D5` | `#151413` | Behind a sheet: the desk | Behind Graphite text |
| `--paper` | `#F5F0E7` | `#1E1C1A` | The page | Text |
| `--sheet` | `#FBF8F2` | `#26231F` | Raised surfaces: cards, code blocks | Text |
| `--shelf` | `#EEE7DB` | `#1A1917` | A side or footer band | Text |
| `--line` | `#DDD4C5` | `#3A3631` | 1px separators, tracks | Text |
| `--ink` | `#2A2622` | `#F5F0E7` | Text, strokes | Large fills |
| `--graphite` | `#6E655B` | `#B8AE9F` | Secondary text, captions, units | Text on Sand |
| `--pencil` | `#8C8174` | `#7C7368` | Dashes, hatching | Any text |
| `--teal-ink` | `#0B6E6E` | `#5FD4CF` | Teal text and icons: calm, "safe", links | Backgrounds |
| `--orange-ink` | `#B7431A` | `#FF9A6E` | Orange text: attention, growth | Backgrounds; text on Shelf or Sand |
| `--teal-wash` | `#BFDDD6` | `#1F4A46` | Teal fills | Behind text you must read |
| `--orange-wash` | `#F2C3A8` | `#5A2E1C` | Orange fills | Behind text you must read |
| `--teal-button` | `#0B6E6E` | `#0B6E6E` | The prominent button (white label, 6:1) | Anything else |

- Brand colors `#2ECCCC` (teal) and `#FF6B35` (orange) appear **only** in the logo and the icon.
  Chart fills: `#1A9E9E`, `#F05A24`.
- Teal is calm and main; orange is attention. **No third hue, no red.** Never color alone: a state
  is color + icon + text.
- No pure white or black surfaces, no gradients, no glow, no drop shadows. The only shadow is
  hatching (parallel lines at 40°) under an illustration.

### Type

| Role | Face | Size |
|---|---|---|
| Hero number | Serif, medium, tabular figures | 64–76px |
| Page title | Serif, regular; one word may be italic in teal ink | 40–54px |
| Large number | Serif, medium | 34–36px |
| Section label | Serif italic | 13–18px |
| Body, buttons, nav | System sans (`-apple-system, system-ui, sans-serif`) | — |
| Paths, commands | System mono (`ui-monospace, SFMono-Regular, Menlo, monospace`) | — |

- The serif on the web is **Fraunces**, self-hosted, standing in for Apple's New York.
- Units are smaller and in Graphite: **64.10** GB. Sizes use decimal units like Finder
  (1 GB = 1,000,000,000 bytes), formatted like the CLI: `21.37 GB`.
- Italic is a voice (labels, captions, the playful line), never emphasis, never next to risk.
- The serif is for titles, labels and numbers, never body text, buttons or paths.

### Shapes and spacing

- Radii: 4 (tile), 8 (small: code block, banner), 10 (row), 14 (card), 16 (drop zone), capsule
  for buttons, pills and tags.
- Spacing scale: 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 32. Page content max width
  880px, padding 32px (16px on phones).
- Hairlines are 1px Line. A dashed 1.5px Pencil border means "a place to drop" or "protected",
  nothing else.
- Prefer a separator to a card. Never nest a sheet inside a sheet.

### Hand-drawn outlines

Outlines of buttons, cards and dividers wobble lightly, drawn in two passes like a pen going over
a line. Text, icons and numbers stay crisp. Port `Sketch.swift` to TypeScript and emit SVG paths;
**no SVG filters** (they blur and rasterize):

1. Sample points along the outline every 6px (rounded rectangle: arcs at the corners, straight
   edges between).
2. Push each point along its normal by
   `wobble × 0.5 × (sin(d·0.045+p0) + 0.4·sin(d·0.11+p1) + 0.15·sin(d·0.27+p2)) / 1.55`, where
   `d` is the distance along the outline and the phases come from a seed:
   `p_i = ((seed·7919 + i·104729) mod 628) / 100`.
3. Join the points with quadratic curves through their midpoints.
4. Border = one pass at full width (1.2px) + one pass at half width, 35% opacity, seed + 11,
   wobble 1.5. Sheets use ink at 0.7.

The wobble depends only on the seed and the distance, never on the size, so outlines don't shimmer
on resize. Shapes larger than 4000px or smaller than 2px get a plain path.

### Buttons

| Kind | Look | Use |
|---|---|---|
| Prominent | Teal `#0B6E6E` capsule, white label, ink outline | The one main action of a section |
| Outline | Ink outline, no fill (orange-ink variant for Caches & Temp only) | Secondary actions |
| Quiet | Ink outline at 45% | Minor actions |
| Selected | Teal wash under an ink outline | The chosen option of a set (tabs, EN/IT) |
| Theme toggle | Quiet capsule with a sun/moon icon, in the header | The visitor's light/dark choice, kept in `localStorage` |

Labels are verb + object, Title Case in English: *Copy Command*, *Show on Codeberg*.

### Illustrations and logo

- Masters: `../dush-desktop/Design/illustrations/illustration-<name>-{light,dark}.svg` (360×280:
  home, scanning, keys, no-caches, nothing-to-compare, grows-back) and
  `../dush-desktop/Design/icon/*.svg` (the app icon). They are drawn by `Design/paper_draw.py`;
  never edit an exported file by hand.
- Light and dark differ only by five colors (ink, teal wash, orange wash, paper, accent). On the
  web, use one SVG whose colors come from CSS variables, or the two files under a `<picture>`.
  Strip the ~8 KB C2PA `<metadata>` block from each file.
- At most one illustration per section. They are decorative (`aria-hidden="true"`, empty `alt`),
  with the line of copy beside them carrying the meaning. No animation beyond an optional fade
  in, none with `prefers-reduced-motion`.
- Allowed subjects: folders, sheets, crates, a tape measure, a magnifying glass, keys, a laptop, a
  sprout. No people, faces, mascots or text inside a drawing.
- The logo is the app icon in its simplified form, `../dush-desktop/Design/icon/app-icon-small.svg`
  (the one made for 16 and 32 px: a paper tile, an ink-outlined teal-wash folder, two orange bars).
  `src/favicon.svg` is that file with the C2PA `<metadata>` block and the fixed `width`/`height`
  removed, and it serves as the tab icon and the header and footer logo. When the icon changes
  in dush-desktop, re-copy and strip it again; never edit it by hand, recolor or animate it. The
  old flat teal-and-orange folder is retired on the site.

## What dush does (for feature copy)

- **CLI:** `dush [paths] [--min-size 1GB] [-f|-d] [-t N] [-e] [--exclude NAME] [--json]`. With no
  path, a curated cleanup scan of 34 cache and temp locations. Sizes match `du`; ~150,000 items
  in about a second. Live progress with funny messages. `dush update`. Read-only.
- **Mac app:**
  - Drop a folder or choose one; a separate Caches & Temp scan (never called "Full Scan": it reads a few GB of caches, not the whole disk); a Downloads & Desktop quick scan.
  - Live counters, a rotating funny message, the biggest items so far.
  - Results: a big serif total, a composition bar, a list with share bars; List, Map (treemap)
    and What changed (compares two scans). Export to JSON, Markdown, CSV.
  - History with Undo; the only thing dush ever deletes is its own history.
  - "Safe to delete?": Apple Intelligence on the Mac, metadata only. Verdicts: Safe to delete
    (teal check), Check first (orange triangle), Keep it (ink minus), Protected by dush (shield,
    dashed). Follow-up questions. Protected folders are answered locally, never sent.
  - Developer cache guide (DerivedData, simulators, DeviceSupport, `node_modules`, npm, pnpm,
    Yarn, Gradle, Homebrew): Show in Finder and Copy Command only; dush runs nothing.
  - Watched folders with limits and notifications, a menu bar extra with free space, Finder's
    "Scan with dush", Shortcuts actions, opening `dush --json` reports.
  - Eight languages: English, German, Spanish, French, Italian, Dutch, Polish, Portuguese.

Realistic sample numbers for mockups are in the spec §11 (e.g. `~/Library/Developer`: 64.1 GB in
1.9 s, 412,806 items; DerivedData 21.37 GB).

## Accessibility

Text contrast at least 4.5:1 in both themes (Graphite never on Sand, orange text only on Paper or
Sheet, Pencil never text). Visible focus rings, keyboard reachable, `prefers-reduced-motion` and
`prefers-color-scheme` respected — or a theme forced with the header toggle, which wins over the OS
and is remembered on the visitor's device only. The layout works at phone width with no horizontal
scroll.
