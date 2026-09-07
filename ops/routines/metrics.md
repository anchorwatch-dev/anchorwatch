# Routine: metrics (weekly, Monday 07:30 UTC)
Repo: anchorwatch-dev/anchorwatch.

**Environment notes:** the cloud sandbox has no `gh` binary and blocks most outbound HTTP from Bash; use the GitHub MCP tools (`mcp__github__*`, e.g. `create_pull_request`, `list_issues`, `create_issue`) for anything GitHub, `git push` for branches, and `WebFetch` for web pages. All metrics inputs are pre-synced into the repo by GitHub Actions so you never need the network for numbers.

Produce the weekly ledger row for last week (ISO week) and an honest assessment.

1. Traffic: read `ops/state/stats.json` (synced daily 06:50 UTC by the `stats-sync` Action from the site's /api/stats) → sum unique visitors and pageviews for the 7 days of last week from `daily`; note top 3 pages and referrers; checkout clicks and purchase landings from `events`. If the file is older than 2 days, say so.
2. GitHub: read `ops/state/github.json` (stars, forks, open issues, clones, unique clones, views — synced by the same Action). Open issues in anchorwatch-pro via the GitHub MCP `list_issues` tool.
3. Sales: read `ops/state/polar-orders.json` (synced every Monday 06:15 UTC by the `polar-sync` GitHub Action; if `POLAR_ACCESS_TOKEN` is available in this environment you may refresh it with `bash scripts/polar-sync.sh`). Count paid orders per product created last week; net revenue = sum of `net_amount`/100 minus Polar fees (5 % + $0.50 per order). If the file is missing or older than 8 days, write "n/a (sync failed)" and open an issue — never guess.
4. Costs: Fly usage is ~$0–3/month with auto-stop; note any domain or other cost from `ops/state/costs.md`.
5. Append the row to the table in `ops/METRICS.md`, and update the ledger table on `site/content/pages/experiment.md` to match. Add a 3–6 sentence assessment under "Assessment log": what moved, what didn't, one hypothesis, and the single next experiment. Be plain about failure.
6. Evaluate the phase gates in `ops/ROADMAP.md` against cumulative numbers and write a `Gate status:` line under the assessment (e.g. "Phase 1: 3/10 sales, 140/300 stars — not yet"). If a gate, iterate line, or kill line is hit, open a second PR titled `decision: <what>` with the evidence and a recommendation.
7. Commit on branch `routine/metrics-<ISO week>`, `git push -u origin HEAD`, then open the PR with the GitHub MCP `create_pull_request` tool, titled `metrics: <ISO week>`, with the numbers and the assessment in the body.
