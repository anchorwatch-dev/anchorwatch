/**
 * Anchorwatch DENY rules for the Bash tool, ported from
 * plugins/anchorwatch/scripts/guard-bash.sh (the classic command hook).
 *
 * Pure: no `$`, no I/O. The hook in register.ts gathers context (cwd, the
 * current git branch) and calls `decide`; the tests call it directly with
 * synthetic commands. The regexes are the bash script's POSIX EREs with
 * `[[:space:]]` written `\s`; the segment split is lib.sh's `aw_segments`.
 *
 * Only rules whose default level is `block` are ported. The classic
 * plugin's warn rules (rm-recursive, git-force-push on a feature branch,
 * publish, sudo, ...) are not: `tool.call` has no additive-context
 * channel in the API we could verify, so a warning would have no home.
 */

export type RuleId =
  | 'rm-recursive-dangerous'
  | 'git-force-push-protected'
  | 'git-destructive'
  | 'sql-destructive'
  | 'pipe-to-shell'
  | 'disk-destroy'
  | 'perm-broad'
  | 'env-read'

export type Deny = { rule: RuleId; reason: string }

export type DecideContext = {
  /** The session's working directory (`rm -rf <cwd>` is dangerous). */
  cwd?: string
  /** The user's home directory, when known (`rm -rf /Users/x` is caught by pattern anyway). */
  home?: string
  /** Branches a force push may never target. Defaults to `DEFAULT_PROTECTED_BRANCHES`. */
  protectedBranches?: readonly string[]
  /**
   * The branch checked out in cwd, for `git push --force` with no refspec.
   * `undefined` means unknown: the push is then not treated as protected,
   * matching the bash script (which warns rather than denies in that case).
   */
  currentBranch?: string
}

export const DEFAULT_PROTECTED_BRANCHES: readonly string[] = [
  'main',
  'master',
  'production',
  'prod',
  'release',
]

/**
 * lib.sh `aw_segments`: split on `&&`, `||`, `;`, `|` and newlines, then
 * trim leading whitespace. Rough but effective, and identical to the
 * classic plugin so both gates agree on what a segment is.
 */
export function segments(command: string): string[] {
  return command
    .split(/&&|\|\||;|\||\n/)
    .map(s => s.replace(/^\s+/, ''))
    .filter(s => s.length > 0)
}

const RM_RECURSIVE = /(^|\s)(sudo\s+)?rm\s+(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)(\s|$)/
const RM_PREFIX = /^\s*(sudo\s+)?rm\s+/
const GIT_PUSH = /(^|\s)git\s+push(\s|$)/
const GIT_FORCE_FLAG = /\s(--force|-f|--force-with-lease(=[^\s]*)?|--force-if-includes)(\s|$)/
const GIT_DESTRUCTIVE =
  /(^|\s)git\s+(reset\s+--hard|clean\s+-[a-zA-Z]*[fdx]|checkout\s+--\s+\.|restore\s+\.|restore\s+--staged\s+\.|stash\s+(drop|clear)|branch\s+-D|filter-branch|filter-repo|submodule\s+deinit\s+(-f|--force)|worktree\s+remove\s+(-f|--force))(\s|$)/
