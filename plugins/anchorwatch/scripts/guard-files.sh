#!/usr/bin/env bash
# Anchorwatch — PreToolUse guard for Edit / Write / MultiEdit / NotebookEdit.
. "$(dirname "$0")/lib.sh"
aw_read_input
AW_HOOK_EVENT="PreToolUse"

FILE="$(aw_json "$AW_INPUT" .tool_input.file_path)"
[ -z "$FILE" ] && FILE="$(aw_json "$AW_INPUT" .tool_input.notebook_path)"
[ -z "$FILE" ] && exit 0
aw_allowed "$FILE" && exit 0

apply() {
  local rule="$1" def="$2" reason="$3" lvl
  lvl="$(aw_level "$rule" "$def")"
  case "$lvl" in
    block) aw_deny "$reason" "$rule" ;;
    warn)  aw_add_warning "$reason [$rule]" ;;
  esac
}

# Normalise: expand ~ and make absolute relative to cwd
case "$FILE" in "~"*) FILE="$HOME${FILE#\~}" ;; esac
case "$FILE" in /*) ABS="$FILE" ;; *) ABS="$AW_CWD/$FILE" ;; esac
BASE="$(basename "$ABS")"
LOWBASE="$(aw_lower "$BASE")"

# --- Secret-bearing files (the list lives in lib.sh; the bash guard shares it) ---
if aw_is_secret_path "$ABS"; then
  apply secret-files block "writing to a secret-bearing file ($FILE). Secrets must be managed by the user; ask them to add or change the value, or write to .env.example with a placeholder instead."
fi

# --- .git internals ---
case "$ABS" in
  */.git/*) case "$BASE" in hooks) ;; *) apply git-internals block "editing .git internals ($FILE) can corrupt the repository. Use git commands instead." ;; esac ;;
esac

# --- Lockfiles ---
case "$LOWBASE" in
  package-lock.json|pnpm-lock.yaml|yarn.lock|bun.lock|bun.lockb|cargo.lock|poetry.lock|uv.lock|go.sum|gemfile.lock|composer.lock|pipfile.lock|flake.lock)
    apply lockfiles warn "hand-editing lockfile $BASE usually corrupts it; run the package manager (install/update) instead" ;;
esac

# --- Claude Code's own configuration (self-modification) ---
case "$ABS" in
  */.claude/settings.json|*/.claude/settings.local.json|"$HOME/.claude.json"|*/.claude-plugin/*|*/.mcp.json|*/.anchorwatch.json|*/.quality-gates.json)
    apply self-config warn "this edits Claude Code's own permissions/hooks/MCP configuration ($BASE). Do this only when the user explicitly asked; never to loosen your own guardrails" ;;
esac

# --- CI / infra files that trigger remote effects ---
case "$ABS" in
  */.github/workflows/*|*/Dockerfile|*/fly.toml|*/vercel.json|*/netlify.toml|*/serverless.yml|*/terraform/*|*.tf)
    apply infra-files warn "changing CI/deploy configuration ($BASE) affects remote environments; double-check before pushing" ;;
esac

# --- Writes outside the project ---
in_tmp=0
case "$ABS" in /tmp/*|/private/tmp/*|/var/folders/*|"${TMPDIR:-/nonexistent}"*|"$HOME/.claude/"*|"$HOME/.cache/"*) in_tmp=1 ;; esac
if [ "$in_tmp" = 0 ]; then
  case "$ABS" in
    "$AW_CWD"|"$AW_CWD/"*) ;;
    *) apply outside-project warn "writing outside the project directory ($FILE). Confirm this is intended" ;;
  esac
fi

aw_flush
