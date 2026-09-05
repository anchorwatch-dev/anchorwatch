#!/usr/bin/env bash
# Anchorwatch — shared helpers for hook scripts.
# Bash 3.2+ compatible (macOS default). Needs one JSON parser: jq (preferred), node, or python3.
# Every hook script sources this file, then calls aw_read_input.

AW_VERSION="0.1.0"
AW_INPUT=""
AW_CWD=""
AW_CONFIG_JSON=""
AW_CONFIG_PATH="(defaults)"
AW_PARSER=""

# Pick the JSON parser once. AW_JSON_PARSER=jq|node|python3 overrides auto-detection.
aw_parser() {
  if [ -z "$AW_PARSER" ]; then
    case "${AW_JSON_PARSER:-}" in jq|node|python3) AW_PARSER="$AW_JSON_PARSER" ;; esac
    if [ -z "$AW_PARSER" ]; then
      if command -v jq >/dev/null 2>&1; then AW_PARSER=jq
      elif command -v node >/dev/null 2>&1; then AW_PARSER=node
      elif command -v python3 >/dev/null 2>&1; then AW_PARSER=python3
      else AW_PARSER=none; fi
    fi
  fi
  printf '%s' "$AW_PARSER"
}

aw_read_input() {
  AW_INPUT="$(cat 2>/dev/null || true)"
  AW_CWD="$(aw_json "$AW_INPUT" .cwd)"
  [ -z "$AW_CWD" ] && AW_CWD="$PWD"
  aw_load_config
}

# Convert a dotted path (.a.b-c) into jq bracket form (.["a"]["b-c"]) so hyphens are safe.
aw_jqpath() {
  local p="${1#.}" out="" seg rest
  [ -z "$p" ] && { printf '.'; return; }
  rest="$p"
  while [ -n "$rest" ]; do
    seg="${rest%%.*}"
    out="$out[\"$seg\"]"
    case "$rest" in *.*) rest="${rest#*.}" ;; *) rest="" ;; esac
  done
  printf '.%s' "$out"
}

# aw_json <json> <dotted.path>  -> string value, or JSON text for non-strings, or nothing.
aw_json() {
  local json="$1" path="$2"
  [ -z "$json" ] && return 0
  case "$(aw_parser)" in
    jq)
      printf '%s' "$json" | jq -r "$(aw_jqpath "$path") // empty" 2>/dev/null ;;
    node)
      printf '%s' "$json" | node -e '
        let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
          try{const o=JSON.parse(s);
            const v=process.argv[1].replace(/^\./,"").split(".").reduce((a,k)=>a==null?undefined:a[k],o);
            if(v!=null)process.stdout.write(typeof v==="string"?v:JSON.stringify(v));
          }catch(e){}});' "$path" 2>/dev/null ;;
    python3)
      printf '%s' "$json" | python3 -c '
import sys,json
try:
    o=json.load(sys.stdin)
except Exception:
    sys.exit(0)
for k in sys.argv[1].lstrip(".").split("."):
    o=o.get(k) if isinstance(o,dict) else None
    if o is None: break
if o is not None:
    sys.stdout.write(o if isinstance(o,str) else json.dumps(o))' "$path" 2>/dev/null ;;
  esac
}

# aw_json_lines <json> <dotted.path>  -> array items, one per line.
aw_json_lines() {
  local json="$1" path="$2" arr
  [ -z "$json" ] && return 0
  case "$(aw_parser)" in
    jq) printf '%s' "$json" | jq -r "($(aw_jqpath "$path") // [])[]? | tostring" 2>/dev/null ;;
    node|python3)
      arr="$(aw_json "$json" "$path")"
      case "$arr" in
        \[*)
          if [ "$(aw_parser)" = node ]; then
            printf '%s' "$arr" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{for(const x of JSON.parse(s))console.log(String(x))}catch(e){}})' 2>/dev/null
          else
            printf '%s' "$arr" | python3 -c 'import sys,json
try:
    [print(str(x)) for x in json.load(sys.stdin)]
except Exception: pass' 2>/dev/null
          fi ;;
      esac ;;
  esac
}

