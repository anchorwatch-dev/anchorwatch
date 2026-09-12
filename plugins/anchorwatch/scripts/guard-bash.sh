#!/usr/bin/env bash
# Anchorwatch — PreToolUse guard for the Bash tool.
# Reads the hook JSON on stdin, inspects tool_input.command, and either denies, warns, or passes.
. "$(dirname "$0")/lib.sh"
set -f   # never glob-expand command tokens we inspect
aw_read_input
AW_HOOK_EVENT="PreToolUse"

CMD="$(aw_json "$AW_INPUT" .tool_input.command)"
[ -z "$CMD" ] && exit 0
aw_allowed "$CMD" && exit 0

# apply <rule> <default-level> <reason>   (deny exits immediately; warn accumulates)
apply() {
  local rule="$1" def="$2" reason="$3" lvl
  lvl="$(aw_level "$rule" "$def")"
  case "$lvl" in
    block) aw_deny "$reason" "$rule" ;;
    warn)  aw_add_warning "$reason [$rule]" ;;
  esac
}

# Dangerous rm targets: filesystem roots, home, cwd itself, globs, system dirs, parent refs.
is_dangerous_target() {
  local t="$1"
  t="${t%/}"
  case "$t" in
    ""|"/"|"~"|"~/"|'$HOME'|'${HOME}'|"."|"./"|".."|"../"|"*"|"/*"|"~/*"|'$HOME/*'|'./*'|'.*'|"./.*") return 0 ;;
    /usr|/usr/*|/etc|/etc/*|/var|/var/*|/home|/home/*|/Users|/Users/*|/bin|/sbin|/lib*|/opt|/opt/*|/System|/System/*|/Library|/Library/*|/boot|/root|/root/*|/dev|/dev/*|/proc|/proc/*) return 0 ;;
    "$HOME"|"$HOME/") return 0 ;;
    "$AW_CWD"|"$AW_CWD/") return 0 ;;
    .git|./.git|.git/) return 0 ;;
  esac
  case "$t" in ../*|*/..|*/../*) return 0 ;; esac
  return 1
}

# is_secret_dest <token> — does this write destination name a secret-bearing file?
is_secret_dest() {
  local t="$1"
  t="${t%\"}"; t="${t#\"}"; t="${t%\'}"; t="${t#\'}"
  case "$t" in ""|-|/dev/*|\&*) return 1 ;; esac
  case "$t" in "~"*) t="$HOME${t#\~}" ;; esac
  case "$t" in /*) ;; *) t="$AW_CWD/$t" ;; esac
  aw_is_secret_path "$t"
}

# write_dests <segment> — the files this segment writes, one per line.
# Redirections (`>`, `>>`, `2>`), tee, cp/mv/install/rsync destinations,
# in-place editors (sed -i, perl -pi) and dd of=. Over-collects harmlessly:
# only a token that matches a secret path is acted on.
write_dests() {
  local seg="$1" tok prev="" last="" ip=0
  # Space out glued redirection operators so ">.env" tokenises as "> .env".
  for tok in $(printf '%s' "$seg" | sed -E 's/([0-9]?>>?)/ \1 /g'); do
    case "$prev" in ">"|">>"|[0-9]">"|[0-9]">>") printf '%s\n' "$tok" ;; esac
    prev="$tok"
  done
  set -- $seg
  case "${1:-}" in sudo) shift ;; esac
  case "${1:-}" in
    tee)
      shift
      for tok in "$@"; do case "$tok" in -*) ;; *) printf '%s\n' "$tok" ;; esac; done ;;
    cp|mv|install|rsync)
      for tok in "$@"; do case "$tok" in -*) ;; *) last="$tok" ;; esac; done
      [ -n "$last" ] && printf '%s\n' "$last" ;;
    sed|perl|ruby)
      shift
      for tok in "$@"; do case "$tok" in -*i*) ip=1 ;; esac; done
      if [ "$ip" = 1 ]; then
        for tok in "$@"; do case "$tok" in -*|s/*|*=*) ;; *) printf '%s\n' "$tok" ;; esac; done
      fi ;;
    dd)
      for tok in "$@"; do case "$tok" in of=*) printf '%s\n' "${tok#of=}" ;; esac; done ;;
  esac
}

while IFS= read -r seg; do
  [ -z "$seg" ] && continue
  low="$(aw_lower "$seg")"

  # --- Recursive delete ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])(sudo[[:space:]]+)?rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)([[:space:]]|$)'; then
    targets=""; dangerous=0
    for tok in $(printf '%s' "$seg" | sed -E 's/^[[:space:]]*(sudo[[:space:]]+)?rm[[:space:]]+//'); do
      case "$tok" in -*) continue ;; esac
      targets="$targets $tok"
      is_dangerous_target "$tok" && dangerous=1
    done
    if [ "$dangerous" = 1 ]; then
      apply rm-recursive-dangerous block "recursive delete of a critical path ($targets). This would destroy the project, home directory, or system files."
    else
      apply rm-recursive warn "recursive delete of$targets — confirm the path is inside the project and intended before proceeding"
    fi
  fi

  # --- Git: force push ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
    if printf '%s' "$seg" | grep -Eq -- '[[:space:]](--force|-f|--force-with-lease(=[^[:space:]]*)?|--force-if-includes)([[:space:]]|$)'; then
      lease=0; printf '%s' "$seg" | grep -Eq -- '--force-with-lease' && lease=1
      # Which branch? explicit refspec (dst side of src:dst), else current branch in cwd.
      branch="$(printf '%s' "$seg" | sed -E 's/.*git[[:space:]]+push[[:space:]]+//' | tr ' ' '\n' | grep -Ev '^-' | sed -n '2p' | sed -E 's/^[+]?([^:]*:)?(.*)$/\2/' | sed -E 's#^refs/heads/##')"
      if [ -z "$branch" ] && [ -d "$AW_CWD" ]; then branch="$(git -C "$AW_CWD" rev-parse --abbrev-ref HEAD 2>/dev/null)"; fi
      prot=0
      while IFS= read -r pb; do [ -n "$pb" ] && [ "$branch" = "$pb" ] && prot=1; done <<EOL
$(aw_protected_branches)
EOL
      if [ "$prot" = 1 ]; then
        apply git-force-push-protected block "force push to protected branch '$branch'. Push to a feature branch and open a PR instead; if history on '$branch' truly must be rewritten, the user should run it themselves."
      elif [ "$lease" = 1 ]; then
        apply git-force-push warn "force push (with lease) to '${branch:-unknown branch}' rewrites remote history; fine for your own feature branch, confirm if others share it"
      else
        apply git-force-push warn "force push to '${branch:-unknown branch}' rewrites remote history; prefer --force-with-lease"
      fi
    elif printf '%s' "$seg" | grep -Eq -- '--mirror|--delete|[[:space:]]:[a-zA-Z]'; then
      apply git-push-delete warn "this push deletes or mirrors remote refs"
    fi
  fi

  # --- Git: local destructive ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])git[[:space:]]+(reset[[:space:]]+--hard|clean[[:space:]]+-[a-zA-Z]*[fdx]|checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+\.|restore[[:space:]]+--staged[[:space:]]+\.|stash[[:space:]]+(drop|clear)|branch[[:space:]]+-D|filter-branch|filter-repo|submodule[[:space:]]+deinit[[:space:]]+(-f|--force)|worktree[[:space:]]+remove[[:space:]]+(-f|--force))([[:space:]]|$)'; then
    apply git-destructive block "this git command discards uncommitted work or rewrites history irreversibly ('$(printf '%s' "$seg" | head -c 80)'). Stash or commit first, or ask the user."
  fi

  # --- SQL destructive ---
  if printf '%s' "$low" | grep -Eq '(drop[[:space:]]+(table|database|schema)|truncate[[:space:]]+(table[[:space:]]+)?[a-z_"`.]+)'; then
    apply sql-destructive block "DROP/TRUNCATE statement detected. Destroying tables or databases is irreversible."
  fi
  if printf '%s' "$low" | grep -Eq 'delete[[:space:]]+from[[:space:]]+[a-z_"`.]+' && ! printf '%s' "$low" | grep -Eq '[[:space:]]where[[:space:]]'; then
    apply sql-destructive block "DELETE FROM without a WHERE clause wipes the whole table."
  fi

  # --- Pipe remote script into a shell ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])(curl|wget)[[:space:]]' && printf '%s' "$CMD" | grep -Eq '(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+(-E[[:space:]]+)?)?(ba|z|da|k)?sh([[:space:]]|$)'; then
    apply pipe-to-shell block "piping a downloaded script straight into a shell (supply-chain risk). Download it to a file, inspect it, then run it."
  fi

  # --- Disk / device destruction ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])(mkfs(\.[a-z0-9]+)?|fdisk|parted|shred)([[:space:]]|$)|(^|[[:space:]])(dd[[:space:]]+if=|diskutil[[:space:]]+(erase|partition))|>[[:space:]]*/dev/(sd|nvme|disk|hd)'; then
    apply disk-destroy block "this command writes to or formats a raw disk/device."
  fi

  # --- Broad permission changes ---
  if printf '%s' "$seg" | grep -Eq 'chmod[[:space:]]+(-R[[:space:]]+)?(777|a\+rwx)([[:space:]]|$)|chown[[:space:]]+-R[[:space:]]+[^[:space:]]+[[:space:]]+/([[:space:]]|$)'; then
    apply perm-broad block "world-writable permissions or recursive chown of / are unsafe."
  fi

  # --- Reading secret files into the transcript ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])(cat|less|more|head|tail|bat|type|Get-Content)[[:space:]]+([^|;&]*[[:space:]/])?\.env(\.[a-zA-Z0-9_-]+)?([[:space:]]|$)' \
     && ! printf '%s' "$seg" | grep -Eq '\.env\.(example|sample|template|dist)([[:space:]]|$)'; then
    apply env-read block "this prints a .env file (secrets) into the conversation. List variable names instead: grep -oE '^[A-Za-z_][A-Za-z0-9_]*' .env — or ask the user for the specific value you need."
  fi
  # --- Writing a secret file from the shell ---
  # secret-files only sees Edit/Write tool calls; `tee .env`, `> .env`, `cp x .env`
  # and `sed -i … .env` reach the same file through Bash. Claude Code 2.1.269 closed
  # the matching hole in its own engine (an Edit() deny rule did not cover the file a
  # Bash `tee` wrote); this closes it for the rule.
  while IFS= read -r dest; do
    [ -z "$dest" ] && continue
    if is_secret_dest "$dest"; then
      apply secret-write block "this writes to a secret-bearing file ($dest) from the shell — the same files secret-files protects from Edit/Write. Secrets belong to the user: ask them to set the value, or write a placeholder to .env.example instead."
      break
    fi
  done <<EOL
