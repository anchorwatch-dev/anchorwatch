---
name: doctor
description: Verify the Anchorwatch installation — required tools (bash, grep, a JSON parser), config discovery, and a self-test that a dangerous command is denied.
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" *)
---

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" doctor
```

Report whether everything is OK. If the JSON parser is missing, tell the user to install `jq` (brew install jq / apt install jq). If the self-test failed, suggest running `/reload-plugins` and checking `/hooks`.
