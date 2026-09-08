# GitHub issue replies (post from your own account, after "go")

Rules I followed: each reply is specific to the thread, leads with something useful whether or not they install anything, discloses that you make Anchorwatch, and links once. Post at most two per day; these threads are read for months, so pace matters less than tone. Most high-traffic incident threads on anthropics/claude-code are locked after closing, so this list is the unlocked ones plus open discussions.

---

## anthropics/claude-code #64615 — /rewind silently reverts code (closed, unlocked)
https://github.com/anthropics/claude-code/issues/64615

For anyone landing here from search after losing work to Esc-Esc: two things that helped me.

1. `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING=1` (mentioned above) removes the "Restore code" option entirely. Blunt, but it means a double-Esc can only ever rewind the conversation.
2. Commit more often than feels natural during agent sessions. Rewind only restores to Claude's own checkpoints; git restores to yours. A `git add -A && git commit -m wip` every time the agent finishes a task costs nothing and makes every kind of revert recoverable.

Disclosure: I maintain Anchorwatch, a small hooks plugin. It doesn't touch rewind (that's a UI action, not a tool call), but it does block the *other* way work vanishes in these sessions, `git reset --hard` / `git clean -f` / `checkout -- .` run by the model, with a reason fed back to Claude so it proposes stashing instead: https://anchorwatch.sh

---

## anthropics/claude-code #68920 — git submodule deinit wiped the working tree (closed, unlocked)
https://github.com/anthropics/claude-code/issues/68920

Adding to yurukusa's excellent recovery notes: the pattern here (`deinit -f && git rm -f`) is the same class of failure as `reset --hard` and `clean -fd`: a git command that discards a working tree, chosen by the model because it "cleans up" the state it's looking at, with no step where local changes are checked first.

The fix that has held up for me is a PreToolUse hook on Bash that denies that class of command outright and returns the reason to Claude, so it stops and asks (or stashes) instead of retrying. The important detail is splitting compound commands on `&&`, `;` and `|` before matching, otherwise `cd sub && git clean -fd` slips through a prefix check.

I maintain a packaged version of that hook (Anchorwatch, MIT). `submodule deinit -f` wasn't in the rule set until I read this thread; it is now. https://anchorwatch.sh/docs/rules/

---

## anthropics/claude-code #65812 — .gitignore should not double as AI access control (closed, unlocked)
https://github.com/anthropics/claude-code/issues/65812

Agree with the framing. Until a `.claudeignore` exists, the mechanism that actually works today is a `PreToolUse` hook on `Read` and `Bash`: it can deny reads of `.env*`, keys, `~/.ssh`, `~/.aws` and friends, and, importantly, tell Claude *why* and what to do instead (list variable names with `grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env` rather than printing values). The deny reason goes back into the model's context, which is what stops the "let me try cat instead" retry loop.

Permission `deny` rules cover part of this, but they can't express "deny `cat .env` but allow `cat .env.example`" or catch a `.env` path in the middle of a compound command. Hooks can.

Disclosure: I maintain Anchorwatch, which packages exactly these rules as a plugin: https://anchorwatch.sh/guides/keep-secrets-out-of-claude-code/ — the guide explains the approach even if you'd rather write your own hook.

---

## anthropics/claude-code #28240 — permission prompt triggers on cd in compound commands (open)
https://github.com/anthropics/claude-code/issues/28240

edgariscoding's finding matches mine: a PreToolUse hook is the only layer that reliably sees the *whole* compound command. One caution for anyone copying the auto-allow hook: make the deny side symmetric. If the hook auto-allows `cd x && <read-only>` chains, it should also deny `cd x && rm -rf …` / `git reset --hard` chains, otherwise you've built a fast path that a destructive command can ride.

The segment-splitting logic (on `&&`, `||`, `;`, `|`) is the reusable part. I maintain a plugin that does this for the destructive side (Anchorwatch, MIT); the splitter is in `plugins/anchorwatch/scripts/lib.sh` if you want to borrow it: https://github.com/anchorwatch-dev/anchorwatch

---

## Also worth a reply once posted (find fresh threads weekly)
- r/ClaudeAI and r/ClaudeCode: search "deleted", "reset --hard", ".env", "force push" and sort by new; reply only where the thread is under a week old.
- Hacker News: comments on any "AI agent deleted my …" story; those get big traffic.

---

## anthropics/claude-code #91870 — Function Hooks proposal (open, Anthropic asking for feedback)
https://github.com/anthropics/claude-code/issues/91870

Feedback from someone maintaining a guardrails plugin built entirely on today's `PreToolUse`/`PostToolUse` command hooks (Anchorwatch, MIT). The proposal looks great; here's what the current hook system makes hard, in case it helps prioritise:

