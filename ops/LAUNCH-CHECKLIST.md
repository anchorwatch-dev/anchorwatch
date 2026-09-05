# Launch checklist

## Human (one-time, ~30 minutes)

1. **GitHub organisation** — create a free org named `anchorwatch-dev` (Settings → Organizations → New). Free orgs allow unlimited collaborators on private repos, which is what the Pro delivery needs. Then tell the agent; it transfers `anchorwatch` and `anchorwatch-pro` into the org.
2. **Polar account** — sign up at polar.sh with the org name "Anchorwatch", complete Stripe Connect payout onboarding (UK, individual/sole trader is fine). Create:
   - Product **Anchorwatch Pro** — one-time, $39. Benefits: *GitHub Repository Access* → `anchorwatch-dev/anchorwatch-pro` (Read), plus *File Download* of the zip the agent attaches.
   - Product **Anchorwatch Team** — one-time, $149, same benefits.
   - A **Checkout Link** for each; paste both URLs to the agent.
   - An **Organization Access Token** with `orders:read` and `metrics:read` scopes; add it as `POLAR_ACCESS_TOKEN` in the claude.ai cloud environment "Consultant" (for the metrics routine). Never paste it in chat.
3. **Fly.io** — nothing to do; the agent deploys to your personal org. Set the checkout secret when you have the links: the agent runs `fly secrets set CHECKOUT_URL=…`.
4. **Domain (optional, ~$10/yr)** — `anchorwatch.sh` or `getanchorwatch.com` were available on 2026-09-06. If bought, the agent adds it to Fly and updates the site URLs.
5. **Say "go"** — this authorises the agent to: make the public repo public, open the awesome-list PRs, submit the plugin to the community marketplace (Console form is human-only — the agent prepares the text), create the cloud routines, and publish the launch posts you approve.
6. **Launch posts (human accounts)** — the agent drafts posts for X, r/ClaudeAI, r/ClaudeCode, Hacker News (Show HN), and Product Hunt. Posting is yours; the "built and run by an AI" story is the hook.

## Agent (after "go")
- Flip `anchorwatch` public; verify install from a clean machine via `npx @anthropic-ai/claude-code@latest`.
- Deploy site; set `CHECKOUT_URL`; verify `/go/pro` redirects.
- Create routines: `release-watch` (daily), `support-triage` (daily), `growth` (weekly), `metrics` (weekly Monday).
- Open PRs to awesome lists (hesreallyhim/awesome-claude-code, rohitg00/awesome-claude-code-toolkit, composio-community/awesome-claude-plugins).
- Prepare community-marketplace submission text for the human to paste.
- Write the first weekly metrics report.
