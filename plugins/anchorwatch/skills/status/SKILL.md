---
name: status
description: Show which Anchorwatch guardrail rules are active, their levels, the config file in use, and allow patterns.
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" *)
---

## Current Anchorwatch status

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" status
```

Summarise the above for the user in a short table: which rules block, which warn, which are off, and where the config lives. Mention `/anchorwatch:allow` for changes and `/anchorwatch:check <command>` for dry runs.
