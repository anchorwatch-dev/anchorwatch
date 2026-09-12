---
name: allow
description: Configure Anchorwatch — change a rule's level (block/warn/off), add an allow pattern, or set protected branches by editing .anchorwatch.json. Use when a guardrail is too strict or too loose for this project.
argument-hint: <rule=level | pattern | branches...>
disable-model-invocation: true
---

The user wants to adjust Anchorwatch guardrails: **$ARGUMENTS**

Anchorwatch reads `.anchorwatch.json` from the project root (nearest ancestor of the working directory), falling back to `~/.anchorwatch.json`. Schema:

```json
{
  "rules": { "<rule-id>": "block" | "warn" | "off" },
  "allow": ["<ERE regex matched against the full command or file path>"],
  "protectedBranches": ["main", "master", "production"]
}
```

Rule ids (run `bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" rules` for the full table with defaults):
`rm-recursive-dangerous`, `rm-recursive`, `git-force-push-protected`, `git-force-push`, `git-push-delete`, `git-destructive`, `sql-destructive`, `pipe-to-shell`, `disk-destroy`, `perm-broad`, `env-read`, `secret-write`, `env-dump`, `publish`, `sudo`, `kill-broad`, `system-config`, `secret-files`, `git-internals`, `lockfiles`, `self-config`, `infra-files`, `outside-project`, `secret-read`, `secret-scan`.

Procedure:
1. Read the existing `.anchorwatch.json` if present (create it at the project root otherwise).
2. Apply the requested change. Prefer the narrowest change: an `allow` pattern for one specific command beats turning a rule off. Never set a `block` rule to `off` without telling the user what protection they lose.
3. Write the file with valid JSON and show the user the diff.
4. Confirm by running `bash "${CLAUDE_PLUGIN_ROOT}/scripts/aw.sh" status`.

Emergency kill switch (session-wide): the user can set `ANCHORWATCH_DISABLE=1` in their environment. Do not set this yourself.
