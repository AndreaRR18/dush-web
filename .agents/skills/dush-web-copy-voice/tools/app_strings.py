#!/usr/bin/env python3
"""Look up the app's own wording: every English string of the app's catalog that contains a text,
with its translation in each language the site ships.

    python3 -I .agents/skills/dush-web-copy-voice/tools/app_strings.py "Safe to delete" [more words]

Reads ../dush-desktop/DushMac/Sources/Translations/Resources/Localizable.xcstrings (a sibling
checkout). Set DUSH_CATALOG to read another file."""
import json, os, sys
from pathlib import Path

root = Path(__file__).resolve().parents[4]
catalog = Path(os.environ.get("DUSH_CATALOG", root.parent / "dush-desktop/DushMac/Sources/Translations/Resources/Localizable.xcstrings"))
languages = [("de", "de"), ("es", "es"), ("fr", "fr"), ("it", "it"), ("nl", "nl"), ("pl", "pl"), ("pt", "pt-PT")]

if len(sys.argv) < 2:
    sys.exit(__doc__)
if not catalog.exists():
    sys.exit(f"Catalog not found: {catalog}\nCheck out dush-desktop next to dush-web, or set DUSH_CATALOG.")

strings = json.loads(catalog.read_text(encoding="utf-8"))["strings"]
found = 0
for needle in sys.argv[1:]:
    for key, entry in strings.items():
        localizations = entry.get("localizations", {})
        english = localizations.get("en", {}).get("stringUnit", {}).get("value") or key
        if needle.lower() not in english.lower():
            continue
        found += 1
        print(f"## {english}   [{key}]")
        for code, name in languages:
            value = localizations.get(code, {}).get("stringUnit", {}).get("value") or localizations.get(name, {}).get("stringUnit", {}).get("value")
            print(f"   {code}: {value if value is not None else '—'}")
if not found:
    print("No string contains that text.")
