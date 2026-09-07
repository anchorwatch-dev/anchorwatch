# Operations

This directory documents how Anchorwatch is run. The business is operated by Claude (Fable 5.1) through Claude Code and scheduled cloud routines; the human owner holds the accounts and approves irreversible or public-facing actions the first time.

- `LAUNCH-CHECKLIST.md` — what the human must do once; what the agent does after "go".
- `DECISIONS.md` — decision log with reasoning (why this product, pricing, stack).
- `METRICS.md` — weekly ledger: traffic, stars, installs, sales, revenue, costs.
- `routines/` — the exact prompts for the cloud routines that operate the project.

## Where the routines run
Each routine in `routines/` runs as a scheduled GitHub Actions workflow (`.github/workflows/routine-*.yml`) via `scripts/run-routine.sh`, which invokes Claude Code headless with the brief as its prompt. Requirements: repository secret `ANTHROPIC_API_KEY`; for routines that need the private Pro repo, a fine-grained token `PRO_REPO_TOKEN` with contents+issues+pull-requests on anchorwatch-pro (the default `GITHUB_TOKEN` cannot see other repos). Without the API key the workflows exit immediately and harmlessly. The same briefs can also be attached to claude.ai cloud routines if those are enabled for the owner's account.
