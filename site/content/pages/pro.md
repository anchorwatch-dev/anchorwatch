---
title: Anchorwatch Pro — quality gates, releases, review crew, context keeper
description: Six Claude Code plugins that add engineering discipline to Claude Code — auto-format and test gates, conventional commits and safe releases, parallel specialist code review, compaction-proof context, setup audits, and stack-specific CLAUDE.md packs. One-time price, updates included.
---
<p class="eyebrow">Anchorwatch Pro</p>

# Guardrails stop the damage. Pro adds the discipline.

<p class="lead">The free plugin stops Claude from doing harm. Pro makes it work the way a careful senior engineer works: format everything, run the tests, write real commits, get a review before merging, and never lose the thread across a long session. Six plugins, one price, every update included.</p>

<div class="plans">
<div class="plan"><h3>Anchorwatch</h3><div class="price">$0 <small>MIT, forever</small></div><p class="who">For anyone using Claude Code.</p>
<ul><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>24 guardrail rules: 11 block, 13 warn</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Secret-file protection and credential scanning</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Per-project configuration</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Community support on GitHub</span></li></ul>
<a class="btn" href="/docs/install/">Install free</a></div>
<div class="plan hot"><h3>Anchorwatch Pro</h3><div class="price">$39 <small>one-time · personal licence · all updates</small></div><p class="who">For developers shipping real products with Claude Code.</p>
<ul><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Everything in the free plugin</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Quality Gates, Ship, Review Crew, Context Keeper, Setup Audit, Stack Packs</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Private marketplace: updates arrive like any plugin update</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Issue-based support, triaged daily</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>14-day refund</span></li></ul>
<a class="btn primary" href="/go/pro?from=pro">Buy Pro — $39<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>
<div class="plan"><h3>Anchorwatch Team</h3><div class="price">$149 <small>one-time · up to 10 developers</small></div><p class="who">For teams that want the same discipline on every machine.</p>
<ul><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Everything in Pro, for ten people</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Shareable through your org's marketplace settings</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>Priority issue triage</span></li><li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>VAT invoice from Polar</span></li></ul>
<a class="btn" href="/go/pro?from=team&tier=team">Buy Team — $149<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>
</div>

<p class="small">Payments and tax are handled by Polar as merchant of record. Delivery is read access to a private GitHub repository, granted automatically after checkout.</p>

## What's in each tier

<div class="compare">

| | Free | Pro | Team |
|---|:---:|:---:|:---:|
| Guardrails: destructive shell, git and SQL commands blocked before they run | ✓ | ✓ | ✓ |
| Secret files protected, every write scanned for credentials | ✓ | ✓ | ✓ |
| Format on edit with your formatter, debug-leftover scan | – | ✓ | ✓ |
| Stop-time test gate: no "done" until tests ran | – | ✓ | ✓ |
| `/ship:commit`, `/ship:pr`, `/ship:release`, `/ship:changelog` | – | ✓ | ✓ |
| Four parallel reviewers with one ranked report | – | ✓ | ✓ |
| Compaction snapshots, `/handoff`, `/resume` | – | ✓ | ✓ |
| Setup audit with graded fixes | – | ✓ | ✓ |
| Stack packs for TypeScript, Next.js, Python, Go | – | ✓ | ✓ |
| Seats | 1 | 1 | 10 |
| Support | community | daily triage | priority |

</div>

## The six plugins

<div class="features">
<div class="card"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-cog"/></svg></span><h3>Quality Gates</h3><p>Runs your formatter after every edit, flags <code>console.log</code>, <code>debugger</code> and <code>print(</code> left in real code, and won't let Claude say "done" while tests haven't run or last failed. Remind or enforce mode.</p><a class="more" href="/docs/pro-quality-gates/">Read the docs →</a></div>
<div class="card"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-git"/></svg></span><h3>Ship</h3><p>Conventional commits written from the real diff, pull requests with a summary and test plan, and semver releases with CHANGELOG, tag and GitHub release, each behind a confirmation gate.</p><a class="more" href="/docs/pro-ship/">Read the docs →</a></div>
<div class="card"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-review"/></svg></span><h3>Review Crew</h3><p>Security, performance, test-gap and contract reviewers run in parallel on your diff and return one ranked report with file:line evidence, a failure scenario and a fix for every finding.</p><a class="more" href="/docs/pro-review-crew/">Read the docs →</a></div>
<div class="card"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-brain"/></svg></span><h3>Context Keeper</h3><p>Snapshots branch, changes and recent files before context compaction and restores them after, so long sessions don't lose the thread. <code>/handoff</code> writes a precise handover; <code>/resume</code> picks it up.</p><a class="more" href="/docs/pro-context-keeper/">Read the docs →</a></div>
<div class="card"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-audit"/></svg></span><h3>Setup Audit</h3><p>Grades your CLAUDE.md, permissions, hooks, rules, skills, MCP servers, memory and repo hygiene A–F against a published rubric, then lists the five fixes worth doing first.</p><a class="more" href="/docs/pro-setup-audit/">Read the docs →</a></div>
<div class="card"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-stack"/></svg></span><h3>Stack Packs</h3><p>Detects your stack and writes a CLAUDE.md filled with your real commands, versions and layout, plus path-scoped rules. Merges with what you already have instead of overwriting it.</p><a class="more" href="/docs/pro-stack-packs/">Read the docs →</a></div>
</div>

## Questions

<div class="faq">
<details><summary>How is Pro delivered?</summary><p>After checkout, Polar's customer portal asks you to connect GitHub, then grants that account read access to the private <code>anchorwatch-pro</code> repository. You add it as a marketplace once with <code>claude plugin marketplace add anchorwatch-dev/anchorwatch-pro</code> and install plugins normally. Updates flow through the marketplace like any other plugin.</p></details>
<details><summary>How do team seats work?</summary><p>The buyer gets access immediately and opens an issue titled "Team seats" listing up to nine more GitHub usernames. They're added within a day.</p></details>
<details><summary>Which Claude Code version do I need?</summary><p>Current releases, 2.1 and later. When Claude Code changes hook or plugin behaviour, Pro is updated, usually within a day, because tracking those changes is the operator's daily job.</p></details>
<details><summary>Does it send my code anywhere?</summary><p>No. Everything runs locally as hooks and skills. The plugins make no network requests. This site collects anonymous pageviews; see the <a href="/privacy/">privacy page</a>.</p></details>
<details><summary>What if it doesn't fit my workflow?</summary><p>Fourteen-day refund through Polar, no questions asked. Access to the repository is removed when a refund is issued.</p></details>
<details><summary>Can I see the code before buying?</summary><p>The free plugin is fully open source and shares the same style, test approach and hook design. The Pro documentation describes every hook, command and configuration option in full.</p></details>
</div>
