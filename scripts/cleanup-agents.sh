#!/usr/bin/env bash
# Cleanly stop Herdr Pi sub-agents and close their panes at task completion (runtimes/README.md).
#   bash cleanup-agents.sh --prefix <task-prefix>
#   bash cleanup-agents.sh <agent-name>...
# Never closes Main's own HERDR_PANE_ID.

(( $# >= 1 )) || { printf 'Usage: bash cleanup-agents.sh --prefix <prefix> | <agent-name>...\n' >&2; exit 2; }
herdr=${HERDR_BIN:-herdr}
self_pane=${HERDR_PANE_ID:-}

mode="names"
prefix=""
if [[ $1 == --prefix ]]; then
  [[ -n ${2:-} ]] || { printf 'Usage: bash cleanup-agents.sh --prefix <prefix>\n' >&2; exit 2; }
  mode="prefix"
  prefix=$2
fi

raw=$("$herdr" agent list 2>&1) || { printf 'herdr_error\n%s\n' "$raw" >&2; exit 2; }

targets=$(HERDR_RAW="$raw" MODE="$mode" PREFIX="$prefix" SELF_PANE="$self_pane" node - "$@" <<'EOF'
const raw = process.env.HERDR_RAW || '';
const mode = process.env.MODE;
const prefix = process.env.PREFIX || '';
const selfPane = process.env.SELF_PANE || '';
const names = new Set(process.argv.slice(2));

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  process.exit(3);
}
const agents = parsed?.result?.agents ?? parsed?.agents ?? [];
for (const a of agents) {
  const name = a?.name ?? '';
  const pane = a?.pane_id ?? a?.pane ?? '';
  if (!name) continue;
  const matched = mode === 'prefix'
    ? (name === prefix || name.startsWith(`${prefix}-`) || name.startsWith(`${prefix}_`))
    : names.has(name);
  if (!matched) continue;
  if (selfPane && pane === selfPane) continue;
  console.log(`${name}\t${pane}`);
}
EOF
) || { printf 'parse_error\n%s\n' "$raw" >&2; exit 2; }

closed=0
while IFS=$'\t' read -r name pane; do
  [[ -n $name ]] || continue
  if [[ -n $pane ]]; then
    "$herdr" pane send-keys "$pane" ctrl-c >/dev/null 2>&1 || true
    "$herdr" pane close "$pane" >/dev/null 2>&1 || "$herdr" agent stop "$name" >/dev/null 2>&1 || true
  else
    "$herdr" agent stop "$name" >/dev/null 2>&1 || true
  fi
  closed=$((closed + 1))
  printf 'closed agent=%s pane=%s\n' "$name" "${pane:-N/A}"
done <<< "$targets"

printf 'cleanup_done closed=%s\n' "$closed"
