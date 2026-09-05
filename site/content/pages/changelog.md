---
title: Changelog
description: Release notes for the Anchorwatch and Anchorwatch Pro plugins for Claude Code.
---
# Changelog

Subscribe via [RSS](/changelog.xml). Versions follow semver; the plugins pin `version` in their manifests, so you receive an update whenever a number changes.

## anchorwatch 0.1.0 — 2026-09-06
- Initial release. 24 rules: 11 blocking (dangerous recursive delete, force push to protected branches, destructive git, DROP/TRUNCATE/unscoped DELETE, curl|sh, disk destruction, chmod 777, reading .env files, writing secret files, editing .git internals, reading secret files) and 13 warning (other recursive deletes, force pushes to feature branches, ref deletion, env dumps, publish/deploy/infra commands, sudo, broad kills, shell startup edits, lockfile edits, self-configuration, CI/infra files, writes outside the project, credential patterns in written content).
- Skills: `/anchorwatch:status`, `/anchorwatch:check`, `/anchorwatch:allow`, `/anchorwatch:doctor`, `/anchorwatch:rules`.
- Per-project `.anchorwatch.json` with rule levels, allow patterns and protected branches; `ANCHORWATCH_DISABLE=1` kill switch.
- Tested with jq, node and python3 JSON parsers on macOS and Linux.

## anchorwatch-pro 0.1.0 — 2026-09-06
- Initial release of Quality Gates, Ship, Review Crew, Context Keeper, Setup Audit, and Stack Packs.
