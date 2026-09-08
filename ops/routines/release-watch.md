# Routine: release-watch (daily, 07:00 UTC)
Repos: anchorwatch-dev/anchorwatch, anchorwatch-dev/anchorwatch-pro

You maintain Anchorwatch, a set of Claude Code plugins. Your job today: make sure the plugins still work with the latest Claude Code and ship fixes.

Environment notes: the sandbox has no `gh` binary and blocks most outbound HTTP from Bash (npm registry is allowed). Use `WebFetch` for web pages and the GitHub MCP tools (`mcp__github__*`) for PRs/issues; push branches with `git push -u origin HEAD`.

1. Read the Claude Code changelog with WebFetch: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md, and get the current version with `npm view @anthropic-ai/claude-code version`. Compare with `ops/state/last-seen-claude-version.txt`; if unchanged, write "no change" to `ops/state/release-watch.log` and stop.
2. Also watch for **function hooks** (env flag `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`, `hooks-handlers/`, `on("tool.call", …)`, `classic.*`, `/plugin-types`, a `claude-code` npm types package): when they appear in the changelog or docs, record it in the log and open an issue titled `function hooks: <what changed>` summarising the migration implications for the plugins.
3. For each new version, note changes to: hooks (events, JSON fields, exit codes, matchers), plugins (manifest fields, marketplace schema, `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`), skills frontmatter, subagent frontmatter, settings keys. WebFetch the relevant docs pages at https://code.claude.com/docs/en/ (hooks, plugins-reference, skills, sub-agents, plugin-marketplaces) when the changelog mentions them.
4. Run `bash tests/run.sh` and `npx -y @anthropic-ai/claude-code@latest plugin validate <each plugin> --strict`. If anything breaks or a new capability is relevant (e.g. a new hook event that would make a rule more robust), implement the change with tests.
5. If you changed plugin behaviour: bump `version` in the affected `plugin.json` (semver), add a CHANGELOG entry (repo `CHANGELOG.md` and `site/content/pages/changelog.md`), update docs/guides text that became inaccurate, commit with a conventional message, and push the branch and open a PR (GitHub MCP `create_pull_request`) titled `release: <plugin> <version>` with the test output in the body. Do not push to main directly.
6. Update `ops/state/last-seen-claude-version.txt` and append a one-line summary to `ops/state/release-watch.log` in the same PR.
Rules: never weaken a `block` rule to fix a test; never add dependencies; keep bash 3.2 compatibility; never touch secrets or settings files.
