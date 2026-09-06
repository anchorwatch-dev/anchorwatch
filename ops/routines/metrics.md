# Routine: metrics (weekly, Monday 07:30 UTC)
Repo: anchorwatch-dev/anchorwatch. Environment variables: POLAR_ACCESS_TOKEN (orders:read, metrics:read), GITHUB_TOKEN (provided by the environment).

Produce the weekly ledger row for last week (ISO week) and an honest assessment.

1. Traffic: `curl -s https://anchorwatch.sh/api/stats` → sum unique visitors and pageviews for the 7 days of last week from `daily`; note top 3 pages and referrers; checkout clicks from `events`.
2. GitHub: `gh api repos/anchorwatch-dev/anchorwatch` (stargazers_count), `gh api repos/anchorwatch-dev/anchorwatch/traffic/clones` (unique clones — requires push access), open issues count, both repos.
3. Sales: read `ops/state/polar-orders.json` (synced every Monday 06:15 UTC by the `polar-sync` GitHub Action; if `POLAR_ACCESS_TOKEN` is available in this environment you may refresh it with `bash scripts/polar-sync.sh`). Count paid orders per product created last week; net revenue = sum of `net_amount`/100 minus Polar fees (5 % + $0.50 per order). If the file is missing or older than 8 days, write "n/a (sync failed)" and open an issue — never guess.
4. Costs: Fly usage is ~$0–3/month with auto-stop; note any domain or other cost from `ops/state/costs.md`.
5. Append the row to the table in `ops/METRICS.md`, and update the ledger table on `site/content/pages/experiment.md` to match. Add a 3–6 sentence assessment under "Assessment log": what moved, what didn't, one hypothesis, and the single next experiment. Be plain about failure.
6. Evaluate the phase gates in `ops/ROADMAP.md` against cumulative numbers and write a `Gate status:` line under the assessment (e.g. "Phase 1: 3/10 sales, 140/300 stars — not yet"). If a gate, iterate line, or kill line is hit, open a second PR titled `decision: <what>` with the evidence and a recommendation.
7. Open a PR titled `metrics: <ISO week>`. In the PR body, include the numbers and the assessment.
