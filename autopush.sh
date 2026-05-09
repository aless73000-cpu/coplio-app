#!/bin/bash
cd ~/Desktop/coplio-app
git pull --rebase
if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "auto-save $(date '+%d/%m/%Y %H:%M')"
    git push
fi
