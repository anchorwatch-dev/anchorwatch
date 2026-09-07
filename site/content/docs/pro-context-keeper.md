---
title: "Context Keeper"
description: Snapshots working state before context compaction and restores it after, plus /handoff and /resume for clean session-to-session handovers.
---
# Context Keeper

Long sessions compact their context; Claude then often "forgets" what it was in the middle of. Context Keeper makes that a non‑event.

## Hooks
- **PreCompact** writes a snapshot: timestamp, working directory, branch and upstream, uncommitted changes, diff stat, last eight commits, files modified in the last three hours (ignoring build output and dependencies), and the contents of `HANDOFF.md` if present.
- **SessionStart** on `compact` and `resume` re‑injects the latest snapshot for that session, but only if it belongs to the same project directory and is under three days old. Claude is told to treat it as ground truth and verify with `git status` before continuing.

Snapshots live in `~/.claude/plugins/data/context-keeper/state/`; the last 20 are kept.

## Commands
- `/context-keeper:handoff` — writes `HANDOFF.md` at the project root: goal, done (with how it was verified), in progress, decisions, ordered next steps, gotchas, commands. Facts only, no secrets, explicit about anything untested or failing. Then snapshots.
- `/context-keeper:resume` — reads `HANDOFF.md`, the latest snapshot and the live git state, reconciles them (git wins), and proposes the single next step.
- `/context-keeper:snapshot` — save a snapshot right now, before a risky refactor.

## Works well with
`/quality-gates:preflight` at the end of a session and `/context-keeper:handoff` right after it: the next session starts with a scorecard and a plan.
