#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
  npx playwright install chromium
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. KAR_PASSWORD를 입력 후 다시 실행하세요."
  exit 1
fi

if ! grep -q '^KAR_PASSWORD=.' .env; then
  echo ".env 파일에 KAR_PASSWORD를 설정하세요."
  exit 1
fi

npm run dev
