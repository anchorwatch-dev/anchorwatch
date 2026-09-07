#!/usr/bin/env bash
# Runs one ops/routines/<name>.md brief with Claude Code in headless mode inside GitHub Actions.
# Requires ANTHROPIC_API_KEY (repo secret) and GH_TOKEN (the workflow's token, with contents+pull-requests+issues write).
set -euo pipefail
name="${1:?routine name}"; model="${2:-claude-sonnet-5}"; max_turns="${3:-80}"
brief="ops/routines/$name.md"; [ -f "$brief" ] || { echo "no brief at $brief" >&2; exit 1; }
[ -n "${ANTHROPIC_API_KEY:-}" ] || { echo "ANTHROPIC_API_KEY not set — routine skipped (add the repository secret to enable)"; exit 0; }
git config user.name "anchorwatch-ops"; git config user.email "dev@anchorwatch.sh"
today="$(date -u +%Y%m%d)"
prompt="$(cat <<PROMPT
You are operating the Anchorwatch project as the scheduled routine "$name", running headless inside GitHub Actions on $(date -u +%Y-%m-%d). The repository anchorwatch-dev/anchorwatch is checked out at the current directory; the private anchorwatch-dev/anchorwatch-pro repository is checked out at ./anchorwatch-pro when the routine needs it. \`gh\` is authenticated. Your brief follows; follow it exactly.

Ground rules for every routine run:
- Never commit to main. Work on a branch named routine/$name-$today, commit with conventional messages, push with \`git push -u origin HEAD\`, and open a pull request with \`gh pr create\` using the title the brief specifies and a body that states what changed and includes test output. A PR with failing tests must carry the title prefix [FAILING].
- Run \`bash tests/run.sh\` (and the same inside ./anchorwatch-pro if you changed it) before opening any PR.
- Never weaken a \`block\` rule to make a test pass, never add runtime dependencies, keep bash 3.2 compatibility, never touch secrets, workflow files, or ops/state/polar-orders.json.
- Always leave a dated one-line entry in ops/state/$name.log (create it if missing) and commit it — if nothing else changed, open a PR titled "chore(ops): $name log $today" containing just that line.
- Finish with a short plain summary for the owner: what you found, what you changed, PR link or "no change".

=== BRIEF: $brief ===
$(cat "$brief")
PROMPT
)"
npx -y @anthropic-ai/claude-code@latest -p "$prompt" --model "$model" --max-turns "$max_turns" --permission-mode acceptEdits \
  --allowedTools "Bash" "Read" "Write" "Edit" "Glob" "Grep" "WebFetch" "WebSearch" --output-format text 2>&1 | tail -80
