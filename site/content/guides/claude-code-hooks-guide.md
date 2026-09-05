---
title: "Claude Code hooks: the practical guide (2026)"
description: Every hook event, what JSON your script receives, how to block a tool call with exit codes or a JSON decision, matchers, hook types, and a copy-paste guardrail — with the mistakes that bite.
date: 2026-09-06
updated: 2026-09-06
---
# Claude Code hooks: the practical guide

Hooks are shell commands (or prompts, HTTP calls, MCP tools, or agents) that Claude Code runs at fixed points in a session. Unlike instructions in `CLAUDE.md`, which the model may or may not follow, hooks run every time. If a behaviour must be guaranteed — format after every edit, refuse to touch `.env`, never force-push `main` — it belongs in a hook.

## Where hooks live
- `~/.claude/settings.json` — all your projects.
- `.claude/settings.json` — one project, committed and shared.
- `.claude/settings.local.json` — one project, not committed.
- A plugin's `hooks/hooks.json` — active wherever the plugin is enabled. This is how [Anchorwatch](/) ships its guardrails.
- Skill and subagent frontmatter — scoped to that skill's turn or that agent.

The shape is the same everywhere:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [ { "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.sh\"", "timeout": 10 } ] }
    ]
  }
}
```

## The events that matter most

| Event | Fires | Can block? |
|---|---|---|
| `PreToolUse` | before a tool call (Bash, Edit, Write, Read, MCP tools…) | **yes** |
| `PostToolUse` | after a tool call succeeds | no (tool already ran) |
| `PostToolUseFailure` | after a tool call fails | no |
| `UserPromptSubmit` | before Claude sees your prompt | yes |
| `Stop` | when Claude finishes a turn | yes (forces it to continue) |
| `SessionStart` | new/resumed/cleared/compacted session (matcher: `startup`, `resume`, `clear`, `compact`, `fork`) | no |
| `PreCompact` / `PostCompact` | around context compaction | no |
| `SubagentStart` / `SubagentStop` | subagent lifecycle | Stop: yes |
| `PermissionRequest` | a tool call needs a permission decision | can allow/deny |
| `Notification` | Claude Code notifies you (permission prompt, idle…) | no |
| `FileChanged`, `ConfigChange`, `PreModelSwitch`, `TaskCompleted`… | newer, specialised events | some |

## What your script receives
JSON on stdin. Always present: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. Tool events add `tool_name`, `tool_input` (for Bash: `command`, `description`; for Edit/Write: `file_path`, `content`/`new_string`), and `tool_use_id`; `PostToolUse` adds `tool_response`.

Parse it with `jq`:

```bash
CMD=$(jq -r '.tool_input.command // empty')
```

Don't `echo $1` — there are no positional arguments.

## Blocking a tool call
Two ways. **Exit code 2**: whatever you print to stderr is shown to Claude and the call is blocked. **Exit 0 with JSON on stdout**, which lets you give a structured reason:

```bash
jq -n --arg r "Force push to main is not allowed. Push to a feature branch." '{
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $r }
}'
```

`permissionDecision` can also be `"allow"` (skips the permission prompt — dangerous, be specific) or `"ask"`. `updatedInput` lets you rewrite the tool input, e.g. turn `git push --force` into `git push --force-with-lease`. `additionalContext` appends text to what Claude sees *without* blocking — ideal for warnings.

Any other non-zero exit is a non-blocking error; the call proceeds. So does a timeout (default 600 s, 30 s for some events; set `"timeout"` low for guards).

## Matchers
The matcher is tested against the tool name for tool events: `"Bash"`, `"Edit|Write"`, a regex like `"^Notebook"`, or MCP tools as `mcp__server__tool` (`"mcp__github__.*"` for all of one server). For `SessionStart` the matcher is the trigger (`startup|resume`). Omit it to match everything. Since 2.1.19x you can also separate with commas and use hyphens.

## Hook types
- `command` — a shell command (add `"args": [...]` to skip the shell).
- `prompt` — an LLM evaluates the JSON with a prompt and returns the decision (slower, but can judge intent).
- `agent` — a small subagent with tools verifies something (experimental).
- `http` — POST the event JSON to a URL.
- `mcp_tool` — call a tool on a configured MCP server.

Command hooks are the right default for guardrails: deterministic, fast, testable.

## A minimal guardrail

`.claude/hooks/no-force-main.sh`:

```bash
#!/usr/bin/env bash
CMD=$(jq -r '.tool_input.command // empty')
if printf '%s' "$CMD" | grep -Eq 'git push .*(--force|-f)( |$)' && printf '%s' "$CMD" | grep -Eq ' (main|master)( |$)'; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Force push to main/master is blocked. Use a feature branch."}}'
fi
exit 0
```

Register it under `PreToolUse` with matcher `Bash`, `chmod +x`, and run `/hooks` to confirm it's loaded.

## Mistakes that bite
1. **Checking only the start of the command.** `cd x && rm -rf /` passes a `^rm` regex. Split on `;`, `&&`, `||`, `|` and check each part.
2. **Blocking on your own errors.** If `jq` is missing your script prints nothing and exits 0 — fine — but a `set -e` script that dies with exit 1 is treated as non-blocking anyway. Never exit 2 unless you *mean* to block.
3. **Slow hooks on every edit.** A formatter that takes 4 s runs on every Write. Prefer file-scoped formatting and a short timeout.
4. **Forgetting `${CLAUDE_PROJECT_DIR}`.** Hooks run with the cwd of the session, which can change; use absolute paths built from the variable.
5. **Putting rules in CLAUDE.md that should be hooks.** "Always run tests before finishing" is a `Stop` hook. "Never touch .env" is a `PreToolUse` guard.

## Or install the maintained version
[Anchorwatch](/docs/install/) packages 24 of these rules — destructive shell and git commands, SQL wipes, `curl | sh`, secret files, credential scanning — as one plugin with tests, three parser fallbacks, and per-project config. Read its [rules](/docs/rules/) to see what a hardened guard actually checks.
