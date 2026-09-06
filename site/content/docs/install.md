---
title: Install Anchorwatch
description: Add the Anchorwatch marketplace, install the plugin, and verify it in 30 seconds — macOS, Linux, Windows.
---
# Install

## Requirements
- Claude Code 2.1 or newer recommended. On 2.0.x the rules still block (verified on 2.0.53), but the reason is shown as a permission prompt instead of an explanation Claude can act on.
- `bash` (on Windows, Claude Code runs hooks through Git Bash — install Git for Windows if you haven't).
- One JSON parser: `jq` (recommended — `brew install jq` / `apt install jq`), or `node`, or `python3`. Anchorwatch picks whichever is present.

## Install from the terminal

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch
claude plugin install anchorwatch@anchorwatch
```

Or inside a Claude Code session:

```
/plugin marketplace add anchorwatch-dev/anchorwatch
/plugin install anchorwatch@anchorwatch
```

Start a new session (or run `/reload-plugins`). You should see a line like *"Anchorwatch guardrails active (v0.1.0): 11 blocking, 13 warning rules"* in Claude's context at session start.

## Verify

```
/anchorwatch:doctor
```

This checks the tools, finds your config, and confirms that `git push --force origin main` is denied while `ls -la` passes. Try a dry run yourself:

```
/anchorwatch:check rm -rf ./build
```

## Scope
Plugins install at user scope by default, so Anchorwatch protects every project. To enable it for a repo and all its contributors instead, install with `--scope project` — Claude Code records it in `.claude/settings.json`, and teammates get prompted to install it when they open the repo.

## Update
Claude Code refreshes marketplaces in the background once per session. To force it: `/plugin marketplace update anchorwatch`, then `/plugin update anchorwatch@anchorwatch`. Release notes are on the [changelog](/changelog/).

## Uninstall
`claude plugin uninstall anchorwatch@anchorwatch`. Your `.anchorwatch.json` files are left in place.
