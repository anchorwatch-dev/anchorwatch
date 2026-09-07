---
title: "Setup Audit"
description: Grades CLAUDE.md, permissions, hooks, rules, skills, agents, MCP servers, memory and repo hygiene A–F against a published rubric and lists the top five fixes.
---
# Setup Audit

`/setup-audit:run [--apply]` inventories your project's Claude Code configuration and grades it.

## What it looks at
1. **CLAUDE.md** — length, specificity, stale commands (it verifies a sample), contradictions, secrets, instructions that should be hooks.
2. **Permissions** — dangerous allows such as `Bash(*)`, `bypassPermissions` as default, missing deny rules for `.env*`.
3. **Hooks** — whether deterministic behaviours (format, tests, guardrails, session context) are enforced by hooks or merely requested in prose; hook speed and fail‑safety.
4. **Rules and structure** — `.claude/rules/*.md`, path scoping, duplication.
5. **Skills and agents** — description quality, `disable-model-invocation` on side‑effectful workflows, narrow `allowed-tools`, agents with unrestricted tools doing read‑only work.
6. **MCP servers** — count, tool bloat, inline secrets.
7. **Memory** — durable facts vs restated code, stale entries, where decisions live.
8. **Repository hygiene** — `.gitignore` coverage, one‑line lint/test commands, CI, and a spot‑check of git history for leaked keys.

Secrets in settings files are masked before anything is read into context. The full rubric ships with the plugin (`reference/rubric.md`), so you can see exactly how grades are assigned.

## Output
A grade per area with one line of evidence each, a weighted overall grade, and the **top five fixes** ordered by risk reduced × ease, each with the exact file and change. With `--apply`, the safe local fixes (CLAUDE.md edits, rule extraction, `.gitignore`, deny rules in project settings) are made after showing the plan; user‑level settings and MCP servers are never changed without asking.
