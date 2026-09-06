# Roadmap and phase gates

Three phases. Each builds on the assets of the previous one (audience, storefront, trust, code). Phase transitions are proposed by the agent when a gate is hit and approved by the owner; the Monday `metrics` routine evaluates the gates every week and writes a "Gate status" line in `METRICS.md`.

## Phase 1 — Anchorwatch free + Pro (now → day 60)
**Asset being built:** audience of Claude Code users, a storefront (Polar), a public narrative, trust.
**Distribution the agent owns:** GitHub (README, releases, topics), PRs to awesome-lists, weekly SEO/GEO guides, llms.txt, changelog RSS, docs accuracy, referrer-driven copy changes, community-marketplace listing (text prepared; human submits).
**Distribution the owner does (agent drafts):** launch posts on X, r/ClaudeAI, r/ClaudeCode, Show HN, Product Hunt; reply drafts for relevant threads.
**Success (day 30):** ≥5 Pro sales, ≥100 stars, ≥1,000 unique visitors/month. **Money:** ≥$500 net/month by day 90.
**Iterate (2–4 sales at day 30):** change price/packaging, add a Pro trial-by-guide, 30 more days.
**Kill/pivot (day 60):** <2 sales and <500 visitors/month → pivot the paid tier, keep the free plugin as the funnel.
**Gate to Phase 2 (any one):** ≥10 Pro sales total; or ≥300 stars; or day 60 with ≥1,000 visitors/month and weak conversion (audience exists, sell labour instead). Prerequisite: owner available to review the first 10 deliveries.

## Phase 2 — Agent-run audits and reports (day 60 → 180)
**What:** the agent's labour as the product. "Agent-readiness audit" ($149: Claude Code setup + repo hygiene, delivered as a report and a PR); "Codebase security & quality audit" ($299–499: Review Crew at depth); "Technical due-diligence lite" for micro-acquisitions ($499–999).
**Delivery:** Polar checkout with a custom field for the repo; an hourly routine picks up paid orders, clones, runs the audit, produces the report; email delivery via a transactional email account the owner creates (Resend or similar). Owner reviews the first 10 reports before they go out; then spot-checks.
**Distribution the agent owns:** upsell on the Pro thank-you page and inside the plugins (`/setup-audit:run` ends with "want the full audit?"), a free published sample report per product (GEO magnet), guides targeting "code audit before acquisition", "is my repo ready for AI agents", customer case studies with consent, weekly outreach *drafts* for the owner (Acquire.com buyers, indie founders).
**Success:** 10 paid audits in the first 60 days (≈$2–4k). **Money:** $3–5k/month by day 180.
**Gate to Phase 3 (any one):** ≥$3k/month for two consecutive months; or ≥5 inbound requests for team/enforcement features; or a platform-risk event (Anthropic ships native guardrails) — that triggers Phase 3 early regardless.

## Phase 3 — Cross-agent guardrails and Team tier (day 180 → 365)
**What:** Anchorwatch for Cursor, Codex CLI, Gemini CLI and others (same rules, each tool's hook mechanism); a Team tier (≈$29/developer/month or $490/year) with managed-settings enforcement, central policy file, and an audit log of blocked actions. Recurring revenue, less dependence on one vendor.
**Distribution the agent owns:** existing customers (announcement via Polar, owner approves sends), comparison and "hooks for X" pages per ecosystem, listing in each tool's marketplace/directory, integration guides, partner drafts for the owner.
**Success / money:** $10k MRR at month 12; ≥20 team accounts.

## Stop rule
If Phase 1 misses its kill line and Phase 2 delivers <3 paid audits by day 120, stop. Total sunk cost by then is a few hundred dollars of hosting and usage.

## Who decides
The agent proposes (PR titled `decision: …` with the numbers). The owner approves anything that changes prices, adds a product, or sends email to customers.
