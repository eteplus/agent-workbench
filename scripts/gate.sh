#!/usr/bin/env bash
# Terminal-state gate helpers (core/acceptance.md §5-§6).
#   bash gate.sh tree <base-commit>   fingerprint of the final content of every file changed since base; run inside the repo
#   bash gate.sh technical <task-root> 核对基线和审查版本，不代替人工批准
#   bash gate.sh check <task-root>    verify final-state invariants before cleanup; exit 1 on failure
# The fingerprint hashes file contents, not diff text, so it is identical before and after committing.
# shortcut: Main attests the stamp in overview.md (no way to prove a Reviewer ran); the Task Root must be git-ignored (task-contract.md §4). Revisit if stamps get forged.

tree_hash() {
  local repo
  repo=$(git rev-parse --show-toplevel 2>/dev/null) || { printf 'gate_error=not_in_repo\n' >&2; return 2; }
  (
    cd "$repo" || exit 2
    git rev-parse --verify -q "$1^{commit}" >/dev/null || { printf 'gate_error=bad_base\n' >&2; return 2; }
    { git diff --name-only "$1"; git ls-files -o --exclude-standard; } | sort -u | while IFS= read -r f; do
      printf '%s %s\n' "$f" "$([[ -f $f ]] && git hash-object -- "$f" || echo deleted)"
    done | git hash-object --stdin
  )
}

check() {
  local root=$1 ov=$1/overview.md mode=${2:-final} fail=0 base repo reviewed fast cur dr verdict
  [[ -f $ov ]] || { printf 'gate_fail=no_overview\n'; return 1; }
  repo=$(git -C "$root" rev-parse --show-toplevel) || { printf 'gate_fail=not_in_repo\n'; return 1; }

  if [[ $mode == final ]]; then
    verdict=$(grep -m1 -E '^(- *)?(当前阶段 */ *)?Verdict:' "$ov")
    if [[ -z $verdict ]] || grep -qE 'IN PROGRESS|派发中|NEEDS ' <<< "$verdict"; then
      printf 'gate_fail=overview_status_not_final\n'; fail=1
    fi
    grep -q 'Models & Usage' "$ov" || { printf 'gate_fail=no_models_and_usage\n'; fail=1; }
  fi
  if [[ -f $root/decisions.md ]] && grep -q 'PROPOSED' "$root/decisions.md"; then printf 'gate_fail=decisions_proposed\n'; fail=1; fi

  dr=$(grep -m1 -E 'Developer Review: *REQUIRED' "$ov")
  if [[ $mode == final && -n $dr && ( $dr != *APPROVED* || $dr == *PENDING* ) ]]; then printf 'gate_fail=developer_review_not_approved\n'; fail=1; fi

  reviewed=$(grep -m1 -oE '^(- )?Reviewed Tree: *[0-9a-f]{40}' "$ov" | grep -oE '[0-9a-f]{40}')
  fast=$(grep -m1 -oE '^(- )?Fast Lane Tree: *[0-9a-f]{40}' "$ov" | grep -oE '[0-9a-f]{40}')
  base=$(grep -m1 'Base Commit' "$ov")
  if [[ -z $base ]]; then
    printf 'gate_fail=no_base_commit\n'; fail=1; base=""
  elif [[ $base =~ (^|[^0-9a-f])([0-9a-f]{40})($|[^0-9a-f]) ]]; then
    base=${BASH_REMATCH[2]}
  else
    printf 'gate_fail=base_commit_not_full 请用 git rev-parse HEAD 保存完整提交号\n'; fail=1; base=""
  fi
  if ! ls "$root"/subtasks/review/review*.md >/dev/null 2>&1; then
    printf 'gate_fail=no_review_report\n'; fail=1
  elif [[ -z $reviewed && -z $fast ]]; then
    printf 'gate_fail=reviewed_tree_not_recorded\n'; fail=1
  elif [[ -n $base ]]; then
    cur=$(cd "$repo" && tree_hash "$base") || { printf 'gate_fail=tree_hash_error\n'; return 1; }
    if [[ $cur != "$reviewed" && $cur != "$fast" ]]; then printf 'gate_fail=review_stale current=%s reviewed=%s\n' "$cur" "${reviewed:-none}"; fail=1; fi
  fi

  if (( fail == 0 )); then
    if [[ $mode == final ]]; then printf 'gate_ok\n'; else printf 'gate_technical_ok\n'; fi
  fi
  return "$fail"
}

(( $# == 2 )) || { printf 'Usage: bash gate.sh tree <base-commit> | technical <task-root> | check <task-root>\n' >&2; exit 2; }
case ${1:-} in
  tree) tree_hash "$2" ;;
  technical) check "$2" technical ;;
  check) check "$2" final ;;
  *) printf 'Usage: bash gate.sh tree <base-commit> | technical <task-root> | check <task-root>\n' >&2; exit 2 ;;
esac
