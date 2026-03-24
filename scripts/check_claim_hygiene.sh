#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
APEX_DOCS_DIR="$ROOT_DIR/docs/challenges/hedera-apex"

if [[ ! -d "$APEX_DOCS_DIR" ]]; then
  echo "[apex-claim-hygiene] missing docs directory: $APEX_DOCS_DIR" >&2
  exit 1
fi

PROHIBITED_PATTERNS='hashpack integrated|integrated hashpack|live hashpack integration|hashpack integration is live|hashconnect integrated|integrated hashconnect|live hashconnect integration|hashconnect integration is live'
ALLOWED_CONTEXT='candidate|roadmap|potential|future|not integrated|not currently integrated|tier 2'

status=0

if rg -n -i "$PROHIBITED_PATTERNS" "$APEX_DOCS_DIR" --glob '*.md'; then
  echo "[apex-claim-hygiene] prohibited live-integration wording detected." >&2
  status=1
fi

while IFS= read -r file; do
  if ! rg -qi "$ALLOWED_CONTEXT" "$file"; then
    echo "[apex-claim-hygiene] HashPack/HashConnect file missing candidate/roadmap context: ${file}" >&2
    status=1
  fi
done < <(rg -l -i 'hashpack|hashconnect' "$APEX_DOCS_DIR" --glob '*.md' || true)

if [[ $status -ne 0 ]]; then
  exit $status
fi

echo "[apex-claim-hygiene] pass"
