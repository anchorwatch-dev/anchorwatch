# Launch post drafts (for the human to post from their own accounts, after "go")

## X / Bluesky (thread)
1/ I gave Claude one instruction: research, build, launch and run an online business. Anything goes. I only handle accounts and payments.

It picked a problem it knows better than anyone: Claude Code deleting your stuff. Meet Anchorwatch. 🧵

2/ Anchorwatch is a Claude Code plugin that blocks `rm -rf`, force-pushes to main, `DROP TABLE`, `cat .env`, and `curl | sh` *before* they run — and tells the model why, so it proposes the safe path instead of retrying.

Free, MIT, zero deps: anchorwatch.fly.dev

3/ Every line — the hooks, 116 tests, the site, the docs, the support triage, this thread's draft — was written by Claude. It also runs the daily ops via scheduled agents: watching Claude Code releases, fixing issues, writing guides.

4/ It also decided to charge money. Anchorwatch Pro ($39): format-on-edit + a Stop hook that won't let Claude say "done" if tests didn't run, `/ship:release` with guardrails, 4 parallel review agents, compaction-proof context.

5/ Metrics are public, including revenue (currently $0). If nobody buys, the page will say so. anchorwatch.fly.dev/experiment

## Reddit — r/ClaudeCode (title + body)
**Title:** I let Claude build and run a business by itself. It built a plugin that stops Claude Code from rm -rf'ing your project.

**Body:**
Experiment: I gave Claude (via Claude Code) one instruction — research, build, launch and operate an online business, anything goes — and limited myself to creating accounts and paying bills.

It chose to build **Anchorwatch**, a Claude Code plugin with hooks that block destructive commands before they run:

- `rm -rf` on roots/globs/the project, `dd`, `mkfs`, `chmod 777`, `curl | sh`
- `git push --force` to main/master, `reset --hard`, `clean -f`, `stash drop`
- `DROP TABLE`, `TRUNCATE`, `DELETE FROM` without `WHERE`
- reading/writing `.env*`, keys, `~/.ssh`; plus a scan of every write for AWS/GitHub/Stripe/OpenAI/Anthropic tokens

The interesting part is the deny *reason* gets fed back to Claude, so instead of retrying variations it explains the block and offers a safer path. Riskier-but-legit stuff (`npm publish`, `sudo`, `rm -rf build`) gets a warning injected instead of a block.

Install: `claude plugin marketplace add anchorwatch-dev/anchorwatch` then `claude plugin install anchorwatch@anchorwatch`. MIT, bash only, 116 tests, works with jq/node/python3.

It also wrote a paid tier (I didn't ask it to) and publishes its own metrics including revenue: anchorwatch.fly.dev/experiment. Happy to answer questions about what the agent got right and wrong — the decision log is in the repo under ops/.

## Hacker News (Show HN)
**Title:** Show HN: Anchorwatch – guardrails for Claude Code, built and operated by Claude

**Text:**
I gave Claude Code a single instruction — research, build, launch and run an online business end to end — and restricted my role to account creation and payments. It chose to build a guardrails plugin for Claude Code itself.

Anchorwatch is a set of PreToolUse/PostToolUse hooks (plain bash) that deny destructive shell/git/SQL commands and secret-file access before execution, returning a reason the model can act on. Warnings for risky-but-legitimate operations are injected as context rather than blocked. Commands are split on ;/&&/||/| so `cd x && rm -rf /` is still caught. 116 test cases run against jq, node and python3 parsers.

Code (MIT): github.com/anchorwatch-dev/anchorwatch
The experiment, with public metrics and the agent's decision log: anchorwatch.fly.dev/experiment

Things I found notable: it chose a merchant of record over Stripe for VAT reasons without prompting, it refused to name the product with "Claude" in it for trademark reasons, and it wrote the "this is a guardrail, not a sandbox — here's how to bypass it" section itself.

## Product Hunt
**Tagline:** Guardrails for Claude Code — built and run by Claude
**Description:** Anchorwatch blocks rm -rf, force-pushes to main, DROP TABLE, cat .env and curl | sh before Claude Code runs them, and scans every edit for leaked credentials. Free and MIT. Pro adds quality gates, safe releases, a parallel review crew and compaction-proof context. The whole business — product, site, support, growth — is operated by an AI agent with public metrics.

## Community marketplace submission (platform.claude.com/plugins/submit) — paste text
- Plugin name: anchorwatch
- Repository: https://github.com/anchorwatch-dev/anchorwatch (plugin path: plugins/anchorwatch)
- Description: Guardrails for Claude Code: blocks destructive shell/git/SQL commands, protects secret files, scans written code for leaked credentials, and warns before irreversible deploys. Zero dependencies, configurable per project.
- Category: security
- Validation: `claude plugin validate ./plugins/anchorwatch --strict` passes (2.1.261)
