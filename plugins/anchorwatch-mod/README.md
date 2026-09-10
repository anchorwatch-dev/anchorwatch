# anchorwatch-mod (experimental)

Anchorwatch's Bash **deny** rules as a Claude Code *mod*: a plugin whose
behaviour is a TypeScript hooks module (`hooks/register.ts`) instead of
shell scripts. It is a prototype written against a pre-release API.

- It loads **only** when function hooks are enabled:
  `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/anchorwatch-mod`.
  Without the flag the module is ignored and this plugin does nothing.
- The classic plugin at `plugins/anchorwatch` is untouched and remains the
  supported one. Run both and the classic hook sits beneath this one
  (command hooks run inside `next(e)`); they agree on every fixture.
- The API it targets "may change between releases without notice"
  (anthropics/claude-code `mods/README.md`). Expect breakage.

## What it ports

The eight rules whose default level is `block` in `guard-bash.sh`, with the
same regexes, the same segment split (`&&`, `||`, `;`, `|`, newline) and the
same reason text:

`rm-recursive-dangerous`, `git-force-push-protected`, `git-destructive`,
`sql-destructive`, `pipe-to-shell`, `disk-destroy`, `perm-broad`, `env-read`.

Not ported (yet): the warn rules (there is no verified additive-context
channel on `tool.call`), `.anchorwatch.json` overrides (rule levels, `allow`
patterns, `protectedBranches`), the `ANCHORWATCH_DISABLE` kill switch, and
the Edit/Write/Read guards. `$HOME` as a literal path is not resolved; the
`/Users/*`, `/home/*` and `/root` patterns cover it in practice.

## The API, as used here

Sources: the "Claude Mods: the $ cheat sheet" (Anthropic, 2026-09-09, in
anthropics/claude-code#91870), the three first-party mods under
`anthropics/claude-code/mods`, and measured probes reported in that thread.

| | |
| --- | --- |
| Module | `hooks/hooks.json` `{ "modules": ["./register.ts"] }`; the module exports `register(on, options)`. |
| Event | `on("tool.call", { tool: "Bash" }, async ($, e, next) => …)`. `e = { tool, tool_use_id, agentId?, …input }`, so the command is `e.command`. |
| Allow | `return next(e)`: every hook beneath, then core runs the tool; resolves with the result. |
| Deny | `return { deny: "reason" }` **without** calling `next`. Only that is a refusal: a hook that returns anything else without calling `next` is skipped and the tool runs. An empty reason was treated as allow on 2.1.260 (fixed by 2.1.261); the model routes around a reason it cannot read, so the text matters. |
| Order | Five tiers, `prepend > user > append > builtin > core`; earlier registration wraps later ("order is nesting"). A `--plugin-dir` mod sits in the `user` tier. `tool.call` wraps `classic.PreToolUse`, so this hook runs before the classic bash guard. |
| Failure mode | A throw or a 10 s overrun **skips the hook and the tool runs** (fail-open), logged as `hook failed: <plugin>: … (tool.call; skipped; what is below it ran in its place)`. There is no `onFailure`/fail-closed flag; the maintainers declined one. The cheat sheet's answer is `on(...).catch(($, e, next) => …)`, run on a grace budget with `next.called` and `next.error { kind, message, budget }`. This mod chains `.catch` when the host returns a registration with it, and denies there unless `next` had already dispatched (then it replays so the model sees the real result). On builds where `on()` returns nothing (2.1.263), the hook is still registered and the default fail-open applies. |
| `$` used | `$.process.run` (git, read-only, only for a force push with no refspec) bounded by `$.clock.sleep`. A missing noun unloads the *whole* module at `$` build time, so the surface is kept small on purpose. |

Ambiguities we could not resolve from the source: the exact `options` argument
to `register`; whether `.catch` is present on the build you have (it is on the
2026-09-09 cheat sheet, not in probes of 2.1.263); one maintainer sketch wrote
`e.input.command` where the cheat sheet and a measured probe use `e.command`
(the hook accepts both).

## Types

`types/claude-code.d.ts` is a **hand-written stand-in** for the declarations
`/plugin-types` writes inside a flag-enabled Claude Code (>= 2.1.263). It was
not available where this was written (Claude Code 2.0.53). Replace it with
the real output:

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude   # then /plugin-types, save under types/
```

## Test

```sh
cd plugins/anchorwatch-mod && bun test
```

`tests/guard.test.ts` drives the handler with synthetic `$`, `e` and `next`
(no session): every known-bad command must deny without calling `next` and
with a non-empty reason; every known-good command must call `next` once and
pass its result through; the `.catch` path must deny when the guard never
dispatched. It then runs the same commands through the classic
`guard-bash.sh` and requires the verdicts to match.

## Try it live

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude -p --plugin-dir plugins/anchorwatch-mod \
  --debug-file ./mod.log "run: git push --force origin main"
grep -E 'resolved by a hooks module|hook failed|anchorwatch-mod' mod.log
```

Expect `resolved by a hooks module (deny: Anchorwatch blocked this: force push
to protected branch 'main' …)` and no push.

## Status

Verified: the synthetic-event suite and the parity check against the classic
guard (181 tests, `bun test`), and `claude plugin validate` on the manifest.

Not verified: a live session. The machine this was written on runs Claude
Code 2.0.53, which has no function hooks; there the flag is ignored, the
module never loads, and a probe (`-p --plugin-dir … --allowedTools
"Bash(cat .env)"` against a throwaway `.env`) ran the command. Whether the
hook fires under a >= 2.1.263 build, and whether `.catch` is offered there,
remains to be measured with the command above.
