# Changelog

All notable changes to the `anchorwatch` plugin. Format: [Keep a Changelog](https://keepachangelog.com); versions follow semver.

## [0.1.0] - 2026-09-06
### Added
- `git-destructive` also covers `git submodule deinit -f` and `git worktree remove -f` (prompted by anthropics/claude-code#68920).
- Initial release with 24 rules across Bash, Edit/Write, Read and PostToolUse hooks.
- Skills: `status`, `check`, `allow`, `doctor`, `rules`.
- Per-project `.anchorwatch.json` (rule levels, allow patterns, protected branches) and `ANCHORWATCH_DISABLE` kill switch.
- Test suite (121 cases) exercising jq, node and python3 parsers; CI on macOS and Linux.
