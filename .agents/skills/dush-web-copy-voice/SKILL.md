---
name: dush-web-copy-voice
description: Use when any text of the dush website is written, changed, translated or reviewed (English or de, es, fr, it, nl, pl, pt), when a section is added, when the tone drifts between pages or languages, or when copy reads stiff, literal or wrong — "change this headline", "add a section", "translate the site", "does this sound right in Dutch", "review the copy", "keep the tone consistent".
---

# The voice of the dush website, in eight languages

## Overview

The site talks like the app: playful where nothing is at stake, plain and exact about risk.
English is the source. Each of the seven translations says the same thing, in the voice a native
writer would use, in the same change. A text is never translated from its English alone: first
know what it does on the page.

The rules live in `AGENTS.md` (Promises, Voice). This skill is how to apply them, page by page.

## Where the truth lives (highest first)

1. **The app's catalog**: `../dush-desktop/DushMac/Sources/Translations/Resources/Localizable.xcstrings`.
   Any name the site shares with the app (verdicts, menu items, tags, scan names) is copied from
   it, never retranslated. Look one up:
   ```bash
   python3 -I .agents/skills/dush-web-copy-voice/tools/app_strings.py "Safe to delete"
   ```
2. **The spec's copy table**: `../dush-desktop/docs/macos-app-spec.md` §10, and sample data §11.
3. **`AGENTS.md`**: promises, voice table, what dush does.
4. **The English pages** of the site, for everything else.

When they disagree, the higher one wins; fix the lower one or report it. The app renamed *Full
Scan* to **Caches & Temp**: names change in the app first, and the site follows.

## Before writing a text: four answers

1. **What does it do here?** A button acts (verb + object, Title Case in English), a label names,
   a title announces, a caption explains, a quote is a sample of the app's own screen.
2. **Which tier?**

   | Tier | Where | Standard |
   |---|---|---|
   | Promise | the promises, privacy, the AI section, "never deletes" | The exact meaning, no stronger and no softer. Limits stay: *can be wrong*, *some*, *only when you ask* |
   | Risk | verdicts, simulators, anything a user could lose | Plain and exact. No joke, no italic, no exclamation mark |
   | Playful | taglines, scan messages, empty states, captions | It must work as a joke in that language |
   | Functional | nav, buttons, labels, links | The macOS or app word, short |

3. **Who does what to whom?** Name the subject of every clause: dush, the model, the user, a tool.
   Write it out where the English leaves it out.
4. **Is it a fact?** Numbers, versions, sizes, counts and names (512 MB, 34 locations, macOS 26,
   macOS 14, eight languages, sample sizes) come from the sibling repos. Never invent or round one.

## The voice

Short sentences, active voice, no jargon, no emoji, no "we". dush looks, it never cleans.

