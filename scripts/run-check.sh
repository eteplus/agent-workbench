#!/usr/bin/env bash

if (( $# < 2 )) || [[ $1 != /* ]]; then
  printf 'Usage: bash run-check.sh <absolute-log-path> <command> [args...]\n' >&2
  exit 2
fi

# shortcut: absolute paths are not a sandbox; use the log path authorized in the Contract.
log=$1
shift
exec 3>"$log" || { printf 'check_not_run=log_open_failed\n' >&2; exit 2; }

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
check_tree() {
  bash "$script_dir/gate.sh" tree HEAD 2>/dev/null || printf 'N/A\n'
}
printf 'check_started_at=%s\n' "$(TZ=Asia/Shanghai date '+%Y-%m-%dT%H:%M:%S%z')" >&3
printf 'check_cwd=%s\n' "$PWD" >&3
printf 'check_head=%s\n' "$(git rev-parse --verify HEAD 2>/dev/null || printf 'N/A')" >&3
printf 'check_tree=%s\n' "$(check_tree)" >&3
printf 'check_command=' >&3
printf '%q ' "$@" >&3
printf '\n' >&3

( "$@" ) >&3 2>&1
result=$?
printf '\ncheck_finished_at=%s\n' "$(TZ=Asia/Shanghai date '+%Y-%m-%dT%H:%M:%S%z')" >&3
printf 'check_tree_after=%s\n' "$(check_tree)" >&3
printf 'check_exit=%s\n' "$result" >&3
exec 3>&-
tail -n 40 "$log"
exit "$result"
