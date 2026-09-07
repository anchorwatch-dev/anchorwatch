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
