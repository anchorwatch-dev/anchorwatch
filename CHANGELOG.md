# Changelog

All notable changes to the plugins in this repository. Format: [Keep a Changelog](https://keepachangelog.com); versions follow semver.

## anchorwatch [0.1.3] - 2026-09-15
### Fixed
- Nesting no longer hides a command from every Bash rule. Each rule anchors on `(^|[[:space:]])cmd[[:space:]]`, so one leading `(`, backtick or quote defeated all of them at once: `X=$(rm -rf /)`, `` Y=`rm -rf /` ``, `(rm -rf /)`, `(echo x > .env)`, `bash -c "rm -rf /"` and `sh -c "cat .env"` all passed clean, and `(cd /tmp; rm -rf /)` downgraded to a warning because the target token read as `/)`. `aw_segments` now unwraps command substitution, subshells, brace groups and a `sh -c "…"` payload before splitting, so the inner command starts a segment of its own and the existing rules see it. `is_dangerous_target` strips quoting left over from an unwrapped payload. Claude Code 2.1.271 closed the matching holes in its own Bash permission checks — a subshell or `cd`+`git` chain skipping the prompt, and shell variable declaration flags misrepresenting the command being run.
- `env-read` covers every command that prints a file whole, not just `cat`/`head`/`tail`/`less`/`bat`/`more`/`type`/`Get-Content`: `fmt`, `column`, `nl`, `od`, `xxd`, `hexdump`, `strings`, `base64`, `tac`, `rev`, `pr` and `fold` printed a `.env` into the transcript untouched. Same release of Claude Code fixed its own permission checks missing the file `fmt`, `column` "and similar commands" read. `grep`, `sed`, `awk` and `cut` stay off the list on purpose — they are how the rule's own remedy lists variable names without printing values. The rule also now matches a quoted (`cat ".env"`) or globbed (`cat .env*`) filename; `.env.example` and the other template names stay exempt, quoted or not.
### Changed
- No new rules and no rule weakened: the rule count is unchanged at 12 blocking and 13 warning. Test suite 138 → 173 cases.

## anchorwatch-mod [0.0.4] - 2026-09-15
### Fixed
- Both fixes above ported, so the two gates still agree on every command: `segments` unwraps the same nesting, `ENV_READ` carries the same reader list and quote/glob handling, and `isDangerousTarget` strips the same leftover quoting. The mod's tests cross-check each verdict against the classic bash guard, so a drift between them fails CI (284 cases, up from 216).

## anchorwatch [0.1.2] - 2026-09-12
### Added
- New blocking rule `secret-write`: a Bash command that *writes* a secret-bearing file is now denied, not just an `Edit`/`Write` tool call. `secret-files` only ever saw the file tools, so `tee .env`, `echo K=v > .env`, `cp /tmp/x .env`, `sed -i … .env` and `dd of=.env` all reached the same file through the shell — the rule's own list of protected paths, bypassed by changing tool. Covered destinations: shell redirections (`>`, `>>`, `2>`), `tee` arguments, a `cp`/`mv`/`install`/`rsync` target, the files an in-place editor (`sed -i`, `perl -pi`) rewrites, and `dd of=`. `.env.example` and the other template names stay writable. Claude Code 2.1.269 closed the matching hole in its own permission engine (an `Edit()` deny rule did not cover the file a Bash `tee` wrote); this closes it for the rule. Override as usual: `"rules": {"secret-write": "warn"}`.
### Changed
- The secret-path list now lives once in `lib.sh` as `aw_is_secret_path`, shared by `secret-files` and `secret-write`, instead of being spelled out in each guard. No change to which paths count as secret-bearing.

## anchorwatch-mod [0.0.3] - 2026-09-12
### Added
- `secret-write` ported, so the mod still carries every block-level Bash rule: `writeDests` finds a segment's write destinations and `isSecretPath` classifies them, both ports of the new bash helpers. With no `home` in context a `~` path is matched on its basename only (enough for `~/.ssh/id_rsa`, not for `~/.aws/config`) — documented in the README with the other unported context.

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
