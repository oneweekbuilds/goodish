#!/bin/bash
# Quick Ralph Launcher
# Usage: ./scripts/ralph-quick.sh "Your prompt here" [max-iterations]
# Example: ./scripts/ralph-quick.sh "Fix all failing tests in the extension" 15

PROMPT="$1"
MAX_ITER="${2:-20}"

if [ -z "$PROMPT" ]; then
    echo "Usage: ./scripts/ralph-quick.sh \"Your prompt here\" [max-iterations]"
    echo ""
    echo "Available prompt templates:"
    ls -1 .ralph-prompts/ 2>/dev/null
    exit 1
fi

echo "Starting Ralph loop (max $MAX_ITER iterations)..."
claude -p "/ralph-loop:ralph-loop '${PROMPT}' --max-iterations ${MAX_ITER} --completion-promise 'COMPLETE'"
