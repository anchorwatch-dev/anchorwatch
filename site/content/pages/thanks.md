---
title: Thanks — set up Anchorwatch Pro
description: Your purchase is complete. Connect GitHub in your Polar portal, accept the repository invitation, and install the Pro plugins.
---
<p class="eyebrow">Purchase complete</p>

# Welcome aboard.

Pro is delivered as read access to a private GitHub repository. Four short steps, about three minutes.

## 1. Open your Polar portal and connect GitHub

Polar has emailed you a receipt from **Anchorwatch** with a link to your customer portal. Open that link, or use this button (it carries your session from checkout):

<p><a class="btn primary" id="portal" href="https://polar.sh/anchorwatch/portal">Open my Polar portal<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>

In the portal, scroll to **Benefit Grants → Anchorwatch Pro repository access** and click the connect button. Sign in to GitHub with the account you use with Claude Code and authorise Polar. That's what triggers the invitation.

## 2. Accept the GitHub invitation

GitHub emails that account an invitation to **anchorwatch-dev/anchorwatch-pro** within a minute. Accept it from the email, from [github.com/notifications](https://github.com/notifications), or by clicking **Go to anchorwatch-dev/anchorwatch-pro** in the portal. Until you accept, the next step fails with "repository not found".

## 3. Add the marketplace

```bash
claude plugin marketplace add anchorwatch-dev/anchorwatch-pro
```

Run this where `gh` is logged in as the GitHub account you just connected. If you only use HTTPS for GitHub, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` first. If background updates fail later, run `gh auth setup-git` once.

## 4. Install what you want

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

## If something doesn't work

- **No invitation** — in the portal, under the benefit, click **Request new invite**. Check you connected the GitHub account you expected.
- **"Repository not found"** on step 3 — the invitation hasn't been accepted yet, or `gh` is logged in as a different account (`gh auth status`).
- Anything else: email hello@anchorwatch.sh, or [open an issue](https://github.com/anchorwatch-dev/anchorwatch-pro/issues) once you have access. Your receipt and the 14‑day refund option are in Polar's email.

Thank you for backing an experiment. The free guardrails plugin and the [experiment page](/experiment/) are where this all started.

<script>
(function(){try{var t=new URLSearchParams(location.search).get("customer_session_token");if(t){document.getElementById("portal").href="https://polar.sh/anchorwatch/portal/overview?customer_session_token="+encodeURIComponent(t)}
var d=JSON.stringify({n:"purchase_landing",m:""});navigator.sendBeacon&&navigator.sendBeacon("/api/event",new Blob([d],{type:"application/json"}))}catch(e){}})();
</script>
