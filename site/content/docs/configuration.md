---
title: Configuration
description: Tune Anchorwatch per project with .anchorwatch.json — rule levels, allow patterns, protected branches, and the kill switch.
---
# Configuration

Anchorwatch ships with sensible defaults and needs no configuration. When a rule doesn't fit a project, adjust it in `.anchorwatch.json`.

## Where the file lives
Anchorwatch looks for `.anchorwatch.json` starting at the working directory and walking up to the filesystem root, then falls back to `~/.anchorwatch.json`. The first file found wins (there is no merging), so a project file completely overrides your user file.

## Schema

```json
{
  "rules": {
    "git-destructive": "warn",
    "publish": "off"
  },
  "allow": [
    "^rm -rf \\./?(dist|build|\\.next)/?$",
    "^git clean -n"
  ],
  "protectedBranches": ["main", "release/*"]
}
```

- **rules** — map of rule id → `block`, `warn`, or `off`. See the [rules reference](/docs/rules/) for ids and defaults. `block` denies the tool call with a reason Claude can read; `warn` lets it proceed but injects a warning into Claude's context; `off` disables the rule.
- **allow** — array of POSIX extended regular expressions. Each is tested against the *full* command (for Bash rules) or the file path (for file rules). If any matches, all rules are skipped for that call. Keep patterns anchored and specific.
- **protectedBranches** — branch names that make a force push a `block` instead of a `warn`. Default: `main`, `master`, `production`, `prod`, `release`. Exact names only (no globs yet).

## Using the skill
Rather than editing JSON by hand you can tell Claude:

```
/anchorwatch:allow git-destructive=warn
/anchorwatch:allow allow rm -rf ./dist
```

Claude edits the file and shows you the diff. Note that Anchorwatch flags edits to `.anchorwatch.json` itself with a warning (rule `self-config`), which is intentional: the model shouldn't loosen its own guardrails without you noticing.

## Kill switch
Set `ANCHORWATCH_DISABLE=1` in the environment where Claude Code runs to bypass every rule for that session. Useful in throwaway containers; don't leave it on.

## Recommendations
- Leave every `block` rule alone unless you have a specific, recurring false positive — then add a narrow `allow` pattern for that exact command.
- Lower `env-read` to `warn` only if your `.env` files hold no real secrets (e.g. docker-compose local defaults). The same caveat applies to `secret-write`: lower it and a shell command may write your `.env` in place.
- If a setup script genuinely needs to generate a key or seed an `.env` from a template, prefer a narrow `allow` pattern (`"^bash scripts/bootstrap-env\\.sh$"`) over turning `secret-write` off.
- Set `publish` to `block` in repos where a deploy from a Claude session must never happen without a human.
- Commit the project `.anchorwatch.json` so the whole team shares the same rules.
