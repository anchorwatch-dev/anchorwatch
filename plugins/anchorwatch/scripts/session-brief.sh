#!/usr/bin/env bash
# Anchorwatch — SessionStart: one-line status so Claude knows guardrails are active.
. "$(dirname "$0")/lib.sh"
aw_read_input
n_block=0; n_warn=0
for pair in rm-recursive-dangerous:block rm-recursive:warn git-force-push-protected:block git-force-push:warn git-push-delete:warn git-destructive:block sql-destructive:block pipe-to-shell:block disk-destroy:block perm-broad:block env-read:block env-dump:warn publish:warn sudo:warn kill-broad:warn system-config:warn secret-files:block git-internals:block lockfiles:warn self-config:warn infra-files:warn outside-project:warn secret-read:block secret-scan:warn; do
  r="${pair%%:*}"; d="${pair##*:}"
  case "$(aw_level "$r" "$d")" in block) n_block=$((n_block+1)) ;; warn) n_warn=$((n_warn+1)) ;; esac
done
git_line=""
if git -C "$AW_CWD" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  br="$(git -C "$AW_CWD" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  dirty="$(git -C "$AW_CWD" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  git_line=" Git: branch $br, $dirty uncommitted file(s)."
fi
printf 'Anchorwatch guardrails active (v%s): %s blocking, %s warning rules. Config: %s.%s If a tool call is denied with "Anchorwatch blocked", explain it to the user and offer a safer alternative; never try to bypass it.\n' "$AW_VERSION" "$n_block" "$n_warn" "$AW_CONFIG_PATH" "$git_line"
exit 0
