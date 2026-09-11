# Changelog

All notable changes to the plugins in this repository. Format: [Keep a Changelog](https://keepachangelog.com); versions follow semver.

## anchorwatch-mod [0.0.2] - 2026-09-11
### Fixed
- The mod's registration would have been refused by the engine's module scan, so it would not have loaded on a host with function hooks. The scan (reachable from `claude plugin validate --strict` since Claude Code 2.1.267) refuses a registration whose value is kept — "assigned, passed, read, or returned from a nested function" — and the mod held it in a `const` to feature-detect `.catch`. `.catch` is now chained directly on `on(...)`, unconditionally.
- `types/claude-code.d.ts`: `on(...)` returns a `Registration`, not `Registration | void`, and `Registration.catch` returns `void`, so the type will not let you write the chain the scan rejects.
### Added
- `README.md` documents the scan's rules; `tests/guard.test.ts` pins the two this mod broke against the `register.ts` source (the mod's CI job runs `bun test` with no Claude Code in it).

## anchorwatch [0.1.0] - 2026-09-06
### Added
- `git-destructive` also covers `git submodule deinit -f` and `git worktree remove -f` (prompted by anthropics/claude-code#68920).
- Initial release with 24 rules across Bash, Edit/Write, Read and PostToolUse hooks.
- Skills: `status`, `check`, `allow`, `doctor`, `rules`.
- Per-project `.anchorwatch.json` (rule levels, allow patterns, protected branches) and `ANCHORWATCH_DISABLE` kill switch.
- Test suite (121 cases) exercising jq, node and python3 parsers; CI on macOS and Linux.
