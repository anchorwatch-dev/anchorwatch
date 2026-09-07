---
title: "Quality Gates"
description: Format on every edit, flag debug leftovers, and refuse to let Claude say "done" when tests didn't run. Configuration and behaviour of the Pro Quality Gates plugin.
---
# Quality Gates

Quality Gates turns three "always do this" instructions into hooks that run every time.

## What it does

**Format on edit.** After every `Edit`, `Write` or `MultiEdit` on a code file, a `PostToolUse` hook runs the formatter your repository already uses. Detection: `biome.json` → Biome; `.prettierrc*`, `prettier.config.*` or a `prettier` key in `package.json` → Prettier; `[tool.ruff]` or `ruff.toml` → `ruff format`; `[tool.black]` → Black; `.go` → `gofmt`; `.rs` → `rustfmt`. Nothing runs if no formatter is configured, and a formatter failure never blocks the edit; Claude is told about it instead.

**Debug‑leftover scan.** The same hook checks non‑test code files for `console.log`/`debug`/`trace`, `debugger`, `print(`, `pdb.set_trace()`, `breakpoint()`, `binding.pry`, `dbg!(`, `var_dump(`. Matches are reported to Claude with line numbers. Test files, `scripts/`, and lines marked `// qg:allow` or `# qg:allow` are ignored.

**Test gate.** A `PostToolUse` hook on Bash notices test runners (`npm test`, `vitest`, `jest`, `pytest`, `go test`, `cargo test`, `rspec`, `dotnet test`, `gradle test`, `mix test`, `bats`, and more) and records whether the run looked like a pass or a failure. A `Stop` hook then checks: code was edited but no test ran; the last run failed; or code changed after the last run. In `remind` mode it reports this to you and Claude. In `enforce` mode it blocks the first attempt to end the turn so Claude goes and runs the tests, and never blocks twice in one session. Projects without any test setup are never nagged.

## Commands

- `/quality-gates:preflight` — runs lint → typecheck → tests → build using the project's own scripts and returns a scorecard. Nothing is fixed without asking.
- `/quality-gates:config <setting=value>` — edits the config file for you.

## Configuration

`.quality-gates.json` in the project root:

```json
{ "format": true, "debugScan": true, "testGate": "remind" }
```

`testGate` is `remind` (default), `enforce`, or `off`. Session state lives under `~/.claude/plugins/data/quality-gates/` and is keyed by session id, so parallel sessions don't interfere.
