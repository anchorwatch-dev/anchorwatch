---
title: "Claude Code in CI: running headless with -p safely"
description: A headless run has nobody to answer prompts, so it trusts the repository's hooks automatically while ignoring the repository's allow rules — here is what that inversion costs and the four flags that close it.
date: 2026-09-15
updated: 2026-09-15
---
# Claude Code in CI: running headless with `-p`

Putting `claude -p "..."` in a CI job looks like the same session you run locally with the terminal removed. It is not. Removing the human removes the one component that was answering permission prompts, and Claude Code compensates in two directions at once: some repository content that normally waits for your approval now runs immediately, and some repository configuration that normally protects you is quietly dropped. Both changes are documented, and neither is obvious from the flag.

This guide covers what actually changes, the four flags that control it, and how to tell from a job's output whether the run did what you asked. Commands were run on Claude Code 2.1.272.

## The trust inversion

Claude Code shows its workspace trust dialog in interactive sessions only. The documentation is direct about what `-p` does instead: a headless or SDK session "never shows it", and that counts as accepted for some kinds of repository content but not others.

The split is worth memorising, because it runs the wrong way round from most people's intuition:

- **Hooks in the project's settings files run.** So do the `env` block, helper commands such as `apiKeyHelper`, and a project skill's `allowed-tools`.
- **Servers in the project's `.mcp.json` connect without asking**, approved or not.
- **The project's `permissions.allow` rules and `additionalDirectories` are *not* applied.** Claude Code prints a warning to stderr and carries on.

So the executable content in a repository you have never opened runs, and the restrictions that repository wrote for itself do not. Here is that asymmetry in a scratch repo whose `.claude/settings.json` contains one `SessionStart` hook, one allow rule and one deny rule:

```bash
mkdir -p citest/.claude && cd citest && git init -q
cat > .claude/settings.json <<'JSON'
{
  "permissions": {
    "allow": ["Bash(curl *)"],
    "deny": ["Read(secrets/**)"]
  },
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "echo REPO-HOOK-RAN >> /tmp/evidence.txt" } ] }
    ]
  }
}
JSON
mkdir -p secrets && echo "TOKEN=abc123" > secrets/prod.env
claude -p "Reply with exactly: OK" --permission-mode dontAsk < /dev/null
```

Exit code 0, `OK` on stdout, and on stderr:

```text
Ignoring 1 permissions.allow entry from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["/abs/path/citest"].hasTrustDialogAccepted: true in /root/.claude.json.
```

`/tmp/evidence.txt` now contains `REPO-HOOK-RAN`. The allow rule was discarded; the hook executed.

One piece of good news from the same test: **deny rules survive**. Asking the same session to read `secrets/prod.env` came back with "access to that path is blocked by permission settings". Workspace trust gates allow rules, not deny rules — which means a checked-in deny list is the one part of a repository's permission config you can rely on in CI.

## Four flags, and what each gives up

| Flag | Stops | Keeps |
|---|---|---|
| `--setting-sources user` | project settings *and* `.mcp.json` entirely | nothing from the repo |
| `--bare` | hooks, skills, commands, subagents, plugins, `.mcp.json`, `CLAUDE.md` | the `env` block and helpers such as `awsAuthRefresh` |
| `--settings '{"disableAllHooks": true}'` | hooks only | the repo's deny rules |
| `disabledMcpjsonServers` | one named MCP server | everything else |

Tested, in the same repo: `--setting-sources user` stopped the hook and removed the stderr warning, because the project settings were never read — and with them went the deny rule. `--settings '{"disableAllHooks": true}'` stopped the hook while the warning stayed, confirming project settings were still being read, so the deny rule was still in force. That second form is the surgical one for a repository you half-trust: no hooks, but the checked-in deny list still applies. It has to be passed on the command line rather than set in your user settings, because project settings take precedence over user settings and can set it back to `false`.