- **Say:** scan, look, see, biggest, Show in Finder, Copy Path, rebuilds itself, review first.
- **Never say:** clean, optimize, boost, junk, free up space; no trash or broom imagery.
- **Delete words, by context.** Allowed when negated (*It never deletes*), in the AI's question
  and verdicts (*Safe to delete?*, the app's own words), when describing a third-party command
  (`xcrun simctl delete unavailable`), and in the user deciding alone outside dush. Never as a
  label or action on a file, never as a sales pitch. dush's own scan history is the only thing it
  removes: use the app's *Clear History* / *Remove from History* words for it.
- **A pun is rebuilt, not copied.** *It's a tape measure, not a snoop* becomes the language's own
  tape measure and own snoop (*Maßband / Schnüffler*, *cinta métrica / fisgón*).
- **Reassurance uses the language's set phrase** (*nicht angetastet*, *pozostały nietknięte*).

## Registers and conventions on the site today

Keep each language as it is; compare warmth and directness, not pronouns.

| Language | Address | Numbers | Punctuation and other |
|---|---|---|---|
| English | you | 150,000 · 64.10 GB | Title Case buttons |
| Deutsch | du | 150.000 · 64,10 GB | `Kommandozeile`; app: *Caches & Temp*, *Im Finder anzeigen* |
| Español | tú | 150.000 · 64,10 GB | `¿…?` on every question, also headlines; *Cachés y temp* |
| Français | vous | 150 000 · 64,10 **Go** (units are Go, Mo) | no-break space before `? ! : ;` (`&nbsp;`); `’` apostrophes; *Caches et temp* |
| Italiano | tu | 150.000 · 64,10 GB | `'` apostrophes; *Cache e temporanei* |
| Nederlands | je | 150.000 · 64,10 GB | *Caches en temp*, *Toon in Finder* |
| Polski | Ty (capital) | 150 000 · 64,10 GB | *Cache i temp*; gender-neutral phrasing: avoid "zrobiłeś" when it can be avoided |
| Português | o senhor/a senhora form: `o seu`, imperative `Largue` | 150 000 · 64,10 GB | European Portuguese: *Descargas*, *Secretária*, *ficheiro*, *Comunicar*, *transferir* |

- The site is read by one person, the maker, and many visitors: never write a gendered word about
  the maker or the reader when the language lets you avoid it (*Contact:*, not *can be reached*).
- A sample from the app (a path, a command, a CLI output) stays as typed in every language, with
  its English comments; only text around it is translated.
- Code, flags and paths (`dush --json`, `NO_COLOR`, `~/Library/Developer`) are never translated.

## Where translations go wrong

These are real bugs the site has had; look for them first.

| Check | Example |
|---|---|
| A heading's words in English order | *Privacidad Política*; it is *Política de privacidad* |
| A link's text repeated after the link | `<a>Política de privacidad</a> política de privacidad` |
| An English word left in | *npm, pnpm and Yarn*; a footer label *The details* |
| A word from another language | Dutch *jederzeit*, *einhergaat* (German) |
| A name the app already has | *Full Scan* instead of the app's *Caches & Temp* |
| A literal idiom | *Need a hand?* → *Een handje nodig?*, *Potrzebujesz pomocy?* |
| A sentence made of two sentences | one verb missing: *den dush --json* (de) |
| A noun and verb agreeing with the wrong thing | pl *Włączyć możesz go* for a feminine "dostęp" |
| A unit or format of another language | fr *1 Go = 1 000 000 octets* (one million, not billion) |
| A date that differs from the English page | "last updated" must be identical everywhere |
| Missing opening mark | es `Qué se está…?` without `¿` |

## Workflows

**Change or add one text.** Answer the four questions, look up the app's wording, edit the English
page, then the same place in each language folder, keeping the HTML structure identical (the check
fails if structure, links, contact address or date differ). Put real values where numbers go.

**A new page or section.** Write it in English first, in the tiers above; then translate all seven
at once. Add an `id` and nav link only if the English has them.

**Privacy or support wording.** These are promises: change the meaning only if the app changed,
update the `<time datetime>` and its visible date on all eight pages together, and keep every
statement true of the shipping app (read the spec and the code, not memory).

**A new language.** Make a folder `src/<code>/` with the three pages copied from English, add its
code to the `languages` list in `scripts/check.ts`, to every `hreflang` block and to every language
menu, add its row to the table above, and translate with the app's own catalog open.

**A review.** Run the scan, then read each page in the language, slowly, next to the English:

```bash
python3 -I .agents/skills/dush-web-copy-voice/tools/copy_scan.py          # all languages
python3 -I .agents/skills/dush-web-copy-voice/tools/copy_scan.py fr it     # some
npm run check
```

The scan finds the mechanical slips (leftover English, repeated link text, doubled words, missing
`¿`, French spacing and units, cleaning words). It cannot judge tone: that is the reading.
Report findings as file, line, what is wrong, the fix. A native speaker's pass is still worth it
before a release.

## Before saying you're done

- Every language changed, not only English; `npm run check` quoted.
- No word from the "never say" list; every delete word is in an allowed context.
- Every name shared with the app matches the catalog.
- Every fact traced to a sibling repo.
