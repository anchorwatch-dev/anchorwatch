---
title: "Claude Code permissions explained: allow, ask, deny, and settings.json examples"
description: How Claude Code decides whether a tool call runs — the three rule lists, the order they are evaluated in, the exact settings.json shapes, and the rules that quietly match less than you think.
date: 2026-09-11
updated: 2026-09-11
---
# Claude Code permissions explained

Every tool call Claude Code makes — a Bash command, a file edit, a web fetch, an MCP call — is checked against three lists you control: `allow`, `ask` and `deny`. They live under a `permissions` key in a `settings.json` file, and `/permissions` shows you the merged result plus the file each rule came from.

```json
{
  "permissions": {
    "allow": ["Bash(npm run build)", "Bash(git commit *)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./.env)", "Bash(rm *)"],
    "additionalDirectories": ["../shared-lib/"],
    "defaultMode": "acceptEdits"
  }
}
```

Allow rules run the tool without asking you. Ask rules force a prompt. Deny rules refuse the call outright.

## The order is deny, then ask, then allow

Rules are evaluated in that fixed order, and the first match decides. Specificity does not enter into it. A broad `Bash(aws *)` in `deny` blocks `aws s3 ls` even if you also wrote `Bash(aws s3 ls)` in `allow` — a deny rule cannot carry allowlist exceptions. The same holds between ask and allow: a matching ask rule prompts you even when a narrower allow rule also matches.

That order also holds *across* settings files: if your user settings allow something and the project denies it, the deny wins, and the reverse is true too. There is no "closer file wins" rule for permissions.

One asymmetry worth knowing: a bare tool name in `deny`, like `"Bash"` or `"Edit"`, removes the tool from Claude's context entirely — the model never sees that it exists. A scoped rule like `Bash(rm *)` leaves the tool available and blocks only the calls that match.

## Rule syntax

Rules are `Tool` or `Tool(specifier)`. Parentheses inside a specifier are literal, so `Edit(./Finance (2024)/**)` needs no escaping. `Bash(*)` is equivalent to bare `Bash`.

In Bash rules, `*` stands in for any text, including spaces. Three mechanics explain almost every surprise:

- **Everything before the first `*` is matched as written.** `Bash(git log *)` allows only `git log`; `Bash(git *)` allows every git subcommand, including `git -c core.fsmonitor=<script> diff`, which runs a program you name. Put the `*` *after* the subcommand.
- **A trailing ` *` also matches the bare command** — `Bash(ls *)` matches plain `ls` — but only when that `*` is the rule's only wildcard. `Bash(* --help *)` matches `npm --help x` and not `npm --help`.
- **The space before a trailing `*` is part of the rule.** `Bash(ls *)` does not match `lsof`. `Bash(ls*)` does.

The `:*` suffix is simply another spelling of a trailing ` *`, and it is recognised only at the end of a pattern. This one bites: `Bash(npm run test:*)` reads like "all my `test:` scripts", but it is identical to `Bash(npm run test *)`. Tested on Claude Code 2.1.268 with exactly that rule in `allow`, `npm run test` ran with no prompt and `npm run test:unit` still asked for approval.

## Bash rules match command text, not programs

Claude Code splits compound commands on `&&`, `||`, `;`, `|`, `|&`, `&` and newlines, and an allow rule must cover *every* subcommand — `Bash(safe-cmd *)` will not approve `safe-cmd && other-cmd`. Deny and ask rules go the other way: they fire if *any* subcommand matches, including inside a subshell, a command substitution or a `for` loop body.

A fixed set of wrappers is stripped before matching — `timeout`, `time`, `nice`, `nohup`, `stdbuf`, the builtins `command` and `builtin`, zsh's `noglob`, and bare `xargs` — so `Bash(npm test *)` also covers `timeout 30 npm test`. The list is not configurable, and it does not include environment runners like `npx`, `docker exec`, `mise exec` or `devbox run`. Because those execute their arguments, `Bash(devbox run *)` also approves `devbox run rm -rf .`.

A Bash rule matches the text the model wrote, so a deny rule stops the usual spelling and not the others:

| Deny rule | Stops | Doesn't stop |
|---|---|---|
| `Bash(rm *)` | `rm -rf build/` | `/bin/rm -rf build/`, `bash -c 'rm -rf build/'` |
| `Bash(git push *)` | `git push origin main` | `git -C . push origin main`, `git 'push' origin main` |
| `Bash(curl *)` | `curl https://example.com` | `sh -c 'curl https://example.com'` |

