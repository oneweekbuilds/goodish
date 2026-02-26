#!/bin/bash
# Overnight Ralph Runner for AlgorithmLens
# Edit the tasks below, then run before bed:
#   ./scripts/overnight-ralph.sh
#
# Use tmux to keep it running after closing terminal:
#   tmux new -s ralph
#   ./scripts/overnight-ralph.sh
#   # Press Ctrl+B then D to detach
#   # Reconnect later with: tmux attach -t ralph

echo "Starting overnight Ralph run at $(date)"

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Uncomment and customize each task:

# echo "Task 1: [Description]"
# cd "$PROJECT_ROOT"
# claude -p "/ralph-loop:ralph-loop '[Your prompt here — one continuous block of text, no line breaks]' --max-iterations 25 --completion-promise 'COMPLETE'"

# echo "Task 2: [Description]"
# cd "$PROJECT_ROOT"
# claude -p "/ralph-loop:ralph-loop '[Your prompt here]' --max-iterations 25 --completion-promise 'COMPLETE'"

echo "All overnight tasks completed at $(date)"
