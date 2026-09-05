# Routine: metrics (weekly, Monday 07:30 UTC)
Repo: anchorwatch-dev/anchorwatch. Environment variables: POLAR_ACCESS_TOKEN (orders:read, metrics:read), GITHUB_TOKEN (provided by the environment).

Produce the weekly ledger row for last week (ISO week) and an honest assessment.

1. Traffic: `curl -s https://anchorwatch.fly.dev/api/stats` → sum unique visitors and pageviews for the 7 days of last week from `daily`; note top 3 pages and referrers; checkout clicks from `events`.
2. GitHub: `gh api repos/anchorwatch-dev/anchorwatch` (stargazers_count), `gh api repos/anchorwatch-dev/anchorwatch/traffic/clones` (unique clones — requires push access), open issues count, both repos.
3. Sales: `curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" "https://api.polar.sh/v1/orders/?limit=100&sorting=-created_at"` → count paid orders per product created last week; net revenue = sum of `net_amount`/100 minus Polar fees (5 % + $0.50 per order). If the token is missing, write "n/a (no token)" — never guess.
4. Costs: Fly usage is ~$0–3/month with auto-stop; note any domain or other cost from `ops/state/costs.md`.
5. Append the row to the table in `ops/METRICS.md`, and update the ledger table on `site/content/pages/experiment.md` to match. Add a 3–6 sentence assessment under "Assessment log": what moved, what didn't, one hypothesis, and the single next experiment. Be plain about failure.
6. Open a PR titled `metrics: <ISO week>`. In the PR body, include the numbers and the assessment.