That is a floor against accidents, not a boundary against a determined path. For enforcement that does not depend on the command text, you want [sandboxing](https://code.claude.com/docs/en/sandboxing) or a `PreToolUse` hook — see the [hooks guide](/guides/claude-code-hooks-guide) for the JSON a hook returns to block a call.

## Read and Edit rules use gitignore patterns

Path rules take four anchor shapes, and the second row is where people go wrong:

| Pattern | Resolves to |
|---|---|
| `//path` | absolute, from the filesystem root |
| `~/path` | your home directory |
| `/path` | relative to the *settings source* — not the filesystem root |
| `path` or `./path` | relative to the current directory |

So `Read(/secrets/**)` written in `~/.claude/settings.json` guards `~/.claude/secrets/`, not your project's. For a rule in user settings that applies inside every project, use `//` or `~/`.

Depth differs by rule type for single-segment directory patterns: `Edit(src/**)` as an allow rule matches only `<cwd>/src`, while the same pattern in deny or ask also matches a nested `vendor/pkg/src`. Bare filenames follow gitignore semantics at any depth, so `Read(.env)` and `Read(**/.env)` are the same rule.

`Edit` rules cover every built-in file-editing tool. Rules written for `Write`, `NotebookEdit`, `Glob` or `MultiEdit` are accepted and then never consulted — use `Edit(docs/**)` and `Read(docs/**)` instead. A `Read` deny rule also blocks Edit and Write on that path, but not NotebookEdit, so add an `Edit` deny rule for paths nothing should change. There is more on this shape in [keeping secrets out of Claude Code](/guides/keep-secrets-out-of-claude-code).

## Where the rules live, and what beats what

Highest precedence first: managed settings your organisation deploys, then `--settings` on the command line, then `.claude/settings.local.json`, then the committed `.claude/settings.json`, then `~/.claude/settings.json`. Nothing overrides a managed rule — not `--allowedTools`, not a flag.

List keys such as `permissions.allow` **merge** across files rather than replacing each other, so every file can contribute rules. Combined with deny-first evaluation, that means a rule you add anywhere can only ever restrict more, never less.

One catch that produces a confusing silence: `permissions.allow` and `additionalDirectories` in a project's `.claude/settings.json` grant capability, so they are held until you accept the workspace trust dialog for that folder. In a `claude -p` run, which never shows the dialog, you get a line on stderr instead:

```
Ignoring 1 permissions.allow entry from .claude/settings.json: this workspace has not been trusted.
```

Deny and ask rules are unaffected — they only restrict, so they apply immediately.

## A tested example

```bash
mkdir -p permdemo/.claude permdemo/vault && cd permdemo
cat > .claude/settings.json <<'JSON'
{
  "permissions": {
    "allow": ["Bash(npm run build)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./vault/**)"]
  }
}
JSON
printf 'line one of the vault file\n' > vault/notes.txt
claude -p "Read the file vault/notes.txt and print its first line verbatim." < /dev/null
```

On Claude Code 2.1.268 the file is never opened. The exact wording varies between runs; both runs in testing came back with the same substance:

> I can't access that file — `vault/notes.txt` is in a directory blocked by your permission settings.

You will also see the untrusted-workspace line from the previous section, because the `allow` rule in a fresh folder is held and the `deny` rule is not. That is the whole model in one command.

## Startup warnings are worth reading

Claude Code validates your rules at startup and tells you when one will not do what it looks like it does. These four appeared verbatim in testing, and each marks a rule that is silently inert or dangerously wide:

```
Permission deny rule "Bash(command:rm *)" targets command as a raw string and will not match
  — use Bash(…) for Bash's own matcher.
Permission deny rule "Stop Task" matches no known tool — check for typos.
Permission allow rule: Write(docs/**) is not matched by file permission checks — only Edit(path)
  rules are. Use Edit(docs/**) instead.
Permission allow rule: Bash(git * main) has a wildcard before the rest of the command, so it also
  matches any options inserted at that position and approves them without a prompt.
```

The tool label shown in the transcript is not always the canonical name — `Stop Task` is really `TaskStop` — and rules match the canonical name only.

## Where permission rules stop

Permission rules are enforced by Claude Code, not by the model, which makes them stronger than anything you write in `CLAUDE.md`. But they match a spelling, not an intent, and they cannot see what a script does once it is running. A `PreToolUse` hook inspects the full command text with your own logic before the permission prompt; a sandbox enforces at the OS level. Most setups want a small deny list for the paths that must never be touched, plus one of those two for everything else. [Anchorwatch](/) is a maintained set of those hook rules with the tests that go with them, if you would rather not grow a deny list one incident at a time.