const SQL_DROP = /(drop\s+(table|database|schema)|truncate\s+(table\s+)?[a-z_"`.]+)/
const SQL_DELETE = /delete\s+from\s+[a-z_"`.]+/
const SQL_WHERE = /\swhere\s/
const FETCHER = /(^|\s)(curl|wget)\s/
const FETCH_PIPED_TO_SHELL = /(curl|wget)[^|]*\|\s*(sudo\s+(-E\s+)?)?(ba|z|da|k)?sh(\s|$)/
const DISK_DESTROY =
  /(^|\s)(mkfs(\.[a-z0-9]+)?|fdisk|parted|shred)(\s|$)|(^|\s)(dd\s+if=|diskutil\s+(erase|partition))|>\s*\/dev\/(sd|nvme|disk|hd)/
const PERM_BROAD = /chmod\s+(-R\s+)?(777|a\+rwx)(\s|$)|chown\s+-R\s+[^\s]+\s+\/(\s|$)/
const ENV_READ =
  /(^|\s)(cat|less|more|head|tail|bat|type|Get-Content)\s+([^|;&]*[\s/])?\.env(\.[a-zA-Z0-9_-]+)?(\s|$)/
const ENV_EXAMPLE = /\.env\.(example|sample|template|dist)(\s|$)/

const DANGEROUS_LITERALS = new Set([
  '',
  '/',
  '~',
  '~/',
  '$HOME',
  '${HOME}',
  '.',
  './',
  '..',
  '../',
  '*',
  '/*',
  '~/*',
  '$HOME/*',
  './*',
  '.*',
  './.*',
  '.git',
  './.git',
  '.git/',
])

const SYSTEM_PREFIXES = [
  '/usr',
  '/etc',
  '/var',
  '/home',
  '/Users',
  '/opt',
  '/System',
  '/Library',
  '/root',
  '/dev',
  '/proc',
]
const SYSTEM_EXACT = new Set(['/bin', '/sbin', '/boot'])

/** guard-bash.sh `is_dangerous_target`. */
export function isDangerousTarget(target: string, ctx: DecideContext = {}): boolean {
  const t = target.length > 1 && target.endsWith('/') ? target.slice(0, -1) : target
  if (DANGEROUS_LITERALS.has(t) || DANGEROUS_LITERALS.has(target)) return true
  if (t.startsWith('/lib')) return true
  if (SYSTEM_EXACT.has(t)) return true
  if (SYSTEM_PREFIXES.some(p => t === p || t.startsWith(p + '/'))) return true
  if (ctx.home && (t === ctx.home || target === ctx.home + '/')) return true
  if (ctx.cwd && (t === ctx.cwd || target === ctx.cwd + '/')) return true
  if (t.startsWith('../') || t.endsWith('/..') || t.includes('/../')) return true
  return false
}

/** Tokens after `[sudo] rm` that are not flags, as the bash script collects them. */
function rmTargets(segment: string): string[] {
  return segment
    .replace(RM_PREFIX, '')
    .split(/\s+/)
    .filter(tok => tok.length > 0 && !tok.startsWith('-'))
}

/** The destination branch of a `git push` segment, as the bash sed chain finds it. */
export function pushBranch(segment: string): string | undefined {
  const after = segment.replace(/.*git\s+push\s+/, '')
  const positional = after.split(/\s+/).filter(a => a.length > 0 && !a.startsWith('-'))
  const refspec = positional[1]
  if (refspec === undefined) return undefined
  const dst = refspec.replace(/^\+?([^:]*:)?(.*)$/, '$2').replace(/^refs\/heads\//, '')
  return dst.length > 0 ? dst : undefined
}

/**
 * The classic plugin's deny text: the reason, then the rule and how to
 * override it. Claude reads this as the tool's error, so it must explain.
 */
export function denyText(deny: Deny): string {
  return (
    `Anchorwatch blocked this: ${deny.reason}\n` +
    `Rule: ${deny.rule} (anchorwatch-mod, experimental; set "rules": {"${deny.rule}": "warn"} in .anchorwatch.json ` +
    `or add an "allow" pattern to override in the classic plugin). Explain the block to the user and propose a safer alternative.`
  )
}

/**
 * The gate. Returns the first deny found, in the bash script's rule order,
 * or null when every segment passes.
 */
export function decide(command: string, ctx: DecideContext = {}): Deny | null {
  if (!command) return null
  const protectedBranches = ctx.protectedBranches ?? DEFAULT_PROTECTED_BRANCHES

  for (const seg of segments(command)) {
    const low = seg.toLowerCase()

    // --- Recursive delete of a critical path ---
    if (RM_RECURSIVE.test(seg)) {
      const targets = rmTargets(seg)
      if (targets.some(t => isDangerousTarget(t, ctx))) {
        return {
          rule: 'rm-recursive-dangerous',
          reason:
            `recursive delete of a critical path ( ${targets.join(' ')}). ` +
            'This would destroy the project, home directory, or system files.',
        }
      }
    }

    // --- Git: force push to a protected branch ---
    if (GIT_PUSH.test(seg) && GIT_FORCE_FLAG.test(seg)) {
      const branch = pushBranch(seg) ?? ctx.currentBranch
      if (branch !== undefined && protectedBranches.includes(branch)) {
        return {
          rule: 'git-force-push-protected',
          reason:
            `force push to protected branch '${branch}'. Push to a feature branch and open a PR instead; ` +
            `if history on '${branch}' truly must be rewritten, the user should run it themselves.`,
        }
      }
    }

    // --- Git: local destructive ---
    if (GIT_DESTRUCTIVE.test(seg)) {
      return {
        rule: 'git-destructive',
        reason:
          `this git command discards uncommitted work or rewrites history irreversibly ('${seg.slice(0, 80)}'). ` +
          'Stash or commit first, or ask the user.',
      }
    }

    // --- SQL destructive ---
    if (SQL_DROP.test(low)) {
      return {
        rule: 'sql-destructive',
        reason: 'DROP/TRUNCATE statement detected. Destroying tables or databases is irreversible.',
      }
    }
    if (SQL_DELETE.test(low) && !SQL_WHERE.test(low)) {
      return {
        rule: 'sql-destructive',
        reason: 'DELETE FROM without a WHERE clause wipes the whole table.',
      }
    }

    // --- Pipe a remote script into a shell (checked against the whole command, as the script does) ---
    if (FETCHER.test(seg) && FETCH_PIPED_TO_SHELL.test(command)) {
      return {
        rule: 'pipe-to-shell',
        reason:
          'piping a downloaded script straight into a shell (supply-chain risk). ' +
          'Download it to a file, inspect it, then run it.',
      }
    }

    // --- Disk / device destruction ---
    if (DISK_DESTROY.test(seg)) {
      return { rule: 'disk-destroy', reason: 'this command writes to or formats a raw disk/device.' }
    }

    // --- Broad permission changes ---
    if (PERM_BROAD.test(seg)) {
      return { rule: 'perm-broad', reason: 'world-writable permissions or recursive chown of / are unsafe.' }
    }

    // --- Reading secret files into the transcript ---
    if (ENV_READ.test(seg) && !ENV_EXAMPLE.test(seg)) {
      return {
        rule: 'env-read',
        reason:
          'this prints a .env file (secrets) into the conversation. List variable names instead: ' +
          "grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env — or ask the user for the specific value you need.",
      }
    }
  }

  return null
}
