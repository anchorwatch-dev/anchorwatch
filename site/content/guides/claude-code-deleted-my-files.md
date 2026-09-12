---
title: "Claude Code deleted my files: what happened and how to get them back"
description: Which deletions /rewind can undo and which it cannot, the git commands that recover the rest (including work you only ever staged), and the three settings that decide whether recovery is possible at all.
date: 2026-09-12
updated: 2026-09-12
---
# Claude Code deleted my files

The sequence is always roughly the same. You ask for a cleanup, or a refactor, or "remove the old tests". The agent runs one shell command, reports success, and a directory you needed is gone. Then `/rewind` either isn't offered or restores nothing, and the question becomes how much of it still exists somewhere.

The answer depends almost entirely on **how** the files were removed, because Claude Code's own undo covers one of the two ways and not the other.

## Step 1: stop the session

Before anything else, stop the turn. Every further tool call adds noise to the working tree, and two of the recovery routes below depend on git's object store, which later commands can prune. Don't let the agent "fix" it either — a second cleanup on top of the first is how recoverable states become unrecoverable.

## Step 2: work out which kind of deletion it was

Checkpointing captures file state before each prompt that starts a turn, and it tracks **only changes made by Claude's file-editing tools**. The [checkpointing docs](https://code.claude.com/docs/en/checkpointing) are explicit that files modified by bash commands are not tracked:

```bash
rm file.txt
mv old.txt new.txt
cp source.txt dest.txt
```

None of those can be undone through rewind. So:

- **Deleted or truncated by Edit/Write** — a file the model emptied or overwrote is in a checkpoint snapshot. `/rewind` can bring it back.
- **Deleted by a shell command** — `rm`, `mv`, `git clean`, `make clean`, a `find -delete`, a script the model ran. Rewind has nothing for it. Skip to step 4.

Scroll back in the transcript and find the call that did it. If the tool was Bash, rewind will not help no matter which option you pick.

## Step 3: if it was an edit, use /rewind

Run `/rewind`, or press `Esc` twice with an empty prompt input (if the input has text, the first double-`Esc` clears it instead — press `Up` to get the text back from input history). Pick the prompt from *before* the damage and choose one of:

- **Restore code** — revert the files, keep the conversation
- **Restore code and conversation** — revert both
- **Restore conversation** — rewind the messages only

The two code options only appear when the selected checkpoint has tracked file changes to revert. If all you see is **Restore conversation**, that is the menu telling you there are no file snapshots to put back — which is also the signature of a bash deletion.

Four limits are worth knowing before you rely on this:

| Limit | What it means for you |
|---|---|
| 100 most recent checkpoints per session | A long session drops its early snapshots |
| Snapshots swept after `cleanupPeriodDays` (default 30, minimum 1) | Rewinding an old session can fail with `No files were restored` |
| Subagent edits usually aren't captured | Background forked skills and background `/code-review --fix` runs need git, not rewind |
| Symlinks and hard links are skipped | You get `Restored the code, but skipped N files`; those keep their current contents |

That last one catches people with dotfile managers and pnpm stores, because the skipped paths look restored in the menu's summary but aren't on disk.

## Step 4: recover from git, in this order

For a shell deletion, git is the whole story. Run these from the repo root, and note the `git status --short` codes — they tell you which case you're in.

### Files git was tracking

```bash
git status --short        # " D" = tracked file deleted, "AD" = staged then deleted
git checkout -- .         # restore every deleted tracked file
```

### Work you staged but never committed

This is the case people assume is lost, and it usually isn't. `git add` writes a blob into `.git/objects` immediately, so even `git reset --hard` followed by `git clean -fd` leaves the content behind as a dangling object:

```bash
git fsck --lost-found
# dangling blob 4ce690b2483450de381e4be9c1cc70e2ebc68736
cat .git/lost-found/other/4ce690b2483450de381e4be9c1cc70e2ebc68736
```

`git fsck --lost-found` writes each unreferenced object into `.git/lost-found/` where you can read it and copy it back. Blobs have no filenames, so you identify them by content.

### Commits that vanished

If the damage was `git reset --hard`, `git rebase` or a branch delete rather than a file delete, the commits are still in the reflog for 90 days by default:

```bash
git reflog --date=short
git reset --hard 'HEAD@{1}'   # or: git cherry-pick <sha> to take just one
```

### Untracked files

There is no recovery path. `git clean -fd` and `rm` on a file git never saw means the only copies left are your editor's local history (JetBrains' Local History, VS Code's **Timeline** view) or a filesystem snapshot — Time Machine, a ZFS/Btrfs snapshot, or your backup tool. Checkpointing will not help either, because the file was deleted by bash.

### A tested drill

Run this in a scratch directory to see all three outcomes at once. Tested on git 2.43 with Claude Code 2.1.269:

```bash
mkdir rmdrill && cd rmdrill && git init -q
git config user.email you@example.com && git config user.name You
printf 'committed\n' > committed.txt && git add . && git commit -qm init
printf 'staged\n'    > staged.txt && git add staged.txt
printf 'untracked\n' > untracked.txt

rm -f *.txt                 # stand-in for the agent's shell command
git status --short           # " D committed.txt" and "AD staged.txt" — untracked.txt absent
git checkout -- .            # brings back committed.txt and staged.txt
ls                           # untracked.txt is gone, and git has no record of it
```

The lesson in the last line is the practical one: **a single `git add` is the difference between recoverable and gone.** It costs nothing and it does not create a commit you have to explain later.

## Step 5: make the next one survivable

Recovery is a skill you should need rarely. Four changes do most of the work:

1. **Commit or stage before handing over.** The cheapest guardrail there is. `git add -A` before you send a prompt that touches many files.
2. **Deny the deletions nothing should do.** A `deny` rule is checked before ask and allow, and blocks the call outright:
   ```json
   { "permissions": { "deny": ["Bash(rm -rf *)", "Bash(git clean *)", "Edit(./migrations/**)"] } }
   ```
   Deny rules match command *text*, so `/bin/rm -rf x` slips past `Bash(rm *)` — see [permissions explained](/guides/claude-code-permissions-explained) for the matching rules in full. Treat them as a floor against accidents, not a boundary.
3. **Inspect the command, not its spelling.** A `PreToolUse` hook on `Bash` sees the whole command before it runs and can return a denial with a reason the model acts on instead of retrying; the patterns worth blocking are in [stopping destructive commands](/guides/stop-claude-code-destructive-commands).
4. **Keep the snapshots longer.** `cleanupPeriodDays` controls how long `~/.claude/file-history/<session>/` survives (default 30 days, minimum 1; `0` fails validation). `fileCheckpointingEnabled` turns the snapshots off entirely — check it isn't false anywhere in your settings if `/rewind` never offers a code restore.

One more thing, because it surprises people running agents in CI: a headless `claude -p` run has no rewind menu, and in testing on 2.1.269 a `-p` run that edited a file wrote no `~/.claude/file-history/` entry at all. Treat every non-interactive run as having no undo, and make the working tree clean and committed before it starts.

## What none of this covers

Checkpointing is explicitly "not a replacement for version control", and the same applies to every hook and deny rule you add: they reduce the number of accidents, and none of them restores a database you dropped, a cloud resource you destroyed or a file that only ever existed in the working tree. The layers that actually hold are a committed working tree, a guard that reads the command before it runs, and backups you have restored from at least once. [Anchorwatch](/) packages the middle one — the hook rules for destructive deletions and history rewrites, with tests — for the setups where a hand-grown deny list has already proved insufficient.
