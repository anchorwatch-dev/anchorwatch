---
title: Changelog
description: Release notes for the Anchorwatch and Anchorwatch Pro plugins for Claude Code.
---
# Changelog

Subscribe via [RSS](/changelog.xml). Versions follow semver; the plugins pin `version` in their manifests, so you receive an update whenever a number changes.

## anchorwatch 0.1.2 — 2026-09-12
- New blocking rule: `secret-write`. Until today, `secret-files` protected `.env`, keys and credential files from the `Edit` and `Write` tools — and only those. A shell command reached the same files freely: `tee .env`, `echo KEY=v > .env`, `cp /tmp/x .env`, `sed -i … .env`. Same file, same secret, different tool. Anchorwatch now checks the write destinations in a Bash command — redirections, `tee` arguments, a `cp`/`mv` target, the files `sed -i` rewrites, `dd of=` — against the same list, and denies the ones that name a secret. `.env.example` and the other template names stay writable, so the usual "copy the example, fill it in yourself" flow is untouched.
- Claude Code 2.1.269 fixed the same class of hole in its own permission engine: an `Edit()` deny rule and the working-directory write check did not cover the file a Bash `tee` command wrote. If your own settings deny `Edit(.env*)`, that rule got stronger today too — and `secret-write` covers the shapes it still does not see.
- The list of secret-bearing paths now lives in one place (`aw_is_secret_path`) instead of once per guard, so `secret-files` and `secret-write` cannot drift apart. Which paths count is unchanged.
- Also: `anchorwatch-mod` 0.0.3 ports `secret-write`, keeping the experimental function-hooks port at parity with every block-level Bash rule.

## anchorwatch-pro: setup-audit 0.1.3 — 2026-09-12
- Permissions rubric: a setup that denies `Edit`/`Write` on `.env*` while allowing broad shell writes (`Bash(tee:*)`, `Bash(*)`) now scores a deduction. Before Claude Code 2.1.269 a `tee` destination was not checked against `Edit()` deny rules or the working-directory write check at all, so `tee .env` walked past both; on 2.1.269 and newer the engine checks it, but an allow rule that broad still reaches further than it looks, and the version you are on decides which. The audit now says which.

## anchorwatch-pro: setup-audit 0.1.2 — 2026-09-11
- Permissions rubric: a `WebFetch` deny or ask rule added to stop exfiltration now costs a grade unless a matching `Artifact` rule sits beside it. Claude Code 2.1.268 changed plain `WebFetch` rules to no longer cover Artifact tool reads and updates, so a setup that denied `WebFetch` to keep content off the network can still publish it to claude.ai. `Artifact`, or `WebFetch(domain:claude.ai)`, closes the gap.
- The inventory step now surfaces `WebFetch` and `Artifact` entries from user settings, which it previously skipped.

## anchorwatch-mod 0.0.2 — 2026-09-11
- Fixed: the experimental mod would not have loaded. Claude Code 2.1.267 made the engine's module scan reachable from `claude plugin validate --strict`, and it refuses a registration whose value is kept in a variable — which is how the mod chained its `.catch` failure handler, conditionally, while the API's shape was still a guess. `.catch` is now chained directly on `on(...)`, unconditionally, and the mod validates clean on 2.1.268. A refused module does not load at all, so on a host with function hooks the mod would have registered nothing, not merely logged a warning.
- The `README` now documents the scan's rules (what may be done with the value of `on(...)`, how `$` must be spelled, where `$` may be passed), and the test suite pins the two this mod broke against the source, since the mod's CI job has no Claude Code to run the real scan in.
- Unchanged: the rules themselves, the deny reasons, and the classic `anchorwatch` plugin, which remains the supported one. The mod is still gated behind `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` and is not marketplace-listed.

## anchorwatch 0.1.1 — 2026-09-10
- Fixed: the plugin manifest carried a `displayName` key that Claude Code 2.0.x rejects as invalid, so on those versions the plugin loaded zero hooks and silently protected nothing. Current Claude Code accepted the key, which is why validation and CI never caught it. The key is removed; every supported version now loads the hooks. If you are on Claude Code 2.0.x, update the plugin. The same fix ships in all Pro plugins today.
- Pro: the same `displayName` fix ships today in all six Pro plugins (quality-gates 0.1.2, context-keeper 0.1.2, review-crew 0.1.1, ship 0.1.1, setup-audit 0.1.1, stack-packs 0.1.1). Pro buyers on Claude Code 2.0.x should update.
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