# MultiEdit: concatenated new_string values
aw_multiedit_content() {
  local json="$1"
  case "$(aw_parser)" in
    jq) printf '%s' "$json" | jq -r '[.tool_input.edits[]?.new_string // empty] | join("\n")' 2>/dev/null ;;
    node) printf '%s' "$json" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const o=JSON.parse(s);process.stdout.write((o.tool_input.edits||[]).map(e=>e.new_string||"").join("\n"))}catch(e){}})' 2>/dev/null ;;
    python3) printf '%s' "$json" | python3 -c 'import sys,json
try:
    o=json.load(sys.stdin); sys.stdout.write("\n".join(e.get("new_string","") for e in o.get("tool_input",{}).get("edits",[])))
except Exception: pass' 2>/dev/null ;;
  esac
}

# aw_json_str <text> -> JSON string literal (quoted, escaped)
aw_json_str() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="$(printf '%s' "$s" | awk 'BEGIN{ORS="\\n"} {print}' | sed 's/\\n$//')"
  s="${s//$'\t'/\\t}"
  printf '"%s"' "$s"
}

aw_lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }

# Config: nearest .anchorwatch.json walking up from cwd, else ~/.anchorwatch.json
aw_load_config() {
  local dir="$AW_CWD" f
  while [ -n "$dir" ] && [ "$dir" != "/" ]; do
    f="$dir/.anchorwatch.json"
    if [ -f "$f" ]; then AW_CONFIG_JSON="$(cat "$f")"; AW_CONFIG_PATH="$f"; return 0; fi
    dir="$(dirname "$dir")"
  done
  if [ -f "$HOME/.anchorwatch.json" ]; then
    AW_CONFIG_JSON="$(cat "$HOME/.anchorwatch.json")"; AW_CONFIG_PATH="$HOME/.anchorwatch.json"
  fi
}

# aw_level <rule-id> <default>  -> block|warn|off
aw_level() {
  local rule="$1" def="$2" v
  v="$(aw_json "$AW_CONFIG_JSON" ".rules.$rule")"
  case "$v" in block|warn|off) printf '%s' "$v" ;; *) printf '%s' "$def" ;; esac
}

# aw_allowed <text> -> 0 if the kill switch is on or text matches any allow pattern (ERE)
aw_allowed() {
  local text="$1" pat
  [ "${ANCHORWATCH_DISABLE:-0}" = "1" ] && return 0
  while IFS= read -r pat; do
    [ -z "$pat" ] && continue
    if printf '%s' "$text" | grep -Eq -- "$pat" 2>/dev/null; then return 0; fi
  done <<EOL
$(aw_json_lines "$AW_CONFIG_JSON" .allow)
EOL
  return 1
}

# Split a shell command into segments on ; && || | and newlines (rough but effective).
aw_segments() {
  printf '%s\n' "$1" | sed -E 's/(&&|\|\||;|\|)/\n/g' | sed -E 's/^[[:space:]]+//'
}

aw_protected_branches() {
  local list
  list="$(aw_json_lines "$AW_CONFIG_JSON" .protectedBranches)"
  if [ -z "$list" ]; then printf 'main\nmaster\nproduction\nprod\nrelease\n'; else printf '%s\n' "$list"; fi
}

# ----- Output helpers -----
AW_HOOK_EVENT="PreToolUse"
AW_WARNINGS=""

aw_deny() {
  local reason="Anchorwatch blocked this: $1
Rule: $2 (set \"rules\": {\"$2\": \"warn\"} in .anchorwatch.json or add an \"allow\" pattern to override). Explain the block to the user and propose a safer alternative."
  printf '{"hookSpecificOutput":{"hookEventName":"%s","permissionDecision":"deny","permissionDecisionReason":%s}}\n' "$AW_HOOK_EVENT" "$(aw_json_str "$reason")"
  exit 0
}

aw_add_warning() {
  if [ -z "$AW_WARNINGS" ]; then AW_WARNINGS="$1"; else AW_WARNINGS="$AW_WARNINGS
$1"; fi
}

aw_flush() {
  if [ -n "$AW_WARNINGS" ]; then
    printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":%s}}\n' "$AW_HOOK_EVENT" "$(aw_json_str "Anchorwatch warning: $AW_WARNINGS")"
  fi
  exit 0
}
