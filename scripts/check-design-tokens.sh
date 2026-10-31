#!/bin/sh
# Fails when a change adds a hard-coded style value to an .scss file. Only lines the change adds are checked,
# so existing code does not fail unrelated changes. Rules: docs/design-system/02-design-tokens.md.
#   - hex colours (use a var(--color-*) token). Token definitions are allowed under src/app/webapp-common/styles/.
#   - !important
#   - box-shadow (other than none)
#   - padding, margin, gap, border-radius pixel values outside the 4 px scale (0, 4, 8, 12, 16, 24, 32, 48, 64)
# Base: BASE_REF (default origin/main). The checkout needs the base commit (fetch-depth: 0 in CI).
cd "$(dirname "$0")/.." || exit 1
BASE_REF=${BASE_REF:-origin/main}

if ! git rev-parse --verify -q "$BASE_REF^{commit}" >/dev/null; then
  echo "Base $BASE_REF not found. Fetch it first (git fetch origin main)." >&2
  exit 1
fi
MERGE_BASE=$(git merge-base "$BASE_REF" HEAD) || exit 1

git diff -U0 --no-color --no-ext-diff "$MERGE_BASE" -- '*.scss' | awk '
function report(msg) {
  printf "%s:%d: %s\n    %s\n", file, current, msg, text
  failures++
}
function check_spacing(prop, value,    n, i, v, num) {
  n = split(value, parts, /[ \t,]+/)
  for (i = 1; i <= n; i++) {
    v = parts[i]
    if (v !~ /^-?[0-9.]+px$/) continue
    num = v
    sub(/px$/, "", num)
    sub(/^-/, "", num)
    if (num + 0 == 0) continue
    if (!(num in scale)) report(prop ": " v " is off the 4 px scale")
  }
}
BEGIN {
  n = split("4 8 12 16 24 32 48 64", s, " ")
  for (i = 1; i <= n; i++) scale[s[i]] = 1
  failures = 0
}
/^\+\+\+ / { file = substr($0, 7); next }
/^@@/ {
  split($3, p, ",")
  lineno = substr(p[1], 2) + 0
  next
}
/^\+/ {
  text = substr($0, 2)
  current = lineno
  lineno++
  if (text ~ /^[ \t]*(\/\/|\/\*|\*)/) next
  if (text ~ /!important/) report("!important is not allowed")
  if (text ~ /(^|[^A-Za-z-])box-shadow[ \t]*:/ && text !~ /box-shadow[ \t]*:[ \t]*none/) \
    report("box-shadow is not allowed; use a surface tone and a border")
  is_token_definition = (file ~ /(^|\/)styles\// && text ~ /^[ \t]*(--[A-Za-z0-9_-]+|\$[A-Za-z0-9_-]+)[ \t]*:/)
  if (text ~ /:[^#]*#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]+([^0-9A-Za-z_-]|$)/ && !is_token_definition) \
    report("hex colour: use a design token such as var(--color-*)")
  if (text ~ /^[ \t]*-?(padding|margin|gap|row-gap|column-gap|border-radius)(-[a-z-]+)?[ \t]*:/) {
    prop = text
    sub(/^[ \t]+/, "", prop)
    sub(/[ \t]*:.*$/, "", prop)
    value = text
    sub(/^[^:]*:/, "", value)
    sub(/;.*$/, "", value)
    check_spacing(prop, value)
  }
  next
}
END {
  if (failures > 0) {
    printf "\n%d design-token violation(s) in added lines. See docs/design-system/02-design-tokens.md.\n", failures > "/dev/stderr"
    exit 1
  }
  print "No design-token violations in added lines."
}
'

# TypeScript: a hex literal may be added only in a file on the colour exception list. The list is the set of
# `src/...ts` paths between the markers in docs/design-system/05-color-system.md (data colours, see that file).
DOC=docs/design-system/05-color-system.md
EXC=$(sed -n '/<!-- colour-exceptions:start -->/,/<!-- colour-exceptions:end -->/p' "$DOC" | grep -o '`src/[^`]*\.ts`' | tr -d '`' | tr '\n' ' ')
if [ -z "$EXC" ]; then
  echo "No colour exception list found in $DOC." >&2
  exit 1
fi
ts_failures=0
for f in $EXC; do
  if [ ! -f "$f" ]; then
    echo "$DOC: colour exception $f does not exist any more; remove it from the list." >&2
    ts_failures=$((ts_failures + 1))
  fi
done
git diff -U0 --no-color --no-ext-diff "$MERGE_BASE" -- '*.ts' ':!*.spec.ts' | awk -v exc="$EXC" '
BEGIN { n = split(exc, arr, " "); for (i = 1; i <= n; i++) allowed[arr[i]] = 1; failures = 0 }
/^\+\+\+ / { file = substr($0, 7); next }
/^@@/ { split($3, p, ","); lineno = substr(p[1], 2) + 0; next }
/^\+/ {
  text = substr($0, 2)
  current = lineno
  lineno++
  if (text ~ /^[ \t]*(\/\/|\/\*|\*)/) next
  if (file in allowed) next
  if (text ~ /#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]+([^0-9A-Za-z_-]|$)/) {
    printf "%s:%d: hex colour in TypeScript: use a theme token (themeColor() for drawing libraries), or add the file to the colour exception list in %s\n    %s\n", file, current, "docs/design-system/05-color-system.md", text > "/dev/stderr"
    failures++
  }
}
END { exit (failures > 0) }
' || ts_failures=$((ts_failures + 1))
if [ "$ts_failures" -gt 0 ]; then
  echo "$ts_failures TypeScript colour check failure(s)." >&2
  exit 1
fi
echo "No TypeScript colour violations in added lines."
