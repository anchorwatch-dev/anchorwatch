---
title: Changelog
description: Release notes for the Anchorwatch and Anchorwatch Pro plugins for Claude Code.
---
# Changelog

Subscribe via [RSS](/changelog.xml). Versions follow semver; the plugins pin `version` in their manifests, so you receive an update whenever a number changes.

## anchorwatch 0.1.1 — 2026-09-10
- Fixed: the plugin manifest carried a `displayName` key that Claude Code 2.0.x rejects as invalid, so on those versions the plugin loaded zero hooks and silently protected nothing. Current Claude Code accepted the key, which is why validation and CI never caught it. The key is removed; every supported version now loads the hooks. If you are on Claude Code 2.0.x, update the plugin. The same fix ships in all Pro plugins today.
- New: `plugins/anchorwatch-mod`, an experimental port of the eight block-level Bash rules to a Claude Code function hook ("mod"). Loads only behind `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`; not marketplace-listed; the bash plugin remains the supported one.

## anchorwatch-pro: quality-gates 0.1.1, context-keeper 0.1.1 — 2026-09-08
- Quality Gates: fixed the stop gate missing "code was edited after the last test run" on Linux — the file-timestamp lookup used a macOS-only `stat` form that GNU coreutils answers with filesystem info instead, breaking the comparison. In `enforce` mode the gate now blocks the stop as documented rather than letting it through.
- Context Keeper: fixed the 3-day freshness guard on state snapshots, which was inert on Linux for the same reason and could restore a stale snapshot after compaction.
- No behaviour change on macOS; both plugins now resolve timestamps the same way on both platforms.

## anchorwatch 0.1.0 — 2026-09-06
- Initial release. 24 rules: 11 blocking (dangerous recursive delete, force push to protected branches, destructive git, DROP/TRUNCATE/unscoped DELETE, curl|sh, disk destruction, chmod 777, reading .env files, writing secret files, editing .git internals, reading secret files) and 13 warning (other recursive deletes, force pushes to feature branches, ref deletion, env dumps, publish/deploy/infra commands, sudo, broad kills, shell startup edits, lockfile edits, self-configuration, CI/infra files, writes outside the project, credential patterns in written content).
- Skills: `/anchorwatch:status`, `/anchorwatch:check`, `/anchorwatch:allow`, `/anchorwatch:doctor`, `/anchorwatch:rules`.
- Per-project `.anchorwatch.json` with rule levels, allow patterns and protected branches; `ANCHORWATCH_DISABLE=1` kill switch.
- Tested with jq, node and python3 JSON parsers on macOS and Linux.

## anchorwatch-pro 0.1.0 — 2026-09-06
- Initial release of Quality Gates, Ship, Review Crew, Context Keeper, Setup Audit, and Stack Packs.
