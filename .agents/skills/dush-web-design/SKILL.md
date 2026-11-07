---
name: dush-web-design
description: Use when the look of the dush website is created, changed or reviewed — a new section, component, page or illustration, any edit to src/css, colors, type, spacing, motion, light/dark, or the theme toggle; also "does this match the Paper style", "review the design", "add a card/section", "why does this look off on phones".
---

# Keeping the dush website in the "Paper" style

## Overview

The site looks like the app: a measuring notebook. Warm paper, ink, two watercolor washes, one big
number in a serif. `AGENTS.md` holds the values (colors, type, radii, spacing, motion, light and
dark, accessibility); this skill is how to work inside them and how to prove a change still fits.
The sibling app's `docs/macos-app-visual-style.md` and `docs/macos-app-design-guide.md` win over
`AGENTS.md` if they differ.

## The rules that matter most

1. **Tokens only.** Every color, radius, space, font and duration comes from `src/css/tokens.css`.
   Need a new value? Add a token (with `light-dark(…)` for colors), then use it. No literal in
   `site.css`, no inline `style` except the `--share` custom property the sample rows already use.
2. **Pick a color by what it paints**, not by how it looks (the table in `AGENTS.md`). Teal is
   calm and main, orange is attention, there is no third hue and no red. State is color + icon +
   text, never color alone.
3. **No pure white or black, no gradient, no glow, no drop shadow, no SVG filter.** The only
   texture is the 40° hatching. Prefer a separator to a card; never a sheet inside a sheet.
4. **Serif for titles, labels and numbers; sans for body, buttons, nav; mono for paths and
   commands.** Units are smaller and graphite. Italic is a voice, never emphasis.
5. **HTML first.** The page works without JavaScript; TypeScript only adds behavior (copy button,
   theme, reveal, count). Nothing on screen at load ever hides.
6. **Motion is small, quick and optional.** Reveal once, no loops, nothing under
   `prefers-reduced-motion`. New timings are tokens.
7. **Illustrations are decorative**: `aria-hidden`, empty `alt`, one per section, from the app's
   masters in `../dush-desktop/Design/illustrations` with the `<metadata>` block stripped, in a
   `<picture>` with a dark `<source>`. Allowed subjects only (folders, sheets, crates, tape measure,
   magnifier, keys, laptop, sprout); no people, faces or text in a drawing.
8. **Never edit an exported illustration or the logo by hand**, recolor or animate it. Re-copy from
   the app.

## The vocabulary already in `site.css`

Reuse before inventing. Layout: `.page` `.section` `.split` (`--reverse`, `--top`) `.intro`
`.center`. Type: `.title` `.heading` `.lead` `.label` `.caption` `.unit` `.serif-number` `.growth`.
Surfaces: `.sheet` `.cards` (`--three`) `.card` `.card__title` `.quote` `.pill` `.notice`
`.footnote`. Data: `.facts` `.results` `.hero-size` `.composition` `.rows` `.row` `.share`.
Answers: `.verdict` (`--safe` `--check` `--keep`) `.verdicts` `.tag` (`--teal` `--orange`).
Actions: `.button` (`--prominent` `--quiet`) `.actions` `.command` `.code`. Long reads: `.doc`
`.doc__part` `.doc__heading`. Frame: `.header` `.nav` `.lang` `.theme-toggle` `.footer` `.closing`.
Elements opt into motion with `data-reveal`, and a count-up with `data-count` (+ `data-decimals`).

A new component gets a BEM-style name (`.block__element`, `.block--modifier`), is built from
tokens, and sits next to its relatives in `site.css` under a comment saying what it is.

## Adding a section or a page

1. Copy the nearest existing section; keep its heading level order (`h1` once per page).
2. Write the English first (`dush-web-copy-voice`), then add it identically, translated, to the
   seven language folders: the check fails if the structure differs.
3. Add every new `id`, link and image path relative to the file (`../` in a language folder). A new
   page needs the theme toggle block, the stored-theme script in `<head>`, the language menu and
   the `hreflang` block, all copied from an existing page, and a row in the footer's links.
4. Sample numbers come from the app spec §11, never invented.

## Prove it: the review

From the repository root, after `npm run check`:

```bash
# 1. Values that bypass the tokens (expect nothing outside tokens.css)
grep -nE '#[0-9A-Fa-f]{3,8}\b|rgba?\(|hsl\(' src/css/site.css
grep -nE 'box-shadow|text-shadow|filter:|gradient\(|!important' src/css/site.css
grep -rn 'style="' src --include='*.html' | grep -v -- '--share'
# Expected matches: the hatching `repeating-linear-gradient` (the one allowed texture) and the
# white label of the prominent button. The language menu's `box-shadow` is a known deviation
# from "no drop shadows": replace it with a hairline when that menu is next touched.
# 2. A red hue or a third color slips in (brand colors only in the logo and icon)
grep -rniE '#(f00|ff0000|e53|d32f2f)|red' src/css
```

Then look at it, in the dev server (`npm run dev`, `http://localhost:8000/dush-web/`), and check:

| What | How |
|---|---|
| Light and dark | OS setting and the header toggle; no flash on reload; contrast ≥ 4.5:1 (graphite never on sand, orange text only on paper or sheet, pencil never text) |
| Phone width | 375 px: no horizontal scroll, 16 px gutters, nav and language menu usable |
| Keyboard | Every control reachable, visible focus ring, `Esc` closes the language menu |
| Reduced motion | Emulate it: nothing moves, everything is visible |
| No JavaScript | Disable it: all content shown, theme toggle hidden, page follows the OS |
| Longest language | German, French and Polish run long: no clipped label, no overflow in buttons, nav or cards |
| Every language | Open one page of each; the structure is the same, RTL is not supported |

A finding names the rule, the place (`file:line`) and the fix. "Feels off" is not a finding.

## Before saying you're done

- `npm run check` passes, quoted.
- The grep block is clean and you looked at light, dark and 375 px.
- Tokens were added, not literals.
- The seven translations carry the same markup.
