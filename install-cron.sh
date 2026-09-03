#!/bin/zsh
set -euo pipefail

DIR="/Users/happinich/claud_coding/jobjoin"
JOB="0 11 * * * cd $DIR && PATH=/opt/homebrew/bin:/usr/bin:/bin /opt/homebrew/bin/npm run dev >> $DIR/cron.log 2>&1"
MATCH="$DIR"

TMP=$(mktemp)
crontab -l 2>/dev/null | grep -Fv "$MATCH" > "$TMP" || true
echo "$JOB" >> "$TMP"
crontab "$TMP"
rm -f "$TMP"

echo 'KAR 구인글 cron 등록 완료:'
crontab -l | grep -F "$MATCH"
