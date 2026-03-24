#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PORT="${PORT:-4173}"

cd "$ROOT_DIR"
echo "[demo] serving mirror at http://127.0.0.1:${PORT}"
echo "[demo] open http://127.0.0.1:${PORT}/frontend/apex-judge-miniapp/index.html"

python3 -m http.server "$PORT"
