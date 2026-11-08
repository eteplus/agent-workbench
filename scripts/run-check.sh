#!/usr/bin/env bash

if (( $# < 2 )) || [[ $1 != /* ]]; then
  printf 'Usage: bash run-check.sh <absolute-log-path> <command> [args...]\n' >&2
  exit 2
fi

# shortcut: absolute paths are not a sandbox; use the log path authorized in the Contract.
log=$1
shift
exec 3>"$log" || { printf 'check_not_run=log_open_failed\n' >&2; exit 2; }

( "$@" ) >&3 2>&1
result=$?
exec 3>&-
tail -n 40 "$log"
printf 'check_exit=%s\n' "$result"
exit "$result"
