---
title: "Claude Code --dangerously-skip-permissions: what it actually disables and safer alternatives"
description: The flag turns off permission prompts and the protected-path checks, but not deny rules, ask rules or the critical-path circuit breaker — and there are three narrower settings that get you most of the same speed.
date: 2026-09-13
updated: 2026-09-13
---
# Claude Code --dangerously-skip-permissions

`--dangerously-skip-permissions` is the flag people reach for when the approval prompts get tiring, usually after the third time in an hour that Claude Code stops to ask about a build command. It is exactly equivalent to `--permission-mode bypassPermissions`, and the documentation describes it as disabling "permission prompts and safety checks so tool calls execute immediately, including writes to [protected paths](https://code.claude.com/docs/en/permission-modes#protected-paths)".

What it does *not* switch off is the more useful half of the story, because that half is what you can keep while still getting rid of the prompts.

## What the flag actually turns off

Three things stop applying:

- **Permission prompts.** Nothing pauses for approval.
- **Allow rules.** Your `permissions.allow` list becomes dead weight — the docs are explicit that "Allow rules have no effect in `bypassPermissions`". There is nothing left for them to pre-approve.
- **The protected-path check.** Normally a write to `.git`, `.claude`, `.vscode`, `.husky`, `.devcontainer`, `.bashrc`, `.zshrc`, `.npmrc`, `.envrc`, `.mcp.json`, `.pre-commit-config.yaml` and a few dozen similar paths is never auto-approved, in any mode, and `permissions.allow` cannot pre-approve it either. In `bypassPermissions` those writes are simply allowed. This is the part people underestimate: the flag lets the agent rewrite its own settings, your shell startup files and your git hooks without a word.

## What it does not turn off

Four checks survive, and they are the ones worth building on:

- **Deny rules.** "Deny rules block in every mode, including `bypassPermissions`." A `deny` list is the only permission rule that still means something behind this flag.
- **Ask rules.** An explicit ask rule still forces a prompt. Under `-p`, where there is nobody to prompt, the call is denied instead.
- **The critical-path circuit breaker.** `rm` and `rmdir` against the filesystem root, a top-level directory, your home directory, your working directory or its parents still prompt — in `bypassPermissions` mode as in every other. No allow rule and no `PreToolUse` hook returning `"allow"` can approve one. Hiding it inside `$(...)`, backticks or `<(...)` does not skip the check, and `rm -rf "$DIR"/*` counts because an empty variable turns it into a removal from `/`.
- **Tools that require a human.** `AskUserQuestion`, MCP tools marked `requiresUserInteraction`, and connector tools your organisation set to `ask`.

Hooks also still see the session: the `permission_mode` field a hook receives lists `"bypassPermissions"` as one of its values, and the critical-path rule is written in terms of what a `PreToolUse` hook may and may not approve, which only makes sense if hooks are still consulted. The docs stop short of a blanket "hooks always run" guarantee, so treat that as strongly implied rather than stated.

## The guardrails at launch

Claude Code puts three gates in front of the flag before it does anything at all.

The first time you use it interactively you get a dialog asking you to accept responsibility; accept once and it is saved to user settings. Headless runs show no dialog, and a `--bg` background session is refused until you have accepted it interactively somewhere.

On Linux and macOS it refuses to start as root or under `sudo`. Tested on Claude Code 2.1.270 in a root container, both spellings of the flag produce the same line on stderr and exit without running anything:

```text
--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons
```

`--permission-mode bypassPermissions` prints that same message, naming the other flag — which is the clearest confirmation you will get that they are one mode. The check is skipped inside a recognised sandbox, which is why the official dev container works: it runs Claude Code as a non-root user.

The third gate is `--restricted` (Claude Code v2.1.248 or later), which refuses bypass outright:

```text
Error: bypassPermissions not supported in restricted mode
```

Organisations can close the door for everyone with `permissions.disableBypassPermissionsMode` in managed settings, which nothing lower in the precedence chain can override. Claude Code on the web also ignores `defaultMode: "bypassPermissions"` from settings files, so a checked-in repository setting cannot start a cloud session in bypass mode.

## The safer alternatives, in order of how much you give up

**For CI and any unattended run: `dontAsk` plus an allowlist.** `dontAsk` auto-denies anything that would have prompted, instead of auto-approving it. Reads inside your working directories, the built-in read-only Bash commands, your `permissions.allow` rules and anything a `PreToolUse` hook approves still run. The session never waits for input, which is the actual property you wanted from `-p --dangerously-skip-permissions` — but a mistake ends in a denial rather than a deleted directory.

Tested on Claude Code 2.1.270:

```bash
mkdir -p ciwdemo/.claude && cd ciwdemo
cat > .claude/settings.json <<'JSON'
{ "permissions": { "deny": ["Bash(curl *)"] } }
JSON
claude -p "Run: echo hello. Then run: curl -sS https://example.com. Report what happened to each." \
  --permission-mode dontAsk --allowedTools "Bash(echo *)" < /dev/null
```

Claude's report came back:

> 1. `echo hello` — ran successfully, output: `hello`
> 2. `curl -sS https://example.com` — you denied permission for this command, so it did not run.

Note the argument order. `--allowedTools` is variadic, so putting the prompt after it makes the prompt another allowlist entry and you get `Error: Input must be provided either through stdin or as a prompt argument when using --print`. Put the prompt first.

**For local work: the Bash sandbox in auto-allow mode.** Turn it on with `/sandbox` or `sandbox.enabled: true`, on macOS, Linux or WSL2. Sandboxable commands run without asking; the OS enforces the filesystem and network boundary for the command and its children. Deny rules are still respected, content-scoped ask rules like `Bash(git push *)` still prompt, and critical-path removals still go through the normal flow. This removes most prompts without removing the enforcement.

**For a mode that still judges: auto mode.** A classifier model reviews actions instead of you, blocking anything that escalates beyond your request or targets infrastructure the task never mentioned. Explicit ask rules still prompt.

**If you keep the flag anyway:** run it in a container or VM as a non-root user, and remember that your `deny` list and your hooks are the only rules left doing work. That is the shape worth writing down — a deny list for the paths nothing should ever touch, and `PreToolUse` hooks for the judgements a glob cannot express. [Anchorwatch](/) is a maintained set of those hooks with tests, if you would rather not rebuild them after each incident.

## The honest summary

The flag is not "skip the annoying prompts". It is "skip the prompts *and* let the agent write to `.git`, `.claude` and your shell profile". For the unattended case that motivates most of its use, `--permission-mode dontAsk` with an explicit `--allowedTools` list gets you the same never-blocks behaviour with the failure mode inverted. If you want the full picture of the rules that survive it, start with [permissions explained](/guides/claude-code-permissions-explained); for the hook shapes that enforce what rules cannot, see the [hooks guide](/guides/claude-code-hooks-guide).

Verified against the Claude Code documentation on 2026-09-13 (`permission-modes`, `permissions`, `cli-reference`, `settings-reference`, `sandboxing`, `hooks`); commands run on Claude Code 2.1.270.
