---
title: "Making Claude Code actually run the tests before it says done"
description: Why models declare victory without running tests, what CLAUDE.md can and cannot fix, and a Stop hook pattern that tracks edits and test runs to gate the end of a turn.
date: 2026-09-06
updated: 2026-09-06
---
# Making Claude Code actually run the tests

"Done — the fix is in place." Then you run the suite and three tests fail. The model didn't lie; it just optimised the visible task (edit the code) and treated verification as optional. `CLAUDE.md` lines like *"always run tests before finishing"* help on short tasks and fade on long ones, because instructions compete with everything else in context.

## Make it deterministic
Claude Code fires a `Stop` hook when the model ends its turn. If that hook exits with code 2 and a message on stderr, the turn doesn't end: Claude sees the message and keeps working. That's the enforcement point. The logic:

1. **Track edits.** A `PostToolUse` hook on `Edit|Write|MultiEdit` appends each edited code file to a per-session list (skip markdown, config, tests-only edits if you like).
2. **Track test runs.** A `PostToolUse` hook on `Bash` notices commands that look like a test runner (`npm test`, `pytest`, `go test`, `cargo test`, `vitest`, `jest`, …) and records a timestamp and whether the output looked like a failure.
3. **Gate the stop.** The `Stop` hook compares: code edited but no test run → block once with *"N files changed, tests not run"*; last run failed → block with *"the last test run failed; don't report done"*; edits after the last run → *"changes since the last run are untested"*.

Block **once** per session (write a marker file), otherwise a project with a genuinely broken suite loops forever. And make "remind" the default — output the message as `systemMessage` so both you and the model see it — with "enforce" as the opt-in for people who want the hard gate.

## Keep it fast and quiet
- Only count files with code extensions; a README edit shouldn't demand a test run.
- Check that the project *has* tests (a `test` script, `pytest.ini`, `go.mod`, a `tests/` directory) before nagging.
- Store state under `${CLAUDE_PLUGIN_DATA}` or `~/.claude/…`, keyed by `session_id`, so parallel sessions don't confuse each other.

## Formatting belongs in the same layer
The other "always do X" instruction people put in CLAUDE.md is "run prettier". A `PostToolUse` hook that runs the repo's formatter on the edited file — only if the repo has one configured — removes a whole category of noisy diffs and review comments. Same for flagging `console.log`/`debugger`/`print(` in non-test code right after it's written, while the model is still looking at that file.

## The packaged version
[Quality Gates](/pro/) in Anchorwatch Pro implements exactly this: format-on-edit for prettier/biome/ruff/black/gofmt/rustfmt, a debug-leftover scan with `// qg:allow` escapes, test-run tracking for a dozen runners, and a `Stop` gate with `remind` / `enforce` / `off` modes in `.quality-gates.json`. `/quality-gates:preflight` runs lint → typecheck → tests → build and returns a scorecard so "is this ready?" has an evidence-based answer.

## What it won't do
A gate can make the model *run* the tests; it can't make the tests good. Pair it with a review that looks for weakened assertions and skipped cases — the `test-gap-finder` reviewer in Review Crew flags tests that were modified to pass rather than code that was fixed.
