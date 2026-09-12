---
title: Rules reference
description: Every Anchorwatch guardrail rule, its default level, what triggers it, and the safer alternative Claude is told to use.
---
# Rules reference

<span class="tag block">block</span> denies the tool call before it runs. <span class="tag warn">warn</span> lets it run but tells Claude why to be careful. Override any rule in [.anchorwatch.json](/docs/configuration/).

## Bash commands

<div class="rules">

| Rule | Default | Triggers | Claude is told to |
|---|---|---|---|
| `rm-recursive-dangerous` | <span class="tag block">block</span> | `rm -r`/`-rf` whose target is `/`, `~`, `$HOME`, `.`, `..`, `*`, a system directory (`/usr`, `/etc`, `/var`, `/Users`, …), the project root, or `.git` | List what would be deleted, then delete specific paths |
| `rm-recursive` | <span class="tag warn">warn</span> | any other recursive delete (`rm -rf node_modules`) | Confirm the path is inside the project and intended |
| `git-force-push-protected` | <span class="tag block">block</span> | `git push --force`/`-f`/`--force-with-lease` where the target branch (explicit refspec or current branch) is protected | Use a feature branch and a PR; the user runs it if history truly must change |
| `git-force-push` | <span class="tag warn">warn</span> | force push to any other branch | Prefer `--force-with-lease`; confirm if the branch is shared |
| `git-push-delete` | <span class="tag warn">warn</span> | `git push --delete`, `--mirror`, `:branch` | Confirm ref deletion |
| `git-destructive` | <span class="tag block">block</span> | `reset --hard`, `clean -f/-d/-x`, `checkout -- .`, `restore .`, `stash drop/clear`, `branch -D`, `filter-branch`, `filter-repo`, `submodule deinit -f`, `worktree remove -f` | Stash or commit first; ask |
| `sql-destructive` | <span class="tag block">block</span> | `DROP TABLE/DATABASE/SCHEMA`, `TRUNCATE`, `DELETE FROM x` with no `WHERE` — in any CLI | Write a migration or a scoped statement and confirm |
| `pipe-to-shell` | <span class="tag block">block</span> | `curl … \| sh`, `wget … \| bash`, incl. `\| sudo bash` | Download to a file, inspect, then run |
| `disk-destroy` | <span class="tag block">block</span> | `mkfs`, `dd if=`, `fdisk`, `parted`, `shred`, `diskutil erase`, `> /dev/sdX` | — |
| `perm-broad` | <span class="tag block">block</span> | `chmod 777`/`a+rwx`, `chown -R … /` | Use minimal permissions |
| `env-read` | <span class="tag block">block</span> | `cat`/`head`/`tail`/`less`/`bat` on `.env`, `.env.*` (not `.env.example/.sample/.template/.dist`) | `grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env` to list names; ask the user for a value |
| `secret-write` | <span class="tag block">block</span> | a shell command whose write destination is a secret-bearing file (the same list as `secret-files`): `> .env`, `>> .env.production`, `tee .env`, `cp x .env`, `mv k server.key`, `sed -i … .env`, `dd of=.env`. `.env.example`/`.sample`/`.template`/`.dist`/`.schema` are exempt | Ask the user to set the value, or write a placeholder to `.env.example`; going through the shell is not a way around `secret-files` |
| `env-dump` | <span class="tag warn">warn</span> | bare `env`, `printenv`, `set`, `export -p` (piping into `grep`/`rg`/`awk` is fine) | Grep for the variable you need |
| `publish` | <span class="tag warn">warn</span> | `npm/pnpm/yarn/bun publish`, `cargo publish`, `gem push`, `twine upload`, `gh release create`, `docker push`, `fly deploy`, `vercel --prod`, `terraform apply/destroy`, `pulumi up`, `kubectl delete/apply`, `helm install/upgrade`, cloud CLI deletes, `supabase db reset/push`, `prisma migrate reset` | Only if the user asked for exactly this; otherwise confirm |
| `sudo` | <span class="tag warn">warn</span> | any `sudo` | Make sure a system change is expected |
| `kill-broad` | <span class="tag warn">warn</span> | `kill -9 -1`, `killall`, `pkill -f` | Target the specific PID |
| `system-config` | <span class="tag warn">warn</span> | appending to `~/.zshrc`/`.bashrc`/`.profile`, writing `/etc/hosts`, `crontab` changes | Get approval for persistent system changes |

</div>

Commands are split on `;`, `&&`, `||` and `|` and each segment is checked, so `cd /tmp && rm -rf /var/lib` is still caught. `sudo` prefixes are seen through.

## File operations (Edit, Write, MultiEdit, NotebookEdit)

| Rule | Default | Triggers |
|---|---|---|
| `secret-files` | <span class="tag block">block</span> | `.env*` (except example/sample/template/dist/schema), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `id_rsa`/`id_ed25519`/…, `credentials*`, `secrets.*`, `.netrc`, `.npmrc`, `.pypirc`, `.git-credentials`, `*service-account*.json`, anything under `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.kube`, `~/.gnupg`, `~/.docker/config.json` |
| `git-internals` | <span class="tag block">block</span> | any path inside `.git/` (hooks excepted) |
| `lockfiles` | <span class="tag warn">warn</span> | `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock*`, `Cargo.lock`, `poetry.lock`, `uv.lock`, `go.sum`, `Gemfile.lock`, `composer.lock`, `Pipfile.lock`, `flake.lock` |
| `self-config` | <span class="tag warn">warn</span> | `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude.json`, `.mcp.json`, plugin manifests, `.anchorwatch.json`, `.quality-gates.json` |
| `infra-files` | <span class="tag warn">warn</span> | `.github/workflows/*`, `Dockerfile`, `fly.toml`, `vercel.json`, `netlify.toml`, `serverless.yml`, `*.tf` |
| `outside-project` | <span class="tag warn">warn</span> | a write outside the working directory (temp dirs and `~/.claude` excluded) |

## Read

| Rule | Default | Triggers |
|---|---|---|
| `secret-read` | <span class="tag block">block</span> | Read tool on the same secret-bearing files as `secret-files` |

## After a write (PostToolUse)

| Rule | Default | Triggers |
|---|---|---|
| `secret-scan` | <span class="tag warn">warn</span> | the written content contains an AWS key (`AKIA…`), GitHub token (`ghp_`, `github_pat_`), Stripe live key, Anthropic or OpenAI key, Slack token, Google API key, SendGrid or Twilio key, a `PRIVATE KEY` block, a database URL with an embedded password, a JWT, or a hard-coded literal assigned to a name like `password`/`secret`/`token`/`api_key` (env lookups and obvious placeholders are ignored). Markdown and `.env.example` are skipped. |

When it fires, Claude is told which pattern matched and roughly where, and instructed to move the value to an environment variable and to tell you to rotate the credential if it's real.
