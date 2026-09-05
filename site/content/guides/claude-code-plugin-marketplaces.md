---
title: "Claude Code plugin marketplaces: install, private repos, and updates"
description: How marketplaces work, the marketplace.json format, installing from GitHub, using a private repository as a paid or team-only marketplace, version pinning, and how updates propagate.
date: 2026-09-06
updated: 2026-09-06
---
# Claude Code plugin marketplaces

A plugin is a directory with skills, agents, hooks, and MCP/LSP configs. A *marketplace* is a git repository (or local path) with a `.claude-plugin/marketplace.json` that lists plugins and where to fetch them. You add a marketplace once, then install and update plugins from it.

## Adding and installing

```bash
claude plugin marketplace add owner/repo          # GitHub shorthand
claude plugin marketplace add https://gitlab.com/team/plugins.git
claude plugin marketplace add ./local/marketplace  # for development
claude plugin install my-plugin@marketplace-name
```

The same works inside a session with `/plugin marketplace add …` and `/plugin install …`, or interactively through `/plugin`. Install at project scope (`--scope project`) to record it in `.claude/settings.json` so teammates are prompted to install it too.

## marketplace.json

```json
{
  "name": "anchorwatch",
  "owner": { "name": "Anchorwatch", "url": "https://anchorwatch.fly.dev" },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    { "name": "anchorwatch", "source": "./plugins/anchorwatch",
      "description": "Guardrails for Claude Code", "category": "security", "tags": ["hooks", "safety"] }
  ]
}
```

`source` can be a relative path inside the same repo, another GitHub repo (`{"source":"github","repo":"owner/repo","ref":"v2.0.0"}`), a git URL, a subdirectory of a repo, an npm package, a zip archive with a `sha256`, or even a command that prints the plugin path. Validate with `claude plugin validate .` before you push — it's the same check Anthropic's review pipeline runs.

## Private repositories = paid or team-only plugins
Marketplaces clone with your normal git credentials. If you can `git clone` the repo, you can add it as a marketplace. That makes a private GitHub repository a complete distribution system for paid plugins: grant a buyer read access to the repo and they run `claude plugin marketplace add org/private-marketplace`. Revoke access and updates stop. No license server needed. (This is how [Anchorwatch Pro](/pro/) is delivered; Polar grants the GitHub access automatically on purchase.)

Two gotchas: the GitHub `owner/repo` shorthand clones over SSH by default — set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` if you only have HTTPS credentials — and background auto-updates of private HTTPS marketplaces need a credential helper; `gh auth setup-git` fixes that once.

## Versions and updates
- If `plugin.json` has a `version`, users only get an update when you bump it. Good for stability; remember to bump.
- If neither the plugin nor the marketplace entry pins a version, git sources update on every new commit.
- Claude Code refreshes marketplaces in the background once per session; `/plugin marketplace update <name>` forces it, then `claude plugin update plugin@marketplace`.
- For a stable/beta split, point two marketplace entries (or two marketplaces) at different `ref`s.

## Getting listed
Anthropic runs a community marketplace (`anthropics/claude-plugins-community`) that users add with `/plugin marketplace add anthropics/claude-plugins-community`. Submit through the Console form; passing `claude plugin validate --strict` is a prerequisite. The curated official marketplace is by invitation.

## Checklist before publishing a marketplace
1. `claude plugin validate . --strict` and the same for each plugin directory.
2. A README with the two install commands at the top.
3. Hooks use `${CLAUDE_PLUGIN_ROOT}` for paths, never hard-coded ones.
4. Tests for hook scripts (feed JSON on stdin, assert the output) running in CI on macOS and Linux.
5. A `version` in each `plugin.json` and a CHANGELOG.
