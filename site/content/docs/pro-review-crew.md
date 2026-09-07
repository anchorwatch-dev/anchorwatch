---
title: "Review Crew"
description: Security, performance, test-gap and contract reviewers run in parallel on your diff and return one ranked, de-duplicated report with file:line evidence.
---
# Review Crew

Review Crew is four subagents with strict checklists and one orchestrating skill.

## `/review-crew:review [base-ref | PR-number] [--fix]`
Determines the diff (working tree vs `HEAD` by default, a git range if you give a base, or a PR via `gh pr diff`), launches all four reviewers in parallel with the diff and the list of changed files, then merges their findings: duplicates removed, anything it can disprove dropped, ranked CRITICAL → LOW. Output is a verdict (ready / merge with fixes / do not merge), the ranked findings, the test gaps, and a "checked and fine" list so you know the coverage. `--fix` applies critical and high fixes, adds the proposed tests, and re‑runs the suite.

## `/review-crew:security [base-ref]`
Only the security reviewer, for a fast pass before shipping auth, payment or data‑access changes.

## The reviewers
Each can be @‑mentioned directly (`@agent-review-crew:security-reviewer look at the auth changes`).

- **security-reviewer** — injection, authz/authn gaps, IDOR, secrets and config, XSS/SSRF/path traversal, crypto misuse, sessions, data exposure, new dependencies, race conditions and rate limits, infra-as-code.
- **perf-reviewer** — N+1 queries, missing indexes, unbounded loads, quadratic loops, blocking I/O in async paths, leaks, cache misuse, frontend re-renders, chatty APIs.
- **test-gap-finder** — changed behaviour with no test, uncovered error and edge paths, tests weakened to pass, brittle tests, missing regression test for a bug fix. Proposes concrete test cases in the project's style.
- **contract-reviewer** — breaking changes to APIs, schemas and migrations (rolling‑deploy safety), exported signatures, events, CLI flags and config; semver and docs implications.

Every finding must cite `path:line`, quote the evidence, give a concrete failure scenario and a fix. Reviewers read surrounding code before reporting; they never report from the diff alone, and they don't report style nits.
