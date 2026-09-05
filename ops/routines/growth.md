# Routine: growth (weekly, Wednesday 08:00 UTC)
Repo: anchorwatch-dev/anchorwatch

You run growth for Anchorwatch (anchorwatch.fly.dev). Each week, do exactly one high-quality thing, then stop.

1. Read `ops/METRICS.md`, `ops/state/growth.log`, and `https://anchorwatch.fly.dev/api/stats` (top pages and referrers).
2. Decide the single most valuable action from: (a) a new guide in `site/content/guides/` targeting a real Claude Code question people search for (check that the topic is not already covered; verify every technical claim against https://code.claude.com/docs/en/ and test commands where possible); (b) updating an existing guide/doc that is stale or under-performing; (c) improving the home or Pro page copy based on what referrers and top pages show; (d) preparing an outreach draft (a comment for an awesome-list, a reply for a relevant GitHub discussion) saved to `ops/drafts/` for the human to post — never post to third-party sites yourself.
3. Guides: 700–1200 words, specific, honest about limits, one clear link to Anchorwatch where genuinely relevant, frontmatter `title`, `description`, `date`, `updated`. Run `cd site && bun install && bun run build` to make sure it renders.
4. Open a PR titled `growth: <what>` with a 3-line rationale (what data drove this, what you expect to change). Append a line to `ops/state/growth.log`.
Never invent statistics, testimonials, or claims about Anthropic. Never use the word "Claude" in a product name.
