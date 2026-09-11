# SEO plan (owned by the growth routine)

Goal: one verified, useful guide per day on a query real Claude Code users type, so search traffic compounds. Quality beats volume: a guide that is wrong costs more than no guide.

## Rules for every guide
- One primary query in the title, phrased the way people search it. Description answers it in one sentence.
- 700–1400 words. Every command and config shape verified against https://code.claude.com/docs/en/ (fetch the page; do not rely on memory) and, where possible, run locally.
- One runnable example, tested. Say which Claude Code version it was tested on.
- Two internal links to related guides or docs; at most one Anchorwatch mention, only where it genuinely fits, never in the first paragraph.
- Honest about limits. No invented numbers, no testimonials, no claims about Anthropic's plans.
- Frontmatter: title, description, date, updated. Slug = kebab-case of the primary query.
- After writing: `cd site && bun install && bun run build`, then check the guide index and llms.txt include it.

## Queue (take the first unchecked item; tick it in the PR; add new items at the bottom when you spot demand)
### Safety and permissions (core)
- [x] Claude Code hooks guide (/guides/claude-code-hooks-guide)
- [x] Skills vs subagents vs hooks
- [x] Claude Code permissions explained: allow, ask, deny, and settings.json examples (/guides/claude-code-permissions-explained)
- [ ] Claude Code deleted my files: what happened and how to prevent it (recovery steps, /rewind limits, hooks)
- [x] How to stop Claude Code from force-pushing or rewriting git history — covered by /guides/stop-claude-code-destructive-commands
- [x] Keeping .env and secrets out of Claude Code's reach — covered by /guides/keep-secrets-out-of-claude-code
- [ ] Claude Code --dangerously-skip-permissions: what it actually disables and safer alternatives
- [ ] Claude Code in CI: running headless with -p safely
- [ ] PreToolUse hook recipes: five copy-paste hooks with tests
### Configuration and workflow
- [ ] CLAUDE.md best practices: what to put in it and what to leave out
- [ ] Claude Code settings.json reference by example (user, project, local, managed)
- [ ] Claude Code plugins: how to write, validate and publish one
- [x] Claude Code marketplaces: adding a private marketplace for your team — covered by /guides/claude-code-plugin-marketplaces
- [ ] Subagents: writing a good agent file, tools allowlists and worktree isolation
- [ ] Skills: frontmatter fields explained (disable-model-invocation, allowed-tools, context: fork)
- [x] Claude Code Stop hooks: making "done" mean tests ran — covered by /guides/make-claude-code-run-tests
- [ ] Managing context: compaction, handoffs and what survives /compact
### Troubleshooting
- [ ] Claude Code permission prompt keeps appearing for cd && commands
- [ ] Claude Code ignores CLAUDE.md rules: why prose decays and what enforces
- [ ] Claude Code hook not firing: a checklist (matcher, JSON shape, exit codes, timeouts)
- [ ] "This workspace has not been trusted": which settings Claude Code holds back and how to accept trust (hit while testing the permissions guide; it is a verbatim stderr string people will search)
### Reference pages (regenerated, not written)
- [x] Claude Code release watch (/claude-code-releases, built from ops/state/release-watch.log)

## Refresh rule
Every fifth run, instead of a new guide, refresh the guide with the most traffic in ops/state/stats.json: re-verify commands against current docs, bump `updated`, tighten.
