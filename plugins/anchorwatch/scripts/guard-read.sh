#!/usr/bin/env bash
# Anchorwatch — PreToolUse guard for the Read tool: keeps secrets out of the transcript.
. "$(dirname "$0")/lib.sh"
aw_read_input
AW_HOOK_EVENT="PreToolUse"

FILE="$(aw_json "$AW_INPUT" .tool_input.file_path)"
[ -z "$FILE" ] && exit 0
aw_allowed "$FILE" && exit 0
case "$FILE" in "~"*) FILE="$HOME${FILE#\~}" ;; esac
case "$FILE" in /*) ABS="$FILE" ;; *) ABS="$AW_CWD/$FILE" ;; esac
LOWBASE="$(aw_lower "$(basename "$ABS")")"

secret=0
case "$LOWBASE" in
  .env.example|.env.sample|.env.template|.env.dist|.env.schema) ;;
  .env|.env.*) secret=1 ;;
  *.pem|*.key|*.p12|*.pfx|id_rsa|id_ed25519|id_ecdsa|.netrc|.npmrc|.pypirc|.git-credentials|credentials|credentials.json|secrets.json|secrets.yml|secrets.yaml) secret=1 ;;
esac
case "$ABS" in "$HOME/.ssh/"*|"$HOME/.aws/"*|"$HOME/.config/gh/"*|"$HOME/.kube/"*|"$HOME/.gnupg/"*) secret=1 ;; esac

if [ "$secret" = 1 ]; then
  lvl="$(aw_level secret-read block)"
  case "$lvl" in
    block) aw_deny "reading a secret-bearing file ($FILE) would copy credentials into the conversation. To learn which variables exist run: grep -oE '^[A-Za-z_][A-Za-z0-9_]*' $FILE — or ask the user for the specific value." "secret-read" ;;
    warn)  aw_add_warning "you are reading a secret-bearing file ($FILE). Never repeat the values in your replies, commits, or other files [secret-read]" ;;
  esac
fi
aw_flush
