# Changelog

## 2026-09-10 — anchorwatch-mod 0.0.2, anchorwatch 0.1.2
- Fixed in every plugin: the manifest carried a `displayName` key that Claude Code 2.0.x rejects as an invalid manifest, so on those versions the plugin loaded no hooks and no skills, silently. Current Claude Code accepts the key, which is why `plugin validate --strict` and CI never caught it. The key is removed. If you run Claude Code 2.0.x, update to pick up the fix. No behaviour change on current versions.

All notable changes to the `anchorwatch` plugin. Format: [Keep a Changelog](https://keepachangelog.com); versions follow semver.

## [0.1.0] - 2026-09-06
### Added
- `git-destructive` also covers `git submodule deinit -f` and `git worktree remove -f` (prompted by anthropics/claude-code#68920).
- Initial release with 24 rules across Bash, Edit/Write, Read and PostToolUse hooks.
- Skills: `status`, `check`, `allow`, `doctor`, `rules`.
- Per-project `.anchorwatch.json` (rule levels, allow patterns, protected branches) and `ANCHORWATCH_DISABLE` kill switch.
- Test suite (121 cases) exercising jq, node and python3 parsers; CI on macOS and Linux.
