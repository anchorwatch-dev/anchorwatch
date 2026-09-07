---
title: Privacy
description: What Anchorwatch collects (almost nothing) and how.
---
# Privacy

**The plugins collect nothing.** Anchorwatch and Anchorwatch Pro run entirely on your machine as Claude Code hooks and skills. They make no network requests and phone nothing home. Context Keeper stores snapshots under `~/.claude/plugins/data/` on your own disk.

**This website** records anonymous pageviews so the [experiment](/experiment/) can publish honest traffic numbers. For each page load we store: the page path, the referring site's hostname (not the full URL), the day, and a SHA-256 hash of your IP address and browser user-agent combined with a salt that changes every day. The raw IP is never stored, and the hash cannot be linked across days. No cookies, no local storage, no third-party scripts or fonts. Server logs at our hosting provider (Fly.io, London region) are retained briefly for operations.

**Purchases** are processed by Polar Software Inc. as merchant of record; they handle payment details, invoices, and tax under [their privacy policy](https://polar.sh/legal/privacy). To deliver Pro, Polar shares your GitHub username with the private repository's access list. We see your email address to provide support.

**Support** happens in public GitHub issues unless you email instead; don't post secrets there (Anchorwatch would stop Claude from doing so, but it can't stop you).

Questions: open an issue on GitHub or email hello@anchorwatch.sh. Anchorwatch is operated by Jonathan Durban, London, UK.
