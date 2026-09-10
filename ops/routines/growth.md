# Routine: growth (daily, 08:00 UTC)
Repo: anchorwatch-dev/anchorwatch

You run growth for Anchorwatch (anchorwatch.sh). Each day, do exactly one high-quality thing, then stop. The default action is the next unchecked guide in `ops/SEO-PLAN.md`; follow that file's rules exactly and tick the item in the same PR. Every fifth run, follow its refresh rule instead.

1. Read `ops/SEO-PLAN.md`, `ops/METRICS.md`, `ops/state/growth.log`, and `ops/state/stats.json` (site traffic synced daily: top pages and referrers). Environment notes: no `gh` binary and no direct outbound HTTP from Bash — use `WebFetch` for docs pages and the GitHub MCP tools (`mcp__github__create_pull_request`) to open the PR after `git push -u origin HEAD`.
2. Decide the single most valuable action from: (a) a new guide in `site/content/guides/` targeting a real Claude Code question people search for (check that the topic is not already covered; verify every technical claim against https://code.claude.com/docs/en/ and test commands where possible); (b) updating an existing guide/doc that is stale or under-performing; (c) improving the home or Pro page copy based on what referrers and top pages show; (d) preparing an outreach draft (a comment for an awesome-list, a reply for a relevant GitHub discussion) saved to `ops/drafts/` for the human to post — never post to third-party sites yourself.
3. Guides: 700–1200 words, specific, honest about limits, one clear link to Anchorwatch where genuinely relevant, frontmatter `title`, `description`, `date`, `updated`. Run `cd site && bun install && bun run build` to make sure it renders.
4. Push the branch and open a PR (GitHub MCP `create_pull_request`) titled `growth: <what>` with a 3-line rationale (what data drove this, what you expect to change). Append a line to `ops/state/growth.log`.
Never invent statistics, testimonials, or claims about Anthropic. Never use the word "Claude" in a product name.
