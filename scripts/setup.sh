#!/bin/sh

# Prepares a checkout for work, by a person or a coding agent: installs the two tools and turns on
# the git hook (the gate before every commit).
#
# Usage: npm run setup

cd "$(dirname "$0")/.." || exit 2

command -v node >/dev/null || { echo "node is missing: install Node (see .nvmrc)." >&2; exit 1; }
npm ci || exit 1
git config core.hooksPath .githooks
echo "Git hook on (.githooks): npm run check runs before every commit."
echo "Before saying a change is done, run: npm run check"
