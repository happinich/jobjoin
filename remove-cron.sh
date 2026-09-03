#!/bin/zsh
set -euo pipefail

MATCH="/Users/happinich/claud_coding/jobjoin"
TMP=$(mktemp)
crontab -l 2>/dev/null | grep -Fv "$MATCH" > "$TMP" || true
crontab "$TMP"
rm -f "$TMP"

echo 'KAR 구인글 cron 제거 완료.'
