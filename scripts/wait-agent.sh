#!/usr/bin/env bash
# Main-side wait loop for one Herdr Pi sub-agent: one tool call per long wait (runtimes/README.md).
#   bash wait-agent.sh <agent> <session-file> <evidence-dir> [interval-sec=300] [stall-probes=2] [max-cost-usd=0]
# Exit: 0 done | 3 stalled (no new diff or evidence files) | 4 cost limit reached | 2 usage / herdr error.
# max-cost-usd=0 disables the cost check. Progress is judged inside the current git repository.

(( $# >= 3 )) || { printf 'Usage: bash wait-agent.sh <agent> <session-file> <evidence-dir> [interval-sec] [stall-probes] [max-cost-usd]\n' >&2; exit 2; }
agent=$1 session=$2 evidence=$3 interval=${4:-300} stall_limit=${5:-2} max_cost=${6:-0}
herdr=${HERDR_BIN:-herdr}
here=$(cd "$(dirname "$0")" && pwd)

probe() {
  node "$here/session-progress.mjs" "$session" | head -1
  git diff --stat | tail -1
}
signature() {
  { git diff --binary; git ls-files --others --exclude-standard -z | xargs -0 shasum -a 256 2>/dev/null; ls -lR "$evidence" 2>/dev/null; } | shasum -a 256 | cut -d' ' -f1
}

last=$(signature) idle=0
while true; do
  output=$("$herdr" agent wait "$agent" --timeout "$((interval * 1000))" 2>&1)
  status=$?
  if (( status == 0 )); then
    printf 'agent_done\n'; probe; exit 0
  fi
  if [[ $output != *'"timeout"'* ]]; then
    printf 'herdr_error exit=%s\n%s\n' "$status" "$output"; exit 2
  fi
  line=$(probe)
  printf '%s\n' "$line"
  cost=$(sed -n 's/.*cost_usd=\([0-9.]*\).*/\1/p' <<< "$line" | head -1)
  if awk -v c="${cost:-0}" -v m="$max_cost" 'BEGIN { exit !(m > 0 && c >= m) }'; then
    printf 'cost_limit cost_usd=%s max=%s\n' "$cost" "$max_cost"; exit 4
  fi
  now=$(signature)
  if [[ $now == "$last" ]]; then idle=$((idle + 1)); else idle=0 last=$now; fi
  if (( idle >= stall_limit )); then
    printf 'stalled probes_without_progress=%s\n' "$idle"; exit 3
  fi
done
