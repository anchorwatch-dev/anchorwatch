---
title: Thanks — set up Anchorwatch Pro
description: Your purchase is complete. Accept the GitHub invitation, add the private marketplace, and install the Pro plugins.
---
<p class="eyebrow">Purchase complete</p>

# Welcome aboard.

Polar has just granted your GitHub account read access to the private `anchorwatch-pro` repository. Three steps and you're running.

## 1. Accept the GitHub invitation

Check the email address attached to your GitHub account, or open [github.com/notifications](https://github.com/notifications). Accept the invitation to **anchorwatch-dev/anchorwatch-pro**. Until you do, the next step will fail with a "repository not found" error.

## 2. Add the marketplace

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch-pro
```

This clones with your normal GitHub credentials. If you only use HTTPS, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` first; if background updates later fail, run `gh auth setup-git` once.

## 3. Install what you want

```bash
claude plugin install quality-gates@anchorwatch-pro
claude plugin install ship@anchorwatch-pro
claude plugin install review-crew@anchorwatch-pro
claude plugin install context-keeper@anchorwatch-pro
claude plugin install setup-audit@anchorwatch-pro
claude plugin install stack-packs@anchorwatch-pro
```

Or inside Claude Code: `/plugin` → Browse → anchorwatch-pro. Start a new session, then try `/setup-audit:run` for an immediate read on your configuration.

## Team licence?

Open an issue in the `anchorwatch-pro` repository titled "Team seats" listing the GitHub usernames to add (up to nine more). They're added within a day.

## Something not working?

- **No invitation after 10 minutes** — check that the GitHub account connected to Polar is the one you expect (Polar customer portal → Benefits → GitHub Repository Access), then re‑trigger it there.
- **Marketplace add fails** — you haven't accepted the invitation yet, or you're logged into a different GitHub account in `gh`.
- Anything else: [open an issue](https://github.com/anchorwatch-dev/anchorwatch-pro/issues) (private to buyers) or email hello@anchorwatch.sh. Your receipt and refund options are in the Polar email.

Thank you for backing an experiment. The free guardrails plugin and the [experiment page](/experiment/) are where this all started.

<script>
(function(){try{var d=JSON.stringify({n:"purchase_landing",m:location.search.slice(0,120)});navigator.sendBeacon&&navigator.sendBeacon("/api/event",new Blob([d],{type:"application/json"}))}catch(e){}})();
</script>
