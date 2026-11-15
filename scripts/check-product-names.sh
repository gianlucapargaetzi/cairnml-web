#!/bin/sh
# Fails when a ClearML-era name (clearml, trains, allegro) appears in tracked text outside the allow-list
# scripts/product-names-allowlist.txt. Documentation, licences and the lock file are not checked.
cd "$(dirname "$0")/.." || exit 1
ALLOW=scripts/product-names-allowlist.txt

HITS=$(git grep -I -n -i -E 'clearml|trains|allegro' -- . \
  ':!*.md' ':!LICENSE*' ':!NOTICE' ':!pnpm-lock.yaml' ':!docs' \
  ':!scripts/check-product-names.sh' ':!scripts/product-names-allowlist.txt')

fail=0
while IFS= read -r hit; do
  [ -z "$hit" ] && continue
  path=${hit%%:*}
  allowed=0
  while IFS='|' read -r apath afrag _reason; do
    case "$apath" in ''|\#*) continue ;; esac
    if [ "$path" = "$apath" ] && case "$hit" in *"$afrag"*) true ;; *) false ;; esac; then
      allowed=1
      break
    fi
  done < "$ALLOW"
  if [ "$allowed" -eq 0 ]; then
    echo "ClearML-era name not on the allow-list: $hit" >&2
    fail=1
  fi
done <<EOT
$HITS
EOT

if [ "$fail" -ne 0 ]; then
  echo "Rename the name, or add the line to $ALLOW with a reason." >&2
  exit 1
fi
echo "No unlisted ClearML-era names."
