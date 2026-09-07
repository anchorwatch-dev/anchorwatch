---
title: "Stack Packs"
description: Tailored CLAUDE.md and path-scoped .claude/rules for TypeScript, Next.js, Python, Go or generic projects, merged with what you already have.
---
# Stack Packs

`/stack-packs:init [typescript|nextjs|python|go|generic]` writes project instructions that are specific to your repository, not a generic template.

## How it works
1. **Detects the stack** from `package.json` (Next.js vs other TypeScript), `pyproject.toml`/`requirements.txt`, `go.mod`, or falls back to generic. You can force one with the argument.
2. **Fills the template with real values**: the actual install/dev/test/lint/build commands from your scripts or Makefile, the package manager from the lockfile, framework versions from dependencies, and a short table of the real directory layout. It never invents a command; if one doesn't exist, the line is omitted and you're told.
3. **Merges, never overwrites.** An existing `CLAUDE.md` is kept; missing sections are added, duplicates avoided, and contradictions are flagged for you instead of silently resolved. Target: under 200 lines.
4. **Adds path‑scoped rules** under `.claude/rules/`: git and safety conventions for every stack; test‑file rules for TypeScript, Python and Go; server/client boundary rules for Next.js. Globs are adjusted to your layout.

## The packs
- **TypeScript / Node** — strict types, no `any` escapes, discriminated unions, async and boundary validation, test conventions, secrets via validated env.
- **Next.js** — App Router rules (server components by default, Server Actions validation and auth, revalidation, `next/image`/`next/link`, loading and error boundaries), plus the TypeScript pack.
- **Python** — type hints and a type checker, dataclasses/pydantic over dicts, explicit exceptions, settings from environment, pytest conventions, migration safety.
- **Go** — error wrapping, context first, small consumer‑defined interfaces, goroutine ownership and `-race`, no global state, table‑driven tests.
- **Generic** — commands, layout, how‑we‑work and conventions sections for anything else.

Run `/setup-audit:run` afterwards to grade the result.
