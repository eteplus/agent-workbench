#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_PROMPT_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/prompts"
PI_PROMPT="$PI_PROMPT_DIR/workflow.md"
SOURCE_PROMPT="$ROOT/runtimes/pi/workflow.md"

mkdir -p "$PI_PROMPT_DIR"

if [[ -L "$PI_PROMPT" ]]; then
  CURRENT="$(readlink "$PI_PROMPT")"
  if [[ "$CURRENT" == "$SOURCE_PROMPT" ]]; then
    echo "Pi prompt already linked: $PI_PROMPT"
  else
    echo "Refusing to replace existing symlink: $PI_PROMPT -> $CURRENT" >&2
    exit 1
  fi
elif [[ -e "$PI_PROMPT" ]]; then
  echo "Refusing to overwrite existing file: $PI_PROMPT" >&2
  echo "Back it up or move it, then run this script again." >&2
  exit 1
else
  ln -s "$SOURCE_PROMPT" "$PI_PROMPT"
  echo "Linked Pi prompt: $PI_PROMPT -> $SOURCE_PROMPT"
fi

cat <<EOF_MSG

Pi Prompt Template installed.
Set this in your shell profile if it is not configured yet:

export AGENT_WORKBENCH_ROOT="$ROOT"

Then reload Pi prompts in an active session with /reload.
For Claude Code, install the Skill with:

pnpx skills add "$ROOT/runtimes/claude-code" --skill workflow --agent claude-code --global

Choose Symlink when prompted.
EOF_MSG
