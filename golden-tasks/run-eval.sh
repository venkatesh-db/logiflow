#!/usr/bin/env bash
# Day 5, Lab 9 — runs every golden task against a given review configuration
# and saves raw output for manual scoring against each task's referenceOutcome.
#
# Usage:
#   ./golden-tasks/run-eval.sh "claude -p" run-single-agent
#
# Output lands in golden-tasks/results/<config-label>/<task-id>.txt
set -euo pipefail
cd "$(dirname "$0")/.."

CONFIG_CMD="${1:-}"
CONFIG_LABEL="${2:-default}"

if [ -z "$CONFIG_CMD" ]; then
  echo "usage: $0 \"<command to invoke the model, reads prompt on stdin>\" <config-label>"
  exit 1
fi

OUT_DIR="golden-tasks/results/$CONFIG_LABEL"
mkdir -p "$OUT_DIR"

for task_file in golden-tasks/tasks/*.yaml; do
  task_id=$(basename "$task_file" .yaml)
  prompt=$(python3 -c "
lines = open('$task_file').read().split('prompt: >')[1].split('referenceOutcome:')[0]
print(lines.strip())
")
  echo "=== Running $task_id against config '$CONFIG_LABEL' ==="
  echo "$prompt" | eval "$CONFIG_CMD" > "$OUT_DIR/$task_id.txt" 2>&1 || true
  echo "  -> saved to $OUT_DIR/$task_id.txt"
done

echo ""
echo "Done. Score each $OUT_DIR/<task>.txt against the matching golden-tasks/tasks/<task>.yaml's referenceOutcome."
