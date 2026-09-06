---
title: Anchorwatch Pro — quality gates, releases, review crew, context keeper
description: Six Claude Code plugins that add engineering discipline to Claude Code — auto-format and test gates, conventional commits and safe releases, parallel specialist code review, compaction-proof context, setup audits, and stack-specific CLAUDE.md packs. One-time price, updates included.
---
<p class="eyebrow">Anchorwatch Pro</p>

# Guardrails stop the damage. Pro adds the discipline.

The free plugin stops Claude from doing damage. Pro makes Claude work the way a careful senior engineer works: format everything, run the tests, write real commit messages, get a review before merging, and never lose the thread across a long session.

<div class="pricing">
<div class="card"><h3>Anchorwatch</h3><div class="price">$0 <small>MIT, forever</small></div>
<ul><li>24 guardrail rules (11 block, 13 warn)</li><li>Secret file protection + credential scan</li><li><code>/anchorwatch:status</code>, <code>:check</code>, <code>:allow</code>, <code>:doctor</code></li><li>Per-project config</li></ul>
<p><a class="btn" href="/docs/install/">Install free</a></p></div>
<div class="card hot"><h3>Anchorwatch Pro</h3><div class="price">$39 <small>one-time · personal license · all updates</small></div>
<ul><li>Everything in the free plugin</li><li><strong>Quality Gates</strong> — format on edit, debug-leftover scan, stop-time test gate</li><li><strong>Ship</strong> — /commit, /pr, /release, /changelog with guardrails</li><li><strong>Review Crew</strong> — 4 specialist reviewers in parallel</li><li><strong>Context Keeper</strong> — compaction snapshots, /handoff, /resume</li><li><strong>Setup Audit</strong> — A–F grades and top-5 fixes</li><li><strong>Stack Packs</strong> — CLAUDE.md + rules for TS, Next.js, Python, Go</li><li>Private GitHub marketplace: updates arrive like any plugin update</li><li>Issue-based support, triaged daily</li></ul>
<p><a class="btn primary" href="/go/pro?from=pro">Buy Pro — $39<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>
<p class="small">Payments and VAT handled by Polar (merchant of record). 14-day refund if it doesn't fit your workflow.</p></div>
<div class="card"><h3>Team</h3><div class="price">$149 <small>one-time · up to 10 developers</small></div>
<ul><li>Everything in Pro for your whole team</li><li>Shareable via your org's marketplace settings</li><li>Priority issue triage</li></ul>
<p><a class="btn" href="/go/pro?from=team&tier=team">Buy Team — $149</a></p></div>
</div>

<div id="soon"></div>

## What each plugin actually does

### Quality Gates
A `PostToolUse` hook runs the formatter your repo already uses (prettier, biome, ruff, black, gofmt, rustfmt — auto-detected, nothing runs if you have none) on every file Claude edits, then scans non-test code for `console.log`, `debugger`, `print(`, `dbg!`, `binding.pry`. A `Stop` hook checks whether code changed since the last test run and whether that run passed; in `remind` mode it tells you and Claude, in `enforce` mode it blocks the first attempt to stop so Claude goes and runs the tests. `/quality-gates:preflight` runs lint → typecheck → tests → build and gives you a scorecard.

### Ship
`/ship:commit` reads the *actual diff*, splits unrelated changes, and writes Conventional Commits — never `--no-verify`, never `git add -A`. `/ship:pr` pushes, fills your PR template (or a good default: summary, changes, test plan, risks), and links issues. `/ship:release` runs gates (clean tree, default branch, tests green), infers the semver bump from the commits, writes the CHANGELOG section, bumps every version file, and only after you confirm: commits, tags, pushes, and creates the GitHub release.

### Review Crew
Four subagents — `security-reviewer`, `perf-reviewer`, `test-gap-finder`, `contract-reviewer` — each with a detailed checklist and a strict output format (severity, file:line, evidence, failure scenario, fix). `/review-crew:review` runs them in parallel on your working tree, a git range, or a PR number, de-duplicates and ranks the findings, and gives a verdict. `--fix` applies the critical and high fixes and re-runs the tests.

### Context Keeper
A `PreCompact` hook writes a snapshot (branch, uncommitted changes, diff stat, recent commits, recently modified files, your HANDOFF.md) and a `SessionStart` hook re-injects it after compaction or resume, so Claude doesn't "forget" what it was doing halfway through. `/context-keeper:handoff` writes a precise HANDOFF.md; `/context-keeper:resume` reconciles it with git and proposes the next step.

### Setup Audit
`/setup-audit:run` inventories CLAUDE.md, `.claude/settings.json` (secrets masked), hooks, rules, skills, agents, MCP servers, memory, and repo hygiene (including a spot-check of git history for leaked keys), grades each area A–F against a published rubric, and lists the top five fixes ordered by risk × ease. `--apply` makes the safe local ones.

### Stack Packs
`/stack-packs:init` detects your stack and writes a CLAUDE.md filled with *your* real commands, package manager, versions and layout, plus path-scoped `.claude/rules`. If you already have a CLAUDE.md it merges and flags contradictions instead of overwriting.

## FAQ

**How is Pro delivered?** After purchase Polar grants your GitHub account read access to the private `anchorwatch-pro` repository. You add it as a marketplace once (`claude plugin marketplace add anchorwatch-dev/anchorwatch-pro`) and install plugins normally; updates flow through the marketplace like any other plugin. Team licences: the buyer gets access immediately and opens an issue titled "Team seats" listing up to nine more GitHub usernames; they're added within a day.

**Which Claude Code version?** Current releases (2.1+). On older 2.0 versions the free plugin still blocks the same commands, but the block surfaces as a permission prompt rather than a written reason Claude can act on. When Claude Code changes hook or plugin behaviour, Pro is updated — usually within a day — because tracking those changes is the operator's daily job.

**Does it send my code anywhere?** No. Everything runs locally in hooks and skills. This site collects anonymous pageviews (see [privacy](/privacy/)); the plugins collect nothing.

**Refunds?** 14 days, no questions, via Polar.

**Team licences and invoices?** The Team tier covers up to 10 developers; Polar issues VAT invoices automatically. Need more seats? Open an issue.
