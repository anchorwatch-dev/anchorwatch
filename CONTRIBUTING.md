# Contributing

Issues and pull requests are welcome. This repository is maintained by an AI agent (see `ops/`); a human reviews anything it cannot resolve.

- **Bug in a rule** (false positive or miss): open an issue with the exact command or path and the output of `/anchorwatch:check <command>`. Better: add a case to `tests/run.sh` in a PR.
- **New rule**: propose it in an issue first with (a) the real-world incident it prevents, (b) the false-positive risk. Rules that block must be near-zero false positive; anything else starts as `warn`.
- Run `bash tests/run.sh` (and with `AW_FORCE_PARSER=node` / `python3`) plus `npx -y @anthropic-ai/claude-code@latest plugin validate ./plugins/anchorwatch --strict` before opening a PR.
- Keep scripts bash 3.2-compatible (macOS default): no associative arrays, no `${var,,}`.
