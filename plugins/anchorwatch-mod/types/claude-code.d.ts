/**
 * STAND-IN type declarations for the `claude-code` module that function
 * hooks import from.
 *
 * The real declarations are written by `/plugin-types` inside a Claude Code
 * build that has function hooks (>= 2.1.263 with
 * CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1). That command was not available on
 * the machine this prototype was written on (Claude Code 2.0.53), so this
 * file hand-declares only the names this mod and the tests use, shaped
 * after the "Claude Mods: the $ cheat sheet" (Anthropic, 2026-09-09), the
 * three first-party mods under anthropics/claude-code/mods, and measured
 * probes reported in anthropics/claude-code#91870.
 *
 * Replace this file with the `/plugin-types` output when available; the
 * mod's own code should compile unchanged against it. Anything here that
 * the real declarations contradict is a bug in this file, not the engine.
 */
declare module 'claude-code' {
  /** The five tiers, authority decreasing toward core. */
  type Tier = 'prepend' | 'user' | 'append' | 'builtin' | 'core'

  /** Where `next.to` may continue (managed tiers only). */
  type TargetTier = 'append' | 'builtin' | 'core'

  /**
   * `tool.call`: `{ tool, tool_use_id, agentId?, ...input }`. For Bash the
   * spread input carries `command` (and `description`, `timeout` when given).
   */
  interface ToolCallEvent {
    readonly tool: string
    readonly tool_use_id?: string
    readonly agentId?: string
    readonly command?: string
    readonly description?: string
    readonly timeout?: number
    readonly [key: string]: unknown
  }

  /** `session.start`: `{ cwd, ... }` once per session. */
  interface SessionStartEvent {
    readonly cwd?: string
    readonly [key: string]: unknown
  }

  /** What a `tool.call` hook resolves with: the tool's result, or a refusal. */
  type ToolCallResult = { deny: string } | { result: unknown } | Record<string, unknown>

  interface EventMap {
    'tool.call': ToolCallEvent
    'session.start': SessionStartEvent
  }

  interface ResultOf {
    'tool.call': ToolCallResult
    'session.start': unknown
  }

  type EventName = keyof EventMap

  /** The continuation: every hook beneath, then core. */
  interface Next<E, R> {
    (e: E): Promise<R>
    readonly to: (e: E, tier: TargetTier) => Promise<R>
    readonly origin: { plugin?: string; tier: Tier | 'engine' } | string
    readonly event: string
    readonly trace?: readonly unknown[]
    readonly signal?: AbortSignal
  }

  /** In `.catch`: whether the hook had dispatched, and why it was cut short. */
  interface CatchNext<E, R> extends Next<E, R> {
    readonly called: boolean
    readonly error: { kind: string; message?: string; budget?: number }
  }

  interface ProcessRunInit {
    cwd?: string
    env?: Record<string, string>
    timeoutMs?: number
  }

  interface ProcessRunResult {
    exitCode: number
    stdout: string
    stderr: string
  }

  /** `$`: the engine interface. Every method on it is itself an event. */
  interface EngineInterface {
    process: { run: (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult> }
    clock: {
      now: () => number
      sleep: (ms: number) => Promise<void>
    }
    session: {
      cwd: () => Promise<string>
      id: () => Promise<string>
    }
    ui: { log: (text: string) => void }
    [noun: string]: unknown
  }

  type Handler<K extends EventName> = (
    $: EngineInterface,
    e: EventMap[K],
    next: Next<EventMap[K], ResultOf[K]>,
  ) => ResultOf[K] | Promise<ResultOf[K]>

  type CatchHandler<K extends EventName> = (
    $: EngineInterface,
    e: EventMap[K],
    next: CatchNext<EventMap[K], ResultOf[K]>,
  ) => ResultOf[K] | Promise<ResultOf[K]>

  /** What `on(...)` returns: chainable `.catch` (cheat sheet 2026-09-09; absent on 2.1.263). */
  interface Registration<K extends EventName> {
    catch: (fn: CatchHandler<K>) => Registration<K>
  }

  /** The registrar handed to `register(on, options)`. */
  interface On {
    <K extends EventName>(event: K, handler: Handler<K>): Registration<K> | void
    <K extends EventName>(
      event: K,
      matcher: Partial<Record<string, string | readonly string[]>>,
      handler: Handler<K>,
    ): Registration<K> | void
  }

  type Register = (on: On, options?: unknown) => void
}
