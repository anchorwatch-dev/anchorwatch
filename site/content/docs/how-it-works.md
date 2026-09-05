---
title: How it works
description: The hook events Anchorwatch uses, how a deny decision reaches Claude, performance, and what Anchorwatch deliberately does not do.
---
# How it works

Anchorwatch is a Claude Code plugin made of five small bash scripts wired to hook events, plus five skills. No daemon, no network, no dependencies beyond bash and a JSON parser.

## Hooks

| Event | Matcher | Script | Purpose |
|---|---|---|---|
| `SessionStart` | `startup\|resume` | `session-brief.sh` | Tells Claude the guardrails are active, how many rules block/warn, where the config lives, and the git state. Also instructs it never to try to bypass a block. |
| `PreToolUse` | `Bash` | `guard-bash.sh` | Splits the command on `;`, `&&`, `\|\|`, `\|`, checks each segment against the Bash rules, returns a deny or accumulates warnings. |
| `PreToolUse` | `Edit\|Write\|MultiEdit\|NotebookEdit` | `guard-files.sh` | Checks the target path against the file rules. |
| `PreToolUse` | `Read` | `guard-read.sh` | Keeps secret-bearing files out of the transcript. |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `scan-secrets.sh` | Scans the content that was just written for credential patterns. |

Each script reads the hook's JSON from stdin, extracts what it needs (`tool_input.command`, `tool_input.file_path`, `cwd`, …), and writes a JSON decision to stdout:

```json
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Anchorwatch blocked this: … Rule: git-force-push-protected …"}}
```

A deny stops the tool call before it executes; the reason is shown to Claude, so it can explain the block and offer an alternative. Warnings use `additionalContext`, which is appended to what Claude sees without stopping the call. Scripts always exit 0 on their own errors — a broken parser or unreadable config never blocks your work, it just means that rule didn't run (`/anchorwatch:doctor` will tell you).

## Performance
Each hook is a bash process plus one parser invocation and a handful of `grep -E` calls: typically 10–40 ms with `jq`, a bit more with `node`. Hooks have a 10-second timeout, after which Claude Code proceeds as if the hook passed.

## Why hooks and not CLAUDE.md
Instructions in CLAUDE.md are advice the model usually follows. Hooks are enforcement that runs every time regardless of context length, model, or how the request was phrased. Anthropic's own guidance is the same: for things that must happen every time, use hooks.

## What Anchorwatch is not
- **Not a sandbox.** It inspects the command string. Something like `bash -c "$(echo cm0gLXJmIC8= | base64 -d)"` would get past the pattern match. Anchorwatch reduces accidents and makes bypass *deliberate and visible* — and tells Claude explicitly not to attempt it. For hard isolation use containers, Claude Code's sandbox mode, or a VM.
- **Not a permission system.** Claude Code's `allow`/`deny`/`ask` rules still apply and run alongside. Anchorwatch adds semantics those rules can't express (protected branches, `DELETE` without `WHERE`, secret patterns in content).
- **Not a policy engine for teams.** Anyone can edit `.anchorwatch.json` or set the kill switch. Managed-settings enforcement is on the roadmap for the Team tier.