`--bare` is what the documentation recommends for scripted calls and expects to become the `-p` default eventually. Be ready for one consequence: bare mode "never reads OAuth credentials or the system keychain", so a container that was working from a subscription login needs `ANTHROPIC_API_KEY` set. In a container without one, `claude --bare -p` exited 1 with `Authentication error · This may be a temporary network issue, please try again` — printed on **stdout**, as the run's result, not on stderr. That is documented behaviour for failures inside a run, and it will fool a CI step that only greps stderr.

## Choose a mode that fails closed

Without a flag, a `-p` session starts in `default` mode, where anything needing approval has nobody to approve it. For an unattended run, say so explicitly with `--permission-mode dontAsk`: it auto-denies every call that would otherwise prompt, while reads inside the working directory, the built-in read-only command set and your `--allowedTools` entries still run. On v2.1.259 or later you can add `--permission-prompts none`, which also tells Claude not to retry a denied request.

This is the same reasoning that makes `--dangerously-skip-permissions` the wrong tool here, even though it also never blocks: [the flag inverts the failure mode](/guides/claude-code-dangerously-skip-permissions), turning a stuck job into a destructive one. If the rule syntax in `--allowedTools` is unfamiliar, [permissions explained](/guides/claude-code-permissions-explained) covers the matching behaviour it shares with `settings.json`.

## A denied tool call does not fail the job

This is the failure mode that costs real time. Run the locked-down shape end to end:

```bash
claude -p "Do two things, then report the outcome of each in one line: (1) read README.md, (2) run: curl -sS https://example.com" \
  --permission-mode dontAsk \
  --settings '{"disableAllHooks": true}' \
  --allowedTools "Read" \
  --output-format json < /dev/null
```

The read succeeded, the `curl` was denied — and the job exited **0**, with `is_error: false` and `subtype: "success"`. The only record of the denial is the `permission_denials` array in the JSON result:

```json
[
  { "tool_name": "Bash",     "tool_input": { "command": "curl -sS https://example.com" } },
  { "tool_name": "WebFetch", "tool_input": { "url": "https://example.com" } }
]
```

Two entries, not one: after Bash was denied, Claude tried to reach the same URL through `WebFetch`. A run that silently accomplishes half its task is a green build, so gate on that array yourself — `jq -e '.permission_denials | length == 0'` is the whole check. The same result object carries `total_cost_usd` (a client-side estimate, so treat it as a budget signal rather than an invoice) and `num_turns`.

Real non-zero exits do exist. `--max-turns 1` on the same prompt exited 1 with `is_error: true`, `subtype: "error_max_turns"` and no `result` field at all, so a parser that assumes `.result` is present will crash rather than report. A run stopped with SIGTERM exits 143, leaving its turn unfinished and recording no result.

Two more CI gates are worth wiring while you are in there. With `--output-format stream-json`, the `system/init` event carries `plugin_errors` and `mcp_server_errors`; both keys are omitted when empty, so failing on a non-empty array catches a plugin or MCP server that never loaded. A skipped MCP server otherwise prints a warning only to an interactive terminal — when a CI runner captures stderr, no warning appears at all.

## The GitHub Action inherits all of this

`anthropics/claude-code-action@v1` runs on the same engine, and its `claude_args` input "accepts any Claude Code CLI argument", so every flag above applies there too. Its `settings` input takes a JSON string, which is the natural home for a deny list. The Action also adds a gate the CLI has no equivalent for: on issue and pull request events the triggering user must have write access, and bot actors are rejected unless listed in `allowed_bots`.

## What this does not solve

Denials are not a boundary against a determined prompt; they are a boundary against a confused one. A Bash deny rule matches the command text Claude writes after wrapper-stripping, so it covers the invocation Claude usually produces and not every spelling of the same program. The durable version of a CI guardrail is a `PreToolUse` hook that inspects the call — see the [hooks guide](/guides/claude-code-hooks-guide) for the shapes, or [Anchorwatch](/) for a tested set.

And run the job in a container you can throw away. Every flag here narrows what a run can reach; none makes it reversible.

Verified against the Claude Code documentation on 2026-09-15 (`headless`, `permissions`, `permission-modes`, `cli-reference`, `settings`, `hooks`, `github-actions`); commands run on Claude Code 2.1.272.
