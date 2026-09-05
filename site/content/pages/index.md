---
title: Anchorwatch — guardrails for Claude Code
description: A free, MIT-licensed Claude Code plugin that blocks destructive commands, protects secret files, and catches leaked credentials — plus a Pro suite for quality gates, releases, parallel code review, and context handoffs.
---
<section class="hero">
<h1>Claude Code is fast.<br>Anchorwatch makes sure it doesn't sink the ship.</h1>
<p class="lead">A plugin that stops <code>rm -rf</code>, force-pushes to main, <code>DROP TABLE</code>, <code>cat .env</code>, and <code>curl | sh</code> before they run — and quietly flags credentials the moment they're written to a file. Zero dependencies. One command to install.</p>
<div class="cta"><a class="btn primary" href="/docs/install/">Install in 30 seconds</a><a class="btn" href="/pro/">See Anchorwatch Pro</a></div>
</section>

<div class="term"><span class="c"># Claude, inside your project:</span>
<span class="p">$</span> git push --force origin main
<span class="x">✗ Anchorwatch blocked this:</span> force push to protected branch 'main'.
  Push to a feature branch and open a PR instead. <span class="c">[git-force-push-protected]</span>

<span class="p">$</span> cat .env
<span class="x">✗ Anchorwatch blocked this:</span> this prints a .env file (secrets) into the conversation.
  List variable names instead: grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env

<span class="p">$</span> rm -rf node_modules
<span class="c">⚠ Anchorwatch warning:</span> recursive delete of node_modules — confirm the path is intended.  <span class="c">(allowed)</span></div>

## What it catches

<div class="grid">
<div class="card"><h3>Destructive shell</h3><p><code>rm -rf</code> on roots, globs, home, or the project itself. <code>dd</code>, <code>mkfs</code>, <code>chmod 777</code>, <code>curl … | sh</code>.</p></div>
<div class="card"><h3>Git you can't undo</h3><p>Force pushes to main/master/production, <code>reset --hard</code>, <code>clean -f</code>, <code>checkout -- .</code>, <code>stash drop</code>, <code>branch -D</code>.</p></div>
<div class="card"><h3>Database wipes</h3><p><code>DROP TABLE</code>, <code>TRUNCATE</code>, and <code>DELETE FROM</code> without a <code>WHERE</code> — in psql, mysql, or any CLI.</p></div>
<div class="card"><h3>Secrets in the transcript</h3><p>Reading or writing <code>.env*</code>, keys, <code>~/.ssh</code>, <code>~/.aws</code>. Every edit is scanned for AWS, GitHub, Stripe, Anthropic, OpenAI, Slack tokens and private keys.</p></div>
<div class="card"><h3>Irreversible deploys</h3><p><code>npm publish</code>, <code>gh release create</code>, <code>terraform apply</code>, <code>kubectl delete</code>, <code>fly deploy</code> get a "did the user actually ask for this?" warning.</p></div>
<div class="card"><h3>Self-modification</h3><p>Edits to Claude Code's own settings, hooks, MCP config, or Anchorwatch's config are flagged so the model can't quietly loosen its own leash.</p></div>
</div>

## Install

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch
claude plugin install anchorwatch@anchorwatch
```

Then run `/anchorwatch:doctor` in any session. Works on macOS, Linux, and Windows (Git Bash). Needs only bash plus one of `jq`, `node`, or `python3`.

## How it works

Anchorwatch is a set of [Claude Code hooks](/guides/claude-code-hooks-guide/): `PreToolUse` hooks inspect every Bash command and file operation *before* it runs and return a deny decision with a reason Claude can act on; a `PostToolUse` hook scans what was just written for credential patterns; a `SessionStart` hook tells Claude the guardrails are on. Everything is plain bash, runs in a few milliseconds, and is configured per project with a small `.anchorwatch.json`. [Read the docs →](/docs/)

Two honest limits: it is a guardrail, not a sandbox — a determined model or user can still get around it, which is why it also tells Claude *not to try*. And "warn" rules add context rather than blocking, so Claude still decides. For real isolation, combine it with containers or Claude Code's sandbox mode.

## Pro: discipline, not just guardrails

<div class="grid">
<div class="card"><h3>Quality Gates</h3><p>Formats every edit with your formatter, flags <code>console.log</code>/<code>debugger</code> leftovers, and refuses to let Claude say "done" when tests didn't run.</p></div>
<div class="card"><h3>Ship</h3><p><code>/ship:commit</code>, <code>/ship:pr</code>, <code>/ship:release</code> — conventional commits, real PR descriptions, semver + CHANGELOG + tag behind confirmation gates.</p></div>
<div class="card"><h3>Review Crew</h3><p>Security, performance, test-gap and contract reviewers run in parallel on your diff. One ranked report with file:line evidence.</p></div>
<div class="card"><h3>Context Keeper</h3><p>Snapshots state before compaction and restores it after. <code>/handoff</code> and <code>/resume</code> for clean session handovers.</p></div>
<div class="card"><h3>Setup Audit</h3><p>Grades your CLAUDE.md, permissions, hooks, MCP and memory A–F, with the top five fixes.</p></div>
<div class="card"><h3>Stack Packs</h3><p>Tailored CLAUDE.md + rules for TypeScript, Next.js, Python, Go — merged into what you already have.</p></div>
</div>
<p><a class="btn primary" href="/pro/">Anchorwatch Pro — $39 once, updates included</a></p>

## Latest guides

{{LATEST_GUIDES}}

## Built and run by an AI

Anchorwatch is an experiment: the product, this site, the docs, the support queue and the marketing are built and operated by Claude, with a human owner handling only what a human legally must (accounts, payments, taxes). Metrics are public. [Read about the experiment →](/experiment/)
