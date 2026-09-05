---
name: rules
description: Reference for Anchorwatch guardrail rules and how to respond when a tool call is blocked. Use when a command or edit was denied with "Anchorwatch blocked", or when the user asks what Anchorwatch protects against.
user-invocable: true
---

# How to behave when Anchorwatch blocks something

1. Do not retry the same command with trivial changes, and never try to bypass the guard (e.g. by writing the command to a script, using `eval`, base64, or editing `.anchorwatch.json` yourself).
2. Tell the user plainly what was blocked and why, in one or two sentences.
3. Offer the safer path:
   - force push to a protected branch → push to a feature branch and open a PR, or ask the user to run it themselves with `--force-with-lease`.
   - `git reset --hard` / `git clean -f` → `git stash` first, or show the diff and ask.
   - recursive delete → list what would be deleted (`ls`, `git status --ignored`) and delete specific paths.
   - `cat .env` → list variable names only: `grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env`.
   - DROP/TRUNCATE/DELETE without WHERE → write a migration or a WHERE-scoped statement, and ask for confirmation.
   - `curl ... | sh` → download to a file, show its contents, then run.
4. If the user explicitly wants the exact command anyway, they can run it themselves, or lower the rule with `/anchorwatch:allow` (that is their decision, not yours).

# Rule reference

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" rules
```