1. **Hooks fail open, invisibly.** If my script crashes, times out, or the machine has no `jq`/`node`/`python3`, the tool call proceeds and nothing tells anyone the guard didn't fire. I work around it with a SessionStart hook that announces "active"/"INACTIVE", but a first-party notion of hook health (or an opt-in fail-closed mode per hook) would be far better than every plugin inventing its own.
2. **Untyped stdin JSON.** Every command hook re-implements parsing with a jq → node → python3 fallback chain. Typed inputs in a function hook remove that whole class of bugs.
3. **No dry-run harness.** Testing a hook today means hand-crafting the JSON envelope. A `claude hooks test <event> --input file.json` that runs the real dispatch would let plugin authors ship CI-verified hooks.
4. **Compound commands.** Guards must split on `&&`, `;`, `||`, `|` themselves; a pre-parsed segment list on the Bash event would make third-party guards more consistent with the built-in permission matcher (see #28240, #30519).
5. **Deny reasons are the best part.** Feeding `permissionDecisionReason` back to the model is what turns a block into a behaviour change rather than a retry loop. Please keep that first-class in the function model.

On @techmik's point about hook wiring not being version-controllable: packaging hooks as a plugin (`hooks/hooks.json` next to the scripts, `${CLAUDE_PLUGIN_ROOT}` for paths) already solves that today; the same plugin installs identically on every machine and updates through the marketplace. Function hooks should keep that property.

Happy to be a test user for the preview.

---

## anthropics/claude-code #30519 — permissions matching is broken (open)
https://github.com/anthropics/claude-code/issues/30519

@m13v's point about hand-rolled hooks failing quietly is the right criticism and it's worth being precise about it. A PreToolUse guard *does* fail open on its own errors (a hook that exits non-zero, times out, or can't parse stdin lets the call through). The mitigations I've found that actually work: (a) no runtime dependencies beyond bash plus a parser fallback chain, (b) a test suite that feeds the exact stdin envelope for every rule and runs in CI on macOS and Linux, and (c) a SessionStart hook that prints "active, N rules" or a loud INACTIVE warning, so absence is visible instead of silent. That's still not a permission system, and it doesn't replace `deny` rules; it complements them for the cases the matcher can't express (protected branches, `DELETE` without `WHERE`, `.env` mid-command).

Disclosure: I maintain that guard as a plugin (Anchorwatch, MIT). The tests are in the repo if anyone wants to reuse the envelope fixtures: https://github.com/anchorwatch-dev/anchorwatch/blob/main/tests/run.sh

---

## anthropics/claude-code #2544 — CLAUDE.md mandatory rules ignored (open)
https://github.com/anthropics/claude-code/issues/2544

A pattern that has held up across long sessions: sort your CLAUDE.md rules into two piles. Rules the model must *judge* (naming, architecture, when to ask) stay in CLAUDE.md; those degrade with context length as junaidtitan describes, and nothing fixes that fully. Rules that are *checkable* ("run the tests before finishing", "never touch .env", "no force push to main", "commit message format") should not be instructions at all; they should be hooks, which run every time regardless of what the model is paying attention to. For the list in this issue: mandatory testing → a Stop hook that blocks the turn until a test command has run; commit format → a PreToolUse hook on `git commit`; documentation-before-code → a PreToolUse hook on Edit that checks for the doc file.

Anthropic's own guidance says the same ("for actions that must happen every single time, use hooks"). I wrote up the mechanics here, including the exit-code and JSON-decision details: https://anchorwatch.sh/guides/claude-code-hooks-guide/ (disclosure: I maintain the plugin on that site; the guide stands on its own).


---

## anthropics/claude-code #91870 — follow-up (post today; the thread moved overnight)
https://github.com/anthropics/claude-code/issues/91870

Thanks @42tahara and @Spencer-Morley for measuring rather than arguing; that retires my point 1 for function hooks (a killed or throwing hook is logged with the plugin name, and the settle line makes absence observable). The asymmetry Spencer found is the one that matters for a guard, so let me restate it as a concrete ask:

**A hook should be able to declare its failure mode.** Today a missing capability fails closed but a timeout fails open. For a redactor or a deny gate, "skipped; what is below it ran in its place" is the one outcome that must never happen silently, and a try/catch inside the hook cannot cover the timeout case by construction. An opt-in per registration, e.g. `on("tool.call", { tool: "Bash", onFailure: "deny" }, …)`, would let a guard say "if I can't answer, the answer is no", while leaving the fail-open default for everything else. That single flag turns a guardrail from best-effort into something you can attest to.

**And a deny should be sticky across tiers.** With `next.to` skipping forward, the property I'd want written down is that once any tier denies, no later tier (user or builtin) can reach `core` for that event. Otherwise an org prepend guard is only as strong as the most permissive user plugin below it.

From the guardrail-plugin side (Anchorwatch, currently classic PreToolUse scripts): `classic.*` wrapping 1:1 means I can keep shipping the bash version while porting the deny logic to a typed `tool.call` handler behind the flag, and the `/plugin-types` output finally gives the regression suite a real fixture shape. I'll report what the port surfaces.
