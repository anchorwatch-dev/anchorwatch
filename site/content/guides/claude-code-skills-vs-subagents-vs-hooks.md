---
title: "Skills vs subagents vs hooks: which Claude Code extension point to use"
description: Claude Code has three ways to change how it behaves — skills, subagents and hooks. They solve different problems. A decision rule, the exact file layout for each, and the limits nobody mentions until you hit them.
date: 2026-09-09
updated: 2026-09-09
---
# Skills vs subagents vs hooks

Claude Code gives you three places to put behaviour that isn't in your prompt, and people reach for the wrong one constantly. The short version:

- **Skill** — knowledge or a procedure you want available *when it's relevant*. Loaded into context; the model decides whether to follow it.
- **Subagent** — work you want done in a *separate context window* with a different tool set, returning a summary.
- **Hook** — behaviour that must happen *every time*, whatever the model decides. Runs outside the model.

The dividing line that matters: skills and subagents are instructions, hooks are guarantees. If the answer to "what if the model ignores this?" is "that's a problem", you need a hook.

## Skills

A skill is a directory with a `SKILL.md` inside it:

| Scope | Path |
|---|---|
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` |
| Project | `.claude/skills/<skill-name>/SKILL.md` |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md`, invoked as `/plugin-name:skill-name` |

On conflicting names, enterprise beats personal beats project beats the bundled skills.

Loading is progressive: at startup Claude Code reads every skill's `description` so it knows what exists, and pulls the full body in only when the skill is invoked — by you typing `/skill-name`, or by the model deciding the description matches what you asked for. That makes the `description` the single most important line in the file. Two frontmatter fields control who may pull the trigger: `disable-model-invocation: true` makes it yours alone (right for a deploy or release procedure), and `user-invocable: false` hides it from `/` and leaves it as background knowledge the model can reach for.

Useful extras: `allowed-tools` pre-approves tools — but only for the turn that invokes the skill, and the grant clears after your next message, so it is a convenience, not a policy. `context: fork` runs the skill in an isolated subagent instead of inline, which is the bridge to the next section.

The cost is real and easy to forget. Every skill's description sits in context for the whole session — the listing budget is around 1% of the context window, and descriptions get truncated past it. Keep `SKILL.md` under about 500 lines and push reference material into sibling files in the skill directory. `/skill-doctor` (v2.1.252+) reports what your skills are actually costing you.

## Subagents

A subagent is a single Markdown file in `.claude/agents/` (project, commit it) or `~/.claude/agents/` (personal), with `name` and `description` required in frontmatter and the body serving as its system prompt. Optional fields worth knowing: `tools` (allowlist), `disallowedTools` (denylist, applied first), `model`, `permissionMode`, `maxTurns`, `skills` to preload, `memory`, and `isolation: worktree` to give it its own git worktree.

The point of a subagent is the context boundary. A non-fork subagent starts fresh: its own system prompt, the delegation message, your `CLAUDE.md` files and a git status snapshot — and explicitly *not* your conversation history. It does its work and hands back a summary, so a long search doesn't fill your main window with file dumps. Forks are the exception; they inherit the whole parent conversation.

Claude delegates automatically when a task matches a `description`, or you can force it: name the agent in your prompt, `@`-mention it to guarantee it runs, or run the entire session as one with `claude --agent code-reviewer`. Note that as of v2.1.198 `/agents` no longer opens a wizard — edit the files, or ask Claude to write one.

Limits to design around: at most 20 subagents run concurrently, nesting goes 3 layers below the main conversation, and subagents never get `Agent`, `AskUserQuestion`, `EndConversation` or `ScheduleWakeup` (forks excepted) — so a subagent can't stop and ask you a question. The built-in `Explore` and `Plan` agents are read-only and one-shot. And the `tools` allowlist is scoping, not a security boundary: it shapes what the agent reaches for, it isn't an enforcement layer you'd bet a production database on.

## Hooks

Hooks are the only one of the three that doesn't depend on the model's cooperation. They're commands Claude Code runs at fixed points — `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Stop`, `SessionEnd` and a couple of dozen others.

`PreToolUse` is the one that matters for guardrails, because it fires before the tool runs and can refuse. Two ways to block: exit with code 2, which blocks the call regardless of what else you print, or return JSON:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Destructive command blocked by hook"
  }
}
```

The `permissionDecisionReason` goes back to the model, so write it as an instruction — say what to do instead, not just "no".

Hooks live in `~/.claude/settings.json`, `.claude/settings.json` (committed, shared with your team), `.claude/settings.local.json`, managed policy settings, a plugin's `hooks/hooks.json`, or in skill and subagent frontmatter for hooks scoped to that skill's session or that agent's run.

That last row is the thing to steal: a subagent can carry its own hooks. An agent that's allowed to run migrations can ship the `PreToolUse` check that keeps it off production, in the same file.

## Picking one

Ask what failure looks like.

- *The model didn't know our conventions* → skill.
- *The model burned my context window rummaging through the repo* → subagent.
- *The model did something it shouldn't have been able to do* → hook.

Most non-trivial setups end up using all three, which is what plugins are for: one directory with `skills/`, `agents/`, `hooks/hooks.json` and a `.claude-plugin/plugin.json`, installed once and enabled per project. Use `${CLAUDE_PLUGIN_ROOT}` for every path inside it — hard-coded paths break the moment someone else installs your plugin.

One honest limit on hooks, since they're the layer people over-trust: a hook sees the tool call, not the intent behind it. Pattern-matching a `Bash` command catches the obvious destructive shapes and misses anything creatively spelled. That's a floor, not a ceiling — worth having, not worth mistaking for a sandbox. [Anchorwatch](/) is a plugin of exactly this kind of `PreToolUse` rule, with the test suite that goes with them, if you'd rather not write and maintain your own.
