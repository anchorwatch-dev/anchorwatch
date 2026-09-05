# Awesome-list PR entries (agent opens these PRs after "go")

hesreallyhim/awesome-claude-code → section "Hooks" or "Plugins":
- [Anchorwatch](https://github.com/anchorwatch-dev/anchorwatch) — Guardrails plugin: blocks destructive shell/git/SQL commands, protects `.env`/keys, scans writes for leaked credentials, warns before deploys. 24 rules, tested, zero deps.

rohitg00/awesome-claude-code-toolkit → "Plugins" / "Hooks":
- **Anchorwatch** — PreToolUse guardrails (rm -rf, force push, DROP TABLE, curl|sh, secret files) with deny reasons the model acts on. `claude plugin marketplace add anchorwatch-dev/anchorwatch`

composio-community/awesome-claude-plugins → "Security":
- [anchorwatch](https://github.com/anchorwatch-dev/anchorwatch) — Safety hooks for Claude Code: destructive-command blocking, secret protection, credential scanning. MIT.
