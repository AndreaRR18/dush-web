#!/usr/bin/env python3
"""Mechanical scan of the website's translations. Finds the slips a reader notices first; it cannot
judge tone, so a clean scan is not a review.

    python3 -I .agents/skills/dush-web-copy-voice/tools/copy_scan.py [language ...] [--src DIR]

Languages: de es fr it nl pl pt (all by default). --src scans another copy of src/ (for example an
older commit). Prints file:line: finding. Exit code 1 when there is a finding."""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
args = sys.argv[1:]
src = ROOT / "src"
if "--src" in args:
    i = args.index("--src"); src = Path(args[i + 1]).resolve(); del args[i:i + 2]
ALL = ["de", "es", "fr", "it", "nl", "pl", "pt"]
languages = args or ALL
NBSP = "  "

# English words that must not appear in a translated sentence.
ENGLISH = re.compile(r"\b(the|and|with|your|from|only)\b", re.I)
# Words that sell dush as a cleaner, or name a file action. Allowed next to dush's own history.
CLEANING = {
    "de": r"bereinig|aufräum|säuber|speicher freigeben|optimier",
    "es": r"liberar espacio|libera espacio|optimiz",
    "fr": r"nettoy|libérer de l.espace|optimis",
    "it": r"libera spazio|ottimizz|ripulisc",
    "nl": r"opruim|schoonmaak|opschonen|optimaliseer",
    "pl": r"zwolnij miejsce|optymaliz",
    "pt": r"libertar espaço|libertar espaco|otimiz",
}
HISTORY = re.compile(r"histor|verlauf|cronolog|geschiedenis|histórico|historique|historia", re.I)

def visible(html: str):
    """(line, text) for each line of visible text, without code, scripts and comments."""
    html = re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), html, flags=re.S)
    html = re.sub(r"<(script|style|svg|pre)\b.*?</\1>", lambda m: "\n" * m.group(0).count("\n"), html, flags=re.S | re.I)
    html = re.sub(r"<code\b.*?</code>", " ", html, flags=re.S | re.I)
    body = html[html.find("<body"):] if "<body" in html else html
    offset = html.count("\n", 0, html.find("<body")) if "<body" in html else 0
    for n, line in enumerate(body.split("\n"), start=1 + offset):
        text = re.sub(r"<[^>]*>", " ", line).replace("&nbsp;", " ").replace("&amp;", "&")
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            yield n, text

problems = 0
def report(file, line, message):
    global problems
    problems += 1
    print(f"{file.relative_to(src.parent) if src.parent in file.parents else file}:{line}: {message}")

for language in languages:
    for page in ("index.html", "support.html", "privacy.html"):
        file = src / language / page
        raw = file.read_text(encoding="utf-8")
        for n, text in visible(raw):
            if (m := ENGLISH.search(text)) and ' lang="' not in raw.split("\n")[n - 1].replace(f'lang="{language}"', ''):
                report(file, n, f"English word “{m.group(0)}” in: {text[:80]}")
            if (m := re.search(r"\b([^\W\d_]{2,})\s+\1\b", text, re.I)) and m.group(1).lower() not in {"de", "la", "ha", "no", "so", "ça", "je", "um", "se", "that", "had"}:
                report(file, n, f"doubled word “{m.group(0)}”")
            if re.search(CLEANING[language], text, re.I) and not HISTORY.search(text):
                report(file, n, f"cleaning word (dush only looks; allowed only for its own history): {text[:80]}")
            if language == "es" and text.count("?") > text.count("¿") and ' lang="' not in raw.split("\n")[n - 1]:
                report(file, n, f"“?” without “¿”: {text[:80]}")
            if language == "fr":
                if re.search(r"[A-Za-zÀ-ÿ’\)](?:[?!;]|:(?!\d))(?=\s|$)", text) and ' lang="' not in raw.split("\n")[n - 1]:
                    report(file, n, f"French punctuation needs a no-break space before ? ! : ; in: {text[:80]}")
                if re.search(r"\b\d[\d,. ]*\s?(GB|MB|TB)\b", text) or re.fullmatch(r"(GB|MB)", text):
                    report(file, n, f"French uses Go and Mo, not GB and MB: {text[:80]}")
        # a link's text repeated right after the link
        for m in re.finditer(r"<a\b[^>]*>([^<]+)</a>\s+\1\b", raw, re.I):
            report(file, raw.count("\n", 0, m.start()) + 1, f"link text repeated: {m.group(1)}")
        # placeholders and the other pages' date
        for m in re.finditer(r"[A-ZÀ-Ý]{4,} [A-ZÀ-Ý ]{6,}", "\n".join(t for _, t in visible(raw))):
            if not re.search(r"JSON|NO_COLOR|CSV|DerivedData|macOS|App Store", m.group(0)):
                report(file, 1, f"upper-case text, a placeholder? {m.group(0)}")

print(f"{problems} finding(s) in {len(languages)} language(s)." if problems else f"Clean: {len(languages)} language(s), nothing mechanical to report.")
sys.exit(1 if problems else 0)
