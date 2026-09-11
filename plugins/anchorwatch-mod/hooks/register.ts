import type { On, ToolCallEvent } from 'claude-code'

import { decide, denyText, type DecideContext } from './rules'

/**
 * Anchorwatch as a mod: one `tool.call` hook on Bash that refuses the
 * commands the classic plugin's guard-bash.sh denies, with the same reason
 * text, and passes everything else beneath.
 *
 * Deny is `return { deny: reason }` without calling `next`; only that is a
 * refusal (a hook that neither calls `next` nor returns `{ deny }` is
 * skipped and the tool runs). Allow is `return next(e)`.
 *
 * Failure mode: the engine skips a hook that throws or overruns its 10 s
 * budget, and the tool runs (fail-open). The API's answer is `.catch` on
 * the registration, which runs on a grace budget and answers instead; we
 * chain it and deny there, so a broken guard says no rather than nothing.
 *
 * `.catch` is chained directly on the `on(...)` call, and the registration
 * is never held in a variable. That is not style: the engine scans the
 * module before it links it and refuses one whose registration value "is
 * kept (assigned, passed, read, or returned from a nested function)" — it
 * "takes .catch(handler) where it is called and nothing else", and one
 * `.catch` at that. Feature-detecting `.catch` (which this did while the
 * shape was a guess) is therefore not expressible, and needs not be: a
 * host that links mods at all is a host that ran that scan.
 *
 * `$` usage is deliberately small: `$.process.run` (git, read-only) to
 * learn the current branch when a force push names no refspec, and
 * `$.clock.sleep` to bound that lookup. Nothing else, so an unrelated
 * missing noun cannot unload the whole module.
 *
 * @param on the engine's registrar
 */
export function register(on: On, _options?: unknown) {
  let cwd: string | undefined

  on('session.start', ($, e, next) => {
    if (typeof e.cwd === 'string') cwd = e.cwd
    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = commandOf(e)
    if (command === undefined) return next(e)

    // Only pay for a git lookup when a force push has no explicit refspec.
    let currentBranch: string | undefined
    if (/(^|\s)git\s+push(\s|$)/.test(command) && /\s(--force|-f|--force-with-lease|--force-if-includes)/.test(command)) {
      currentBranch = await currentBranchOf($, cwd)
    }

    const ctx: DecideContext = { cwd, currentBranch }
    const deny = decide(command, ctx)
    if (deny) return { deny: denyText(deny) }

    return next(e)
  }).catch((_$, _e, next) => {
    // If we had already dispatched beneath, the tool ran: replay so the
    // model sees its real result. Otherwise the guard never answered:
    // fail closed.
    if (next.called) return next(_e)
    const kind = next.error?.kind ?? 'error'
    return {
      deny:
        `Anchorwatch guard failed to run (${kind}${next.error?.message ? ': ' + next.error.message : ''}). ` +
        'The command was not executed because the guard could not check it. Tell the user; do not retry blindly.',
    }
  })
}

/**
 * The Bash command on the event. The cheat sheet and a measured probe on
 * 2.1.263 spell it `e.command` (the tool input is spread onto `e`); one
 * maintainer sketch wrote `e.input.command`, so that is accepted too.
 */
function commandOf(e: ToolCallEvent): string | undefined {
  const flat = (e as { command?: unknown }).command
  if (typeof flat === 'string') return flat
  const nested = (e as { input?: { command?: unknown } }).input?.command
  return typeof nested === 'string' ? nested : undefined
}

type BranchHost = {
  process: { run: (argv: readonly string[], init?: { cwd?: string; timeoutMs?: number }) => Promise<{ exitCode: number; stdout: string }> }
  clock: { sleep: (ms: number) => Promise<void> }
}

/** `git rev-parse --abbrev-ref HEAD` in cwd, bounded to 2 s; undefined when unknown. */
async function currentBranchOf($: BranchHost, cwd: string | undefined): Promise<string | undefined> {
  try {
    const run = $.process
      .run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { ...(cwd && { cwd }), timeoutMs: 2000 })
      .then(r => (r.exitCode === 0 ? r.stdout.trim() : undefined), () => undefined)
    const timeout = $.clock.sleep(2000).then(() => undefined)
    const branch = await Promise.race([run, timeout])
    return branch && branch !== 'HEAD' ? branch : undefined
  } catch {
    return undefined
  }
}
