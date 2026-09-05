---
title: "Keeping secrets out of Claude Code: .env files, keys and transcripts"
description: How credentials leak through an AI coding session (reading .env, writing keys into code, dumping env), what the transcript retains, and a layered fix using Read/Edit/Bash hooks and a post-write scanner.
date: 2026-09-06
updated: 2026-09-06
---
# Keeping secrets out of Claude Code

Every tool result in a Claude Code session — the output of `cat .env`, the file Claude just read, the environment it printed — goes into the conversation transcript and into the model's context. Transcripts live on disk under `~/.claude/projects/…` and, depending on your settings and plan, may be retained by the provider. A secret that enters the transcript should be considered exposed and rotated.

## The four leak paths
1. **Reading secret files.** Claude needs a config value, so it reads `.env` — all of it. Or `~/.aws/credentials`, or a `.pem` file "to check the format".
2. **Dumping the environment.** `env`, `printenv`, `set` — to debug why a variable "isn't set".
3. **Writing secrets into code.** Copying a key from a message you pasted into `config.ts` "for now". Or generating a database URL with the password inline.
4. **Committing them.** Once in a file, one `/commit` away from the remote.

## Layer 1: keep them out of the transcript
A `PreToolUse` hook on `Read` and on `Bash` can refuse to open secret-bearing files and instead tell Claude how to get what it needs:

```
✗ reading a secret-bearing file (.env) would copy credentials into the conversation.
  To learn which variables exist: grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env
  — or ask the user for the specific value.
```

Listing variable *names* is almost always what the model actually needs. The file set worth protecting: `.env` and `.env.*` (but not `.env.example`), `*.pem`, `*.key`, `*.p12`, `id_rsa`/`id_ed25519`, `credentials*`, `secrets.*`, `.netrc`, `.npmrc`, `.pypirc`, `.git-credentials`, service-account JSON, and everything under `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.kube`, `~/.gnupg`.

For environment dumps, warn rather than block: `env | grep DATABASE_URL` is legitimate; bare `env` is a firehose.

## Layer 2: keep Claude from writing them
Guard `Edit`/`Write` on the same file set so the model can't "helpfully" add a key to `.env` — that's your job. And scan every write with a `PostToolUse` hook for well-known token shapes:

| Provider | Pattern |
|---|---|
| AWS | `AKIA[0-9A-Z]{16}` |
| GitHub | `gh[pousr]_[A-Za-z0-9]{36,}`, `github_pat_…` |
| Stripe | `sk_live_…`, `rk_live_…` |
| Anthropic | `sk-ant-…` |
| OpenAI | `sk-…` / `sk-proj-…` |
| Slack | `xox[baprs]-…` |
| Google | `AIza[0-9A-Za-z_-]{35}` |
| Private keys | `-----BEGIN … PRIVATE KEY-----` |
| DB URLs | `postgres://user:PASSWORD@host` |
| Generic | `password|secret|token|api_key = "…12+ chars…"` (ignoring `process.env`, `os.environ`, placeholders) |

The scanner can't block (the write already happened) but it can inject context: *"a possible Stripe live key was just written to `config.ts` — move it to an environment variable and tell the user to rotate it"*. In practice the model immediately fixes it.

## Layer 3: keep them out of git
- `.gitignore`: `.env`, `.env.*`, `!.env.example`, `*.pem`, `*.key`.
- A pre-commit secret scanner (`gitleaks`, `trufflehog`) — the guard above catches the model, this catches everyone.
- GitHub push protection on the repository.

## Layer 4: don't have them on disk at all
Where you can, use a secrets manager or `direnv`/`1Password CLI` to inject variables at process start, so there is no `.env` to read. For Claude Code specifically, put the variables the *model* needs in `settings.json → env` only if they're non-sensitive.

## The packaged version
[Anchorwatch](/docs/install/) implements layers 1 and 2 as hooks (`secret-read`, `secret-files`, `env-read`, `env-dump`, `secret-scan`) with the exact file list and patterns above, plus a `SessionStart` note telling Claude not to repeat secret values it does encounter. It's the part of the problem a plugin can solve; layers 3 and 4 are still yours.
