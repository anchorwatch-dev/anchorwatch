---
title: "How to stop Claude Code from running rm -rf, force pushes and DROP TABLE"
description: The destructive commands agents actually run by accident, why deny-lists in settings.json are not enough, and a hook-based guardrail that blocks them with a reason the model can act on.
date: 2026-09-06
updated: 2026-09-06
---
# How to stop Claude Code from running destructive commands

Agentic coding tools fail in a specific way: not maliciously, but *confidently*. The model decides the fastest way to "clean up" is `git reset --hard`; the test database is in the way so `DROP TABLE`; the branch diverged so `git push --force origin main`. Each is a single tool call away, and each is hard or impossible to undo.

## What actually goes wrong
From public post-mortems and our own testing, the recurring offenders are:

- **Recursive delete of the wrong path** — `rm -rf ./` from the wrong cwd, `rm -rf "$DIR/"` with `$DIR` unset, `rm -rf *` in the project root.
- **Force pushes to shared branches** — usually after a rebase, "to make the remote match".
- **Local history destruction** — `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git stash drop` — losing *your* uncommitted work, not the model's.
- **Database statements without a WHERE** — `DELETE FROM users`, `TRUNCATE`, or a migration reset against the wrong environment.
- **`curl … | sh`** — because an install page said so.
- **Publishing** — `npm publish`, `gh release create`, `terraform apply` executed as a "final step" nobody asked for.

## Why `deny` rules aren't enough
Claude Code's permission rules (`"deny": ["Bash(rm -rf *)"]`) are a good first layer, but they match on prefixes and can't reason about context: they can't tell `rm -rf ./dist` from `rm -rf /`, or a force push to `feature/x` from one to `main`, or `DELETE FROM t WHERE id=1` from `DELETE FROM t`. Setting them broadly makes Claude ask for permission constantly; setting them narrowly leaves gaps. And a denied call gives the model no explanation, so it often just tries a variation.

## The hook approach
A `PreToolUse` hook on `Bash` sees the full command before it runs and can return a **decision with a reason**. That reason is shown to Claude, which changes its behaviour: instead of retrying, it explains the block to you and proposes the safe path. The essential design points:

1. **Split compound commands** on `;`, `&&`, `||`, `|` and check every segment.
2. **Classify targets, not just verbs.** `rm -rf` is fine on `node_modules`, fatal on `.`, `~`, `/`, `*`, `..`, or the project root.
3. **Know the branch.** Read the refspec from the command or `git rev-parse --abbrev-ref HEAD` in the session's cwd, and compare against a protected list.
4. **Two levels.** Block the catastrophic; warn on the merely risky (`sudo`, `npm publish`, `rm -rf build`) by adding context instead of denying, so the model stays useful.
5. **Fail open on your own bugs.** A guard that crashes must not block legitimate work.
6. **Tell the model not to bypass.** A `SessionStart` line — "if a call is denied by the guard, explain it to the user and never try to work around it" — measurably reduces creative workarounds.

## What it looks like in practice

```
$ git push --force origin main
✗ Anchorwatch blocked this: force push to protected branch 'main'. Push to a
  feature branch and open a PR instead; if history on 'main' truly must be
  rewritten, the user should run it themselves. Rule: git-force-push-protected
```

Claude then says something like: *"The force push to main was blocked by a guardrail. I've pushed the rebased commits to `fix/auth-retry` instead — want me to open a PR?"* That is exactly the behaviour you want.

## Install it
[Anchorwatch](/) is that guard, packaged as a Claude Code plugin with 24 rules, tests for every rule, and a per-project `.anchorwatch.json` for the cases where you *do* want `rm -rf ./dist` to pass silently:

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch
claude plugin install anchorwatch@anchorwatch
```

Then `/anchorwatch:check git reset --hard` to see it in action without running anything. The [rules reference](/docs/rules/) lists every pattern.

## Defence in depth
Guardrails inspect command strings; a sufficiently creative command (`bash -c "$(base64 -d …)"`) can slip through. Keep the other layers too: work in a container or Claude Code's sandbox mode for risky tasks, keep `main` protected on GitHub so a force push fails server-side, use a scratch database for agent sessions, and keep backups you've actually restored from. The guard's job is to make accidents rare and bypasses deliberate — not to be the only thing standing between the model and your data.
