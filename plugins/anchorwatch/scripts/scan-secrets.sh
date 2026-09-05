#!/usr/bin/env bash
# Anchorwatch — PostToolUse scanner for Edit / Write / MultiEdit: flags credentials that were just written.
. "$(dirname "$0")/lib.sh"
aw_read_input
AW_HOOK_EVENT="PostToolUse"
[ "$(aw_level secret-scan warn)" = "off" ] && exit 0

FILE="$(aw_json "$AW_INPUT" .tool_input.file_path)"
CONTENT="$(aw_json "$AW_INPUT" .tool_input.content)"
[ -z "$CONTENT" ] && CONTENT="$(aw_json "$AW_INPUT" .tool_input.new_string)"
if [ -z "$CONTENT" ]; then
  # MultiEdit: concatenate all new_string values
  CONTENT="$(aw_multiedit_content "$AW_INPUT")"
fi
[ -z "$CONTENT" ] && exit 0
case "$(aw_lower "$(basename "$FILE")")" in .env.example|.env.sample|.env.template|*.md|*.mdx|*.txt) exit 0 ;; esac
aw_allowed "$FILE" && exit 0

found=""
hit() { # $1 label $2 ERE
  local m
  m="$(printf '%s\n' "$CONTENT" | grep -nE -- "$2" | head -1 | cut -d: -f1)"
  [ -n "$m" ] && found="$found
- $1 (line ~$m of the written text)"
}
hit "AWS access key"            'AKIA[0-9A-Z]{16}'
hit "GitHub token"              '(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})'
hit "Stripe live key"           '(sk|rk)_live_[0-9a-zA-Z]{20,}'
hit "Anthropic API key"         'sk-ant-[A-Za-z0-9_-]{30,}'
hit "OpenAI API key"            'sk-(proj-)?[A-Za-z0-9_-]{32,}'
hit "Slack token"               'xox[baprs]-[0-9A-Za-z-]{10,}'
hit "Google API key"            'AIza[0-9A-Za-z_-]{35}'
hit "SendGrid key"              'SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}'
hit "Twilio key"                'SK[0-9a-fA-F]{32}'
hit "Private key block"         '-----BEGIN (RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY'
hit "Database URL with password" '(postgres(ql)?|mysql|mongodb(\+srv)?|redis|amqp)://[^:/[:space:]]+:[^@/[:space:]]{4,}@'
hit "JWT"                       'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
# Generic assignment of a long literal to a secret-looking name, excluding env lookups and placeholders.
gen="$(printf '%s\n' "$CONTENT" | grep -niE -- '(password|passwd|secret|token|api[_-]?key|private[_-]?key)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{12,}["'"'"']' \
  | grep -viE 'process\.env|os\.environ|getenv|env\(|import\.meta\.env|<[^>]+>|your[-_ ]|example|changeme|placeholder|xxx|\$\{|dummy|redacted|\*\*\*' | head -1 | cut -d: -f1)"
[ -n "$gen" ] && found="$found
- hard-coded credential-like literal (line ~$gen of the written text)"

if [ -n "$found" ]; then
  msg="Anchorwatch: possible secrets were just written to ${FILE:-a file}:$found
Do not commit this. Move the value to an environment variable (and .env.example with a placeholder), reference it from code, and tell the user to rotate the credential if it is real."
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":%s}}\n' "$(aw_json_str "$msg")"
fi
exit 0
