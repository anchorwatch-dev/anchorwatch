---
title: "Claude Code hooks: the practical guide (2026)"
description: Every hook event, what JSON your script receives, how to block a tool call with exit codes or a JSON decision, matchers, hook types, and a copy-paste guardrail — with the mistakes that bite.
date: 2026-09-06
updated: 2026-09-14
---
# Claude Code hooks: the practical guide

Hooks are shell commands (or prompts, HTTP calls, MCP tools, or agents) that Claude Code runs at fixed points in a session. Unlike instructions in `CLAUDE.md`, which the model may or may not follow, hooks run every time. If a behaviour must be guaranteed — format after every edit, refuse to touch `.env`, never force-push `main` — it belongs in a hook.

Everything below was re-checked against the current hooks documentation and run on Claude Code 2.1.270.

## Where hooks live
- `~/.claude/settings.json` — all your projects.
- `.claude/settings.json` — one project, committed and shared.
- `.claude/settings.local.json` — one project, not committed.
- Managed policy settings — organisation-wide, admin-controlled.
- A plugin's `hooks/hooks.json` — active wherever the plugin is enabled.
- Skill and subagent frontmatter — a skill's hooks last for the rest of the session once it is invoked; a subagent's last while that agent runs.

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

`/hooks` lists everything currently loaded, grouped by event, with the source file for each — the fastest way to find out whether the file you just edited is actually in play. `"disableAllHooks": true` in a settings file turns them off for that scope.

## The events that matter most

| Event | Fires | Can block? |
|---|---|---|
| `PreToolUse` | before a tool call (Bash, Edit, Write, Read, MCP tools…) | **yes** |
| `PostToolUse` | after a tool call succeeds | no (tool already ran) |
| `PostToolUseFailure` | after a tool call fails | no |
| `UserPromptSubmit` | before Claude sees your prompt | yes |
| `Stop` | when Claude finishes a turn | yes (forces it to continue) |
| `SessionStart` | new/resumed/cleared/compacted session (matcher: `startup`, `resume`, `clear`, `compact`, `fork`) | no |
| `SessionEnd` | session ends (matcher: `clear`, `resume`, `logout`, `prompt_input_exit`, `other`) | no |
| `PermissionRequest` | Claude Code is about to show you a permission prompt | decides, via its own output shape |
| `PreCompact` / `PostCompact` | around context compaction | no |
| `SubagentStart` / `SubagentStop` | subagent lifecycle | SubagentStop: yes |
| `Notification` | Claude Code notifies you (permission prompt, idle…) | no |
| `FileChanged`, `ConfigChange`, `PreModelSwitch`, `TaskCompleted`… | newer, specialised events | some |

There are around thirty events in total; these are the ones most guardrails use. Note that `Stop` fires whenever Claude finishes responding, not only when a task is done, and not on interrupts.

## What your script receives
JSON on stdin. Always present: `session_id`, `transcript_path`, `cwd`, `hook_event_name`; recent versions also send `prompt_id`, `scratchpad_dir`, `permission_mode` and `effort`. Tool events add `tool_name`, `tool_input` (for Bash: `command`, `description`; for Edit/Write: `file_path`, `content`/`new_string`) and `tool_use_id`; `PostToolUse` adds `tool_response` and `duration_ms`.

Parse it with `jq`:

```bash
CMD=$(jq -r '.tool_input.command // empty')
```

Don't `echo $1` — in the usual shell form there are no positional arguments. (Adding `"args": []` switches to exec form, which runs your script directly with no shell, and is the cleanest fix for quoting problems.)

## Blocking a tool call
Two ways. **Exit code 2**: whatever you print to stderr is shown to Claude and the call is blocked. **Exit 0 with JSON on stdout**, which lets you give a structured reason:

```bash
jq -n --arg r "Force push to main is not allowed. Push to a feature branch." '{
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $r }
}'
```

On `PreToolUse`, `permissionDecision` can also be `"allow"` (skips the interactive prompt — dangerous, be specific) or `"ask"` (prompt as normal). `updatedInput` rewrites the tool input, e.g. turning `git push --force` into `git push --force-with-lease`. `additionalContext` appends text to what Claude sees *without* blocking — ideal for warnings. Other events use other shapes: `PostToolUse` and `Stop` take a top-level `decision: "block"`, and `PermissionRequest` uses `hookSpecificOutput.decision.behavior`.

