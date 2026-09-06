# Anchorwatch

**Guardrails for Claude Code.** A plugin that blocks destructive shell, git, and SQL commands, keeps secrets out of the transcript, scans every write for leaked credentials, and warns before irreversible deploys — before they run, with a reason Claude can act on.

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch
claude plugin install anchorwatch@anchorwatch
```

Then `/anchorwatch:doctor`. Zero dependencies beyond bash and one of `jq` / `node` / `python3`. macOS, Linux, Windows (Git Bash).

```
$ git push --force origin main
✗ Anchorwatch blocked this: force push to protected branch 'main'. Push to a
  feature branch and open a PR instead. [git-force-push-protected]

$ cat .env
✗ Anchorwatch blocked this: this prints a .env file (secrets) into the conversation.
  List variable names instead: grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env
```

## What it catches

| | Blocks | Warns |
|---|---|---|
| **Shell** | `rm -rf` on `/`, `~`, `.`, `*`, system dirs, the project root; `curl … \| sh`; `dd`/`mkfs`; `chmod 777` | other recursive deletes, `sudo`, `killall`, shell-startup/hosts/crontab edits |
| **Git** | force push to main/master/production; `reset --hard`, `clean -f`, `checkout -- .`, `stash drop`, `branch -D`, `filter-branch` | force push to other branches, ref deletion |
| **SQL** | `DROP TABLE/DATABASE`, `TRUNCATE`, `DELETE FROM` without `WHERE` | |
| **Secrets** | reading or writing `.env*`, keys, `~/.ssh`, `~/.aws`, credentials; `cat .env` | bare `env`/`printenv`; credential patterns in content just written (AWS, GitHub, Stripe, Anthropic, OpenAI, Slack, Google, private keys, DB URLs) |
| **Publishing** | | `npm publish`, `gh release create`, `docker push`, `fly deploy`, `terraform apply`, `kubectl delete`, … |
| **Self-modification** | edits inside `.git/` | edits to Claude Code settings, hooks, MCP config, `.anchorwatch.json`; lockfiles; CI/deploy files; writes outside the project |

Full list with defaults: [docs/rules](https://anchorwatch.sh/docs/rules/).

## Configure

`.anchorwatch.json` in the project root (or `~/.anchorwatch.json`):

```json
{
  "rules": { "git-destructive": "warn", "publish": "block" },
  "allow": ["^rm -rf \\./dist/?$"],
  "protectedBranches": ["main", "release"]
}
```

Levels: `block` · `warn` · `off`. `allow` patterns are POSIX ERE tested against the full command or path. Kill switch: `ANCHORWATCH_DISABLE=1`. Or let Claude do it: `/anchorwatch:allow git-destructive=warn`.

## Skills
`/anchorwatch:status` · `/anchorwatch:check <command>` (dry run) · `/anchorwatch:allow` · `/anchorwatch:doctor` · `/anchorwatch:rules`

## How it works
Five bash scripts on `PreToolUse` (Bash / Edit·Write / Read), `PostToolUse` (Edit·Write) and `SessionStart`. Each reads the hook JSON from stdin and returns a `permissionDecision: deny` with a reason, or `additionalContext` for warnings. Scripts fail open: an error in the guard never blocks your work. Details: [how it works](https://anchorwatch.sh/docs/how-it-works/).

It is a guardrail, not a sandbox. Combine with containers or Claude Code's sandbox for hard isolation.

## Development

```bash
bash tests/run.sh                         # 116 cases against the hook scripts
AW_FORCE_PARSER=node bash tests/run.sh    # exercise the node / python3 fallbacks
npx -y @anthropic-ai/claude-code@latest plugin validate ./plugins/anchorwatch --strict
claude --plugin-dir ./plugins/anchorwatch # try it in a session
```

Repository layout: `plugins/anchorwatch/` (the plugin), `.claude-plugin/marketplace.json` (the marketplace), `site/` (anchorwatch.sh), `ops/` (how this project is operated), `tests/`.

## Pro
[Anchorwatch Pro](https://anchorwatch.sh/pro/) adds Quality Gates (format-on-edit, debug-leftover scan, stop-time test gate), Ship (`/commit`, `/pr`, `/release`), Review Crew (four parallel specialist reviewers), Context Keeper (compaction-proof state, `/handoff`, `/resume`), Setup Audit, and Stack Packs. One-time purchase, delivered as a private marketplace.

## The experiment
This project is built and operated by Claude (Fable 5.1) running in Claude Code; a human owns the accounts and approves anything irreversible. Decisions, metrics and costs are public in [`ops/`](ops/) and on the [experiment page](https://anchorwatch.sh/experiment/).

## License
MIT. Not affiliated with Anthropic; "Claude" is a trademark of Anthropic, PBC.
