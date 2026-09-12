#!/usr/bin/env bash
# Anchorwatch CLI: status | check <command> | doctor | rules | version
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/lib.sh"
AW_INPUT=""; AW_CWD="$PWD"; aw_load_config

rules_table() {
cat <<'T'
RULE                      DEFAULT  WHAT IT CATCHES
rm-recursive-dangerous    block    rm -r on /, ~, ., .., *, system dirs, the project root or .git
rm-recursive              warn     any other recursive delete
git-force-push-protected  block    git push --force/-f to main, master, production, prod, release (configurable)
git-force-push            warn     force push to any other branch (suggests --force-with-lease)
git-push-delete           warn     git push --delete / --mirror / :branch
git-destructive           block    reset --hard, clean -f, checkout -- ., restore ., stash drop/clear, branch -D, filter-branch, submodule deinit -f, worktree remove -f
sql-destructive           block    DROP TABLE/DATABASE/SCHEMA, TRUNCATE, DELETE FROM without WHERE
pipe-to-shell             block    curl/wget ... | sh
disk-destroy              block    mkfs, dd if=, fdisk, parted, shred, > /dev/sdX
perm-broad                block    chmod 777, chown -R ... /
env-read                  block    cat/head/tail/less of .env files (prints secrets into the transcript)
secret-write              block    shell writes to a secret file: > .env, tee, cp/mv into it, sed -i, dd of=
env-dump                  warn     printenv / env / set with no filter
publish                   warn     npm publish, gh release create, docker push, fly deploy, terraform apply, kubectl delete, ...
sudo                      warn     any sudo
kill-broad                warn     kill -9 -1, killall, pkill -f
system-config             warn     writes to ~/.zshrc etc, /etc/hosts, crontab
secret-files              block    Edit/Write to .env*, *.pem, *.key, id_rsa, credentials*, ~/.ssh, ~/.aws, ...
git-internals             block    Edit/Write inside .git/
lockfiles                 warn     hand-editing package-lock.json, yarn.lock, Cargo.lock, ...
self-config               warn     editing .claude/settings*.json, .mcp.json, plugin manifests
infra-files               warn     editing CI workflows, Dockerfile, fly.toml, terraform
outside-project           warn     writing files outside the project (temp dirs excluded)
secret-read               block    Read tool on .env*, keys, credentials
secret-scan               warn     PostToolUse: credential patterns in content that was just written
T
}

case "${1:-status}" in
  version) echo "anchorwatch $AW_VERSION" ;;
  rules) rules_table ;;
  status)
    echo "Anchorwatch $AW_VERSION"
    echo "Config file: $AW_CONFIG_PATH"
    echo "Kill switch: ANCHORWATCH_DISABLE=${ANCHORWATCH_DISABLE:-0}"
    echo
    printf '%-26s %-8s %-8s\n' RULE DEFAULT ACTIVE
    rules_table | tail -n +2 | while read -r rule def rest; do
      printf '%-26s %-8s %-8s\n' "$rule" "$def" "$(aw_level "$rule" "$def")"
    done
    echo
    echo "Allow patterns:"; aw_json_lines "$AW_CONFIG_JSON" .allow | sed 's/^/  /' ; [ -z "$(aw_json_lines "$AW_CONFIG_JSON" .allow)" ] && echo "  (none)"
    echo "Protected branches:"; aw_protected_branches | tr '\n' ' '; echo ;;
  check)
    shift; cmd="$*"
    [ -z "$cmd" ] && { echo "usage: aw.sh check <shell command>"; exit 1; }
    out="$(printf '{"hook_event_name":"PreToolUse","tool_name":"Bash","cwd":%s,"tool_input":{"command":%s}}' "$(aw_json_str "$PWD")" "$(aw_json_str "$cmd")" | bash "$HERE/guard-bash.sh")"
    if [ -z "$out" ]; then echo "PASS — no rule matched: $cmd"
    elif printf '%s' "$out" | grep -q '"permissionDecision":"deny"'; then echo "DENY —"; printf '%s' "$out" | sed -E 's/.*"permissionDecisionReason":"//; s/"}}$//' | sed 's/\\n/\n/g'
    else echo "WARN —"; printf '%s' "$out" | sed -E 's/.*"additionalContext":"//; s/"}}$//' | sed 's/\\n/\n/g'; fi ;;
  doctor)
    echo "Anchorwatch doctor"
    for t in bash grep sed awk; do command -v $t >/dev/null && echo "  ok   $t" || echo "  MISSING $t"; done
    case "$(aw_parser)" in none) echo "  FAIL no jq, node, or python3 found — hooks cannot parse input. Install jq." ;; *) echo "  ok   JSON parser: $(aw_parser)" ;; esac
    echo "  bash $(bash --version | head -1 | sed -E 's/.*version ([0-9.]+).*/\1/')"
    echo "  config: $AW_CONFIG_PATH"
    echo "  self-test:"
    r="$(printf '{"tool_name":"Bash","cwd":"/tmp","tool_input":{"command":"git push --force origin main"}}' | bash "$HERE/guard-bash.sh")"
    printf '%s' "$r" | grep -q deny && echo "    ok   force-push to main is denied" || echo "    FAIL force-push to main was not denied"
    r="$(printf '{"tool_name":"Bash","cwd":"/tmp","tool_input":{"command":"ls -la"}}' | bash "$HERE/guard-bash.sh")"
    [ -z "$r" ] && echo "    ok   harmless command passes" || echo "    FAIL harmless command produced output: $r" ;;
  *) echo "usage: aw.sh [status|check <cmd>|doctor|rules|version]"; exit 1 ;;
esac
