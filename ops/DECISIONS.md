# Decision log

## 2026-09-06 — Choosing the business
**Brief from the owner:** build, run, monitor and optimise an online business end to end; anything goes.

**Constraints the agent operates under:** cannot create accounts, enter payment details, or accept terms; needs explicit approval for the first public/irreversible actions; has a terminal, browser, GitHub CLI (authenticated), Fly.io CLI (authenticated), web search, and cloud cron routines (minimum interval 1 hour).

**Options considered**
| Option | Time to first revenue | Why not / why |
|---|---|---|
| Niche job board (e.g. agent-engineering jobs) | 12–18 months (SEO-dependent; MoAIJobs ≈ $2.3k/mo after that) | Too slow for an experiment |
| Programmatic/data SEO site + affiliates | 6–12 months; Google's 2026 scaled-content enforcement cut 50–80 % of traffic from low-value sites | Slow, fragile |
| Micro-SaaS in an AI category | Weeks to build, but "AI tools" is the most crowded category (1,200+ startups, $7 median MRR) | Saturated |
| Digital product sold to developers via a merchant of record | Days to first sale if distribution exists | Chosen |

**Why a Claude Code plugin specifically:** the model has an unusual knowledge edge in Claude Code itself; the maintenance burden (tracking releases, adjusting hooks, answering issues) is continuous intelligent labour a model can carry daily; distribution is agent-operable through GitHub; existing paid kits on Gumroad are unmaintained collections of prompts, so "tested, maintained, updated within a day of each release" is a real differentiator. Guardrails were chosen as the free hook because "Claude ran rm -rf / force-pushed / read my .env" is a recurring, emotionally loaded problem with clear search intent.

**Merchant of record:** Polar (5 % + 50¢, instant signup, UK payouts via Stripe Connect, handles VAT, GitHub-repo-access benefit automates delivery). Lemon Squeezy has similar fees but approval takes days. Gumroad no longer handles EU VAT for most sellers.

**Hosting:** Fly.io (already authenticated; London region; `auto_stop_machines` keeps idle cost near zero) rather than GitHub Pages (URL would leak an unrelated account name) or Vercel (token expired).

**Name:** "Anchorwatch" — the sailor who stays awake to make sure the ship doesn't drift. Rejected: Bosun (collides with a 3.4k-star monitoring project), Ballast, Shipshape (Google project). Must not include "Claude" (trademark).

**Pricing:** $39 one-time personal, $149 team (≤10). One-time beats subscription for launch conversion on dev tools; updates included is the promise that makes the maintained-by-an-agent story credible. Revisit after 30 days of data.

**Explicitly deferred:** a higher-ticket "codebase audit by the agent" productised service (agent labour as the product) — good phase-2 upsell once the storefront exists.

## 2026-09-10 — Ship the mods port as an experimental sibling plugin
Anthropic committed (issue #91870, 2026-09-09) to shipping function hooks as "Claude Mods" within weeks and published three first-party mods. We ported the eight block-level Bash rules to `plugins/anchorwatch-mod` (typed `tool.call` handler, parity-tested against the bash guard, fail-closed `.catch` when available). It is not listed in the marketplace and loads only behind the flag; the bash plugin remains the product. Reason: being an early, tested guardrail mod is worth more distribution than any launch post, and the port is cheap to keep in sync because both share the rule regexes in spirit and the parity suite catches drift.

## 2026-09-16 — Pause the daily routines; keep the site standing
Day 10 of 60. Product side: four routines ran clean for nine days and shipped real work (secret-write hardening 0.1.2, nesting/reader bypasses 0.1.3, eval and closing-quote bypasses 0.1.4, the mods port, ten guides). Distribution side: nothing was posted anywhere after 2026-09-09. Show HN was flagged dead within a minute and the moderators never replied; the Reddit posts were drafted and not posted. Traffic settled at 1–2 visitors/day, 0 stars, 0 organic sales.

Decision: disable release-watch and growth (both daily on opus-5, the dominant cost), move support-triage from daily to Mondays, keep the Monday metrics run, keep the site and both repos up. Reason: the recurring spend was hardening and promoting a product with no users, and the binding constraint is distribution, which needs the owner in public and has not happened three times running. Reversible in one call if that changes. Re-check late October to see whether the ten guides rank; if they bring nothing, write the experiment up as its own artefact and let the domain lapse.

## 2026-09-23 — Wind down to zero recurring cost
The site moved from the Fly server to GitHub Pages, which is free for a public repository. The bun server only ever existed for the anonymous visit counter and the `/go/pro` redirect: the counter is now a frozen JSON snapshot the experiment page reads and labels as frozen, and the Buy buttons link straight to Polar. The analytics beacon is removed, so nothing phones home.

Workflows removed: deploy (Fly), stats-sync, polar-sync, and the four manual routine fallbacks. What remains is `pages.yml` (build and publish) and `test.yml`, both free on a public repository.

Routines: release-watch and growth are disabled; support-triage and metrics were deleted. Nothing is scheduled any more.

Left for the owner: point anchorwatch.sh at GitHub Pages in Cloudflare, destroy the Fly app (it lives in a different Fly account from the one the local CLI is signed into), and decide whether to keep the domain at renewal. Polar costs nothing while nothing sells.
