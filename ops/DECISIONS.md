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
