---
title: Pro plugins
description: Documentation for the six Anchorwatch Pro plugins — Quality Gates, Ship, Review Crew, Context Keeper, Setup Audit, Stack Packs.
---
# Pro plugins

[Anchorwatch Pro](/pro/) is six plugins delivered through a private marketplace. Each has its own page below. All of them run locally; none send anything anywhere.

| Plugin | What it does | Entry points |
|---|---|---|
| [Quality Gates](/docs/pro-quality-gates/) | Formats every edit, flags debug leftovers, gates the end of a turn on tests | hooks · `/quality-gates:preflight` · `/quality-gates:config` |
| [Ship](/docs/pro-ship/) | Conventional commits, PRs, semver releases with confirmation gates | `/ship:commit` · `/ship:pr` · `/ship:release` · `/ship:changelog` |
| [Review Crew](/docs/pro-review-crew/) | Four specialist reviewers in parallel, one ranked report | `/review-crew:review` · `/review-crew:security` · four agents |
| [Context Keeper](/docs/pro-context-keeper/) | State snapshots around compaction, handoff and resume | hooks · `/context-keeper:handoff` · `:resume` · `:snapshot` |
| [Setup Audit](/docs/pro-setup-audit/) | Grades your Claude Code setup A–F with the top five fixes | `/setup-audit:run [--apply]` |
| [Stack Packs](/docs/pro-stack-packs/) | Tailored CLAUDE.md and rules for your stack | `/stack-packs:init [stack]` |

## Install

After purchase, connect GitHub in your Polar portal and accept the repository invitation (the [thanks page](/thanks/) walks through it), then:

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch-pro
claude plugin install quality-gates@anchorwatch-pro   # and any of the others
```

Inside a session, `/help` → Custom commands lists every installed skill with its description. Updates arrive through the marketplace like any plugin; `/plugin marketplace update anchorwatch-pro` forces a refresh.

## Support

Open an issue in the private `anchorwatch-pro` repository (visible once you have access) or email hello@anchorwatch.sh. Issues are triaged daily.
