#!/bin/bash

PLIST="$HOME/Library/LaunchAgents/fr.coplio.autopush.plist"
LOG="/Users/alessiospena/Desktop/coplio-app/autopush.log"
LABEL="fr.coplio.autopush"

case "$1" in
  start)
    launchctl load "$PLIST" 2>/dev/null && echo "✅ autopush démarré"
    ;;
  stop)
    launchctl unload "$PLIST" 2>/dev/null && echo "⏹  autopush arrêté"
    ;;
  restart)
    launchctl unload "$PLIST" 2>/dev/null
    launchctl load "$PLIST" 2>/dev/null
    echo "🔄 autopush redémarré"
    ;;
  status)
    if launchctl list | grep -q "$LABEL"; then
      PID=$(launchctl list | grep "$LABEL" | awk '{print $1}')
      echo "✅ autopush actif (PID $PID) — toutes les 5 min"
    else
      echo "⏹  autopush inactif"
    fi
    ;;
  log)
    if [ -f "$LOG" ]; then
      tail -20 "$LOG"
    else
      echo "Aucun log pour l'instant."
    fi
    ;;
  now)
    bash /Users/alessiospena/Desktop/coplio-app/autopush.sh && echo "✅ Push forcé"
    ;;
  *)
    echo "Usage: autopush <commande>"
    echo ""
    echo "  start    — démarrer le service"
    echo "  stop     — arrêter le service"
    echo "  restart  — redémarrer le service"
    echo "  status   — état actuel"
    echo "  log      — voir les 20 dernières lignes du log"
    echo "  now      — forcer un push immédiat"
    ;;
esac
