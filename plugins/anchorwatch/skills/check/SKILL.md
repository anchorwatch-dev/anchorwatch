---
name: check
description: Dry-run a shell command against Anchorwatch rules without executing it. Use when the user asks "would Anchorwatch block X?" or wants to test a command safely.
argument-hint: <shell command>
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" *)
---

Dry-run result for `$ARGUMENTS`:

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" check $ARGUMENTS
```

Report the verdict (PASS / WARN / DENY) and the rule that matched. Nothing was executed.
