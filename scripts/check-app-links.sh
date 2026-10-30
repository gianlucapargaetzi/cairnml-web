#!/bin/sh
# Fails when the app builds a root-absolute link such as href="/projects/..." or [href]="'/projects/...'".
# Such links ignore the <base href> path (/cairnml/) and lead to a 404 on the server.
# Use routerLink, or LocationStrategy.prepareExternalUrl() for a string href.
cd "$(dirname "$0")/.." || exit 1
PATTERN='href\]?[[:space:]]*[=:][[:space:]]*["'"'"'`]+/[^/]|window\.open\(["'"'"'`]/[^/]'
if grep -rnE "$PATTERN" src --include='*.html' --include='*.ts' --exclude='*.spec.ts' --exclude='index.html' --exclude-dir=business-logic; then
  echo "Root-absolute links found: use routerLink or LocationStrategy.prepareExternalUrl()." >&2
  exit 1
fi
echo "No root-absolute app links."