$(write_dests "$seg")
EOL

  if printf '%s' "$seg" | grep -Eq '^(sudo[[:space:]]+)?(printenv|env|set|export -p)[[:space:]]*$' \
     && ! printf '%s' "$CMD" | grep -Eq '(printenv|env|set|export -p)[[:space:]]*\|[[:space:]]*(grep|rg|egrep|fgrep|awk)[[:space:]]'; then
    apply env-dump warn "dumping the whole environment can expose secrets in the transcript; grep for the specific variable instead"
  fi

  # --- Outward / irreversible operations (publish, deploy, infra) ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])((npm|pnpm|yarn|bun)[[:space:]]+publish|cargo[[:space:]]+publish|gem[[:space:]]+push|twine[[:space:]]+upload|uv[[:space:]]+publish|gh[[:space:]]+release[[:space:]]+create|docker[[:space:]]+push|fly(ctl)?[[:space:]]+deploy|vercel([[:space:]]+deploy)?[[:space:]]+--prod|netlify[[:space:]]+deploy[[:space:]]+--prod|terraform[[:space:]]+(apply|destroy)|pulumi[[:space:]]+(up|destroy)|kubectl[[:space:]]+(delete|apply)|helm[[:space:]]+(install|upgrade|uninstall)|aws[[:space:]]+[a-z0-9-]+[[:space:]]+(delete|terminate|remove)[a-z-]*|gcloud[[:space:]]+[a-z-]+[[:space:]]+delete|az[[:space:]]+[a-z-]+[[:space:]]+delete|supabase[[:space:]]+db[[:space:]]+(reset|push)|prisma[[:space:]]+migrate[[:space:]]+reset|stripe[[:space:]]+[a-z]+[[:space:]]+delete)([[:space:]]|$)'; then
    apply publish warn "this publishes, deploys, or deletes something outside the local machine and may be irreversible. Only proceed if the user explicitly asked for exactly this; otherwise confirm first"
  fi

  # --- sudo ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])sudo[[:space:]]'; then
    apply sudo warn "sudo escalates privileges; make sure the user expects a system-level change"
  fi

  # --- Broad process kills ---
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])(kill[[:space:]]+-9[[:space:]]+-1|killall[[:space:]]+|pkill[[:space:]]+-f[[:space:]]+)'; then
    apply kill-broad warn "this kills processes broadly and may take down unrelated work"
  fi

  # --- Modifying shell startup / hosts / crontab ---
  if printf '%s' "$seg" | grep -Eq '(>>?[[:space:]]*(~|\$HOME|/Users/[^/]+|/home/[^/]+)/\.(bashrc|zshrc|profile|bash_profile|zprofile)|>>?[[:space:]]*/etc/hosts|crontab[[:space:]]+-r|crontab[[:space:]]+[^-])'; then
    apply system-config warn "this modifies shell startup files, /etc/hosts, or crontab — persistent system changes the user should approve"
  fi
done <<EOL
$(aw_segments "$CMD")
EOL

aw_flush
