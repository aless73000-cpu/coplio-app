#!/bin/bash

REPO="/Users/alessiospena/Desktop/coplio-app"
LOG="$REPO/autopush.log"
MAX_LOG_LINES=500

cd "$REPO" || exit 1

# Vérifie s'il y a des modifications (suivies ou non suivies)
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

git add -A
git commit -m "auto-save $TIMESTAMP"
git push origin HEAD

echo "[$TIMESTAMP] ✅ Push réussi" >> "$LOG"

# Garde le log court
if [ "$(wc -l < "$LOG")" -gt "$MAX_LOG_LINES" ]; then
  tail -n $MAX_LOG_LINES "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
