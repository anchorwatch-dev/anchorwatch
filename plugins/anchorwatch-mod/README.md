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
| Failure mode | A throw or a 10 s overrun **skips the hook and the tool runs** (fail-open), logged as `hook failed: <plugin>: … (tool.call; skipped; what is below it ran in its place)`. There is no `onFailure`/fail-closed flag; the maintainers declined one. The answer is `on(...).catch(($, e, next) => …)`, run on a grace budget with `next.called` and `next.error { kind, message, budget }`. This mod chains `.catch` at the call site and denies there unless `next` had already dispatched (then it replays so the model sees the real result). The chain is unconditional: the engine's module scan refuses a registration whose value is kept, so feature-detecting `.catch` is not expressible — see *Scan rules* below. |
| `$` used | `$.process.run` (git, read-only, only for a force push with no refspec) bounded by `$.clock.sleep`. A missing noun unloads the *whole* module at `$` build time, so the surface is kept small on purpose. |

Ambiguities we could not resolve from the source: the exact `options` argument
to `register`; one maintainer sketch wrote `e.input.command` where the cheat
sheet and a measured probe use `e.command` (the hook accepts both).

## Scan rules

Since 2.1.267, `claude plugin validate <mod> --strict` runs the engine's own
module scan — the same scan that runs when a host links the mod, so a module
it refuses does not load at all. Its refusals are the API's rules stated
outright, and they are narrower than the prose suggested. The ones that bind
this mod:

- The value of `on(...)` may not be **kept** — "assigned, passed, read, or
  returned from a nested function". It "takes `.catch(handler)` where it is
  called and nothing else", and one `.catch`: `.catch(...)` followed by
  another member is refused.
- `$` is always spelled `$.noun.event(...)` at the call site. Binding,
  passing, spreading, returning or reading `$`, a noun of it, or an event of
  it is refused. `$` may be passed only into a function declared at the top
  of the same file — never across an import. (`currentBranchOf` is exactly
  that, and validate reports `calls: $.clock.sleep (via currentBranchOf),
  $.process.run (via currentBranchOf)`.)
- `on` is always `on("<event>", hook)` with a literal event, `next.to` always
  `next.to(e, "<tier>")`, and the hook is a function literal or the name of
  one declared at the top of the file. `next` may not be bound or assigned to
  another name.
- No top-level `await` in a file the entry imports.

Run it before trusting a change:

```sh
npx -y @anthropic-ai/claude-code@latest plugin validate plugins/anchorwatch-mod --strict
```

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
`guard-bash.sh` and requires the verdicts to match, and pins the two scan
rules above against the `register.ts` source — this job has no Claude Code,
so the real scan cannot run in it.

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
guard (182 tests, `bun test`), and `claude plugin validate
plugins/anchorwatch-mod --strict` on 2.1.268 — manifest, hooks manifest and
the engine's module scan, which reports the hooks and the `$` calls it found.

Not verified: a live session. Whether the hook fires, and what `next.error`
carries when it does, remains to be measured with the command above. Until
2.1.267 the scan was not reachable either, and the first shape this mod
shipped with — a kept registration, `.catch` chained only when the host
offered it — was one the scan refuses, so it would not have loaded at all.
