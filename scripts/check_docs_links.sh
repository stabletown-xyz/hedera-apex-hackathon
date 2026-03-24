#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

[[ -d "$ROOT_DIR/docs" ]] || {
  echo "[docs-links] missing docs directory under $ROOT_DIR" >&2
  exit 1
}

node - <<'NODE' "$ROOT_DIR"
const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2];
const docsRoot = path.join(rootDir, "docs");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (entry.isFile() && full.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

const markdownFiles = walk(docsRoot);
const missing = [];
const markdownLinkRegex = /\[[^\]]+\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const body = fs.readFileSync(file, "utf8");
  let match;
  while ((match = markdownLinkRegex.exec(body)) !== null) {
    const rawTarget = match[1].trim();
    if (!rawTarget || rawTarget.startsWith("http://") || rawTarget.startsWith("https://") || rawTarget.startsWith("mailto:")) {
      continue;
    }
    if (rawTarget.startsWith("#")) {
      continue;
    }

    const withoutAnchor = rawTarget.split("#")[0];
    const withoutQuery = withoutAnchor.split("?")[0];
    if (!withoutQuery) {
      continue;
    }

    const resolved = path.normalize(path.resolve(path.dirname(file), withoutQuery));
    if (!resolved.startsWith(rootDir)) {
      missing.push(`${path.relative(rootDir, file)} -> ${rawTarget} (resolves outside repo)`);
      continue;
    }
    if (!fs.existsSync(resolved)) {
      missing.push(`${path.relative(rootDir, file)} -> ${rawTarget}`);
    }
  }
}

if (missing.length > 0) {
  console.error("[docs-links] unresolved markdown links:");
  for (const entry of missing) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log("[docs-links] pass");
NODE
