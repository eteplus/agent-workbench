#!/usr/bin/env bash
# Baseline / checkpoint snapshot for dirty overlaps or explicit version checks (core/task-contract.md §3).
#   bash evidence-snapshot.sh <base-commit> <absolute-out-dir> [-- <paths>...]
#   bash evidence-snapshot.sh --verify <absolute-out-dir>
# Run inside the target repository. Also copies untracked files in scope so line-level diffs remain available.

usage() { printf 'Usage: bash evidence-snapshot.sh <base> <absolute-out-dir> [-- paths...] | --verify <absolute-out-dir>\n' >&2; exit 2; }

capture() { # <base> <dir> <paths...>
  local base=$1 dir=$2; shift 2
  local spec=("$@") prefix
  (( ${#spec[@]} )) || spec=(.)
  prefix=$(git -C "$dir" rev-parse --show-prefix 2>/dev/null) && [[ -n $prefix ]] && spec+=(":(top,exclude)$prefix")
  git diff --binary "$base" -- "${spec[@]}" > "$dir/implementation.diff" || return 2
  shasum -a 256 < "$dir/implementation.diff" | cut -d' ' -f1 > "$dir/diff-fingerprint.txt"
  mkdir -p "$dir/untracked" || return 2
  git ls-files --others --exclude-standard -- "${spec[@]}" | while IFS= read -r path; do
    [[ -f $path ]] || continue
    printf '%s\t%s\n' "$(shasum -a 256 < "$path" | cut -d' ' -f1)" "$path"
    mkdir -p "$dir/untracked/$(dirname "$path")"
    cp -p "$path" "$dir/untracked/$path"
  done > "$dir/untracked-hashes.txt"
  git status --porcelain -uall -- "${spec[@]}" > "$dir/git-status.txt"
}

if [[ $1 == --verify ]]; then
  dir=$2
  [[ $dir == /* && -f $dir/base-commit.txt ]] || usage
  paths=()
  while IFS= read -r line; do [[ -n $line ]] && paths+=("$line"); done < "$dir/paths.txt"
  now=$(mktemp -d) || exit 2
  trap 'rm -rf "$now"' EXIT
  capture "$(cat "$dir/base-commit.txt")" "$now" "${paths[@]}" || exit 2
  result=0
  for file in diff-fingerprint.txt untracked-hashes.txt git-status.txt; do
    if ! cmp -s "$dir/$file" "$now/$file"; then
      printf 'MISMATCH %s\n' "$file"
      diff "$dir/$file" "$now/$file" | head -20
      result=1
    fi
  done
  if [[ -d $dir/untracked ]] && ! cmp -s "$dir/untracked-hashes.txt" "$now/untracked-hashes.txt"; then
    diff -ruN "$dir/untracked" "$now/untracked" | head -60
  fi
  (( result )) || printf 'MATCH fingerprint=%s\n' "$(cat "$dir/diff-fingerprint.txt")"
  exit "$result"
fi

(( $# >= 2 )) && [[ $2 == /* ]] || usage
base=$1 dir=$2; shift 2
[[ $1 == -- ]] && shift
git rev-parse --verify -q "$base^{commit}" > /dev/null || { printf 'unknown base: %s\n' "$base" >&2; exit 2; }
mkdir -p "$dir" || exit 2
git rev-parse "$base^{commit}" > "$dir/base-commit.txt"
printf '%s\n' "$@" > "$dir/paths.txt"
capture "$base" "$dir" "$@" || exit 2
printf 'captured fingerprint=%s untracked=%s\n' "$(cat "$dir/diff-fingerprint.txt")" "$(wc -l < "$dir/untracked-hashes.txt" | tr -d ' ')"
