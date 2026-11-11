#!/usr/bin/env bash
# Main-side bounded wait loop for one Herdr Pi sub-agent (runtimes/README.md).
#   bash wait-agent.sh <agent> [session-file=-] [evidence-dir=.] [interval-sec=120] [stall-probes=2] [max-cost-usd=0] [max-cycles=2]
# Defaults wait ~240s (120s * 2 cycles) before returning 1 (still_working), staying safely below
# 300s bash tool timeouts and keeping 5-minute LLM prompt caches warm. Pass max-cycles=0 for unbounded wait.
# Exit:
#   0 done          - sub-agent finished turn
#   1 still_working - reached max-cycles with active progress (Main should immediately re-run to continue waiting)
#   2 error         - invalid arguments or Herdr error
#   3 stalled       - no session/diff/evidence progress across stall-probes intervals
#   4 cost_limit    - session cost reached max-cost-usd (>0)

(( $# >= 1 )) || { printf 'Usage: bash wait-agent.sh <agent> [session-file=-] [evidence-dir=.] [interval-sec=120] [stall-probes=2] [max-cost-usd=0] [max-cycles=2]\n' >&2; exit 2; }
agent=$1
session=${2:--}
evidence=${3:-.}
interval=${4:-120}
stall_limit=${5:-2}
max_cost=${6:-0}
if (( $# >= 7 )) && [[ -n $7 ]]; then max_cycles=$7; else max_cycles=2; fi

herdr=${HERDR_BIN:-herdr}
here=$(cd "$(dirname "$0")" && pwd)

probe() {
  node "$here/session-progress.mjs" "$session" | head -1
  git diff --stat 2>/dev/null | tail -1
}
signature() {
  {
    [[ $session != "-" && -f $session ]] && wc -c < "$session" 2>/dev/null
    git diff --binary 2>/dev/null
    git ls-files --others --exclude-standard -z 2>/dev/null | xargs -0 shasum -a 256 2>/dev/null
    ls -lR "$evidence" 2>/dev/null
  } | shasum -a 256 | cut -d' ' -f1
}

last=$(signature) idle=0 cycles=0
while true; do
  output=$("$herdr" agent wait "$agent" --timeout "$((interval * 1000))" 2>&1)
  status=$?
  if (( status == 0 )); then
    printf 'agent_done\n'; probe; exit 0
  fi
  if [[ $output != *'"timeout"'* ]]; then
    printf 'herdr_error exit=%s\n%s\n' "$status" "$output"; exit 2
  fi
  cycles=$((cycles + 1))
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
  if (( max_cycles > 0 && cycles >= max_cycles )); then
    printf 'still_working cycles=%s\n' "$cycles"; exit 1
  fi
done