Exit codes other than 0 and 2 are not a reliable way to block. If stdout holds a valid decision object, that JSON decides and the exit code is ignored; otherwise the call proceeds as a non-blocking error. A hook that hits its `timeout` is cancelled and its output discarded, so it renders no decision at all — a guard with a 600-second default that hangs is a guard that silently isn't there. Set `"timeout"` low (5–10 s) on anything in the blocking path.

## Hooks versus permission modes
This is the property that makes hooks worth the effort: `PreToolUse` hooks run *before* the permission-mode check, in every mode. A hook that returns `permissionDecision: "deny"` still blocks the call under `dontAsk`, under `bypassPermissions`, and under [`--dangerously-skip-permissions`](/guides/claude-code-dangerously-skip-permissions). Running the guard below in `dontAsk` mode on 2.1.270, the force push was rejected before the remote was touched.

The reverse does not hold. An `"allow"` decision does not override a `deny` rule in settings. Hooks tighten; they never loosen. For what the rules themselves can express, see [permissions explained](/guides/claude-code-permissions-explained).

## Matchers
For tool events the matcher is tested against the tool name: `"Bash"`, `"Edit|Write"`, a regex like `"^Notebook"`, or MCP tools as `mcp__server__tool` (`"mcp__github__.*"` for a whole server). For `SessionStart` it is the trigger (`startup|resume`). Omit it to match everything. A value containing only letters, digits, `_`, `-`, space, comma and `|` is treated as a name or list; anything else is a JavaScript regex, unanchored unless you write `^` and `$`. Matching is case-sensitive. Comma-separated alternatives need 2.1.191+, hyphens in plain names 2.1.195+.

For finer control, `if` filters a single handler using permission-rule syntax — `"Bash(git *)"`, `"Edit(*.ts)"` — so the process only spawns on a real match. It works on tool events only; adding it elsewhere stops the hook running at all.

## Hook types
- `command` — a shell command (`args` for exec form, `async` to run in background, `statusMessage` for the spinner text). Default timeout 10 minutes.
- `prompt` — a model evaluates the event JSON, with `$ARGUMENTS` as the placeholder (30 s).
- `agent` — a small subagent with Read/Grep/Glob verifies something (60 s, experimental).
- `http` — POST the event JSON to a URL.
- `mcp_tool` — call a tool on a connected MCP server.

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

Register it under `PreToolUse` with matcher `Bash`, `chmod +x`, and run `/hooks` to confirm it's loaded. Test it without burning a session:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' | ./no-force-main.sh
```

## Mistakes that bite
1. **Putting the decision at the top level.** `permissionDecision` must sit inside `hookSpecificOutput`. Move it up one level and the JSON still parses, the field is silently ignored, and nothing blocks — in the test above the force push went through with no error anywhere. `claude --debug` logs `Hook JSON output had unrecognized keys`.
2. **Checking only the start of the command.** `cd x && rm -rf /` passes a `^rm` regex. Split on `;`, `&&`, `||`, `|` and check each part.
3. **Two hooks rewriting the same input.** Hooks run in parallel; with several `updatedInput` results the last to finish wins, and the order is not deterministic. Let one hook own each tool.
4. **Slow hooks on every edit.** A formatter that takes 4 s runs on every Write, and a hook that overruns its timeout is discarded entirely. Prefer file-scoped work and a short timeout.
5. **Forgetting `${CLAUDE_PROJECT_DIR}`.** Hooks run with the session's cwd, which can change; build absolute paths from the variable.
6. **Putting rules in CLAUDE.md that should be hooks.** "Always run tests before finishing" is a `Stop` hook. "Never touch .env" is a `PreToolUse` guard.

## Or install the maintained version
[Anchorwatch](/docs/install/) packages 24 of these rules — destructive shell and git commands, SQL wipes, `curl | sh`, secret files, credential scanning — as one plugin with tests, three parser fallbacks, and per-project config. Read its [rules](/docs/rules/) to see what a hardened guard actually checks.
