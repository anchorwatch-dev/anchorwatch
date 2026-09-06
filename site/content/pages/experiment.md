---
title: The experiment — a business built and run by an AI agent
description: Anchorwatch is built, marketed, supported and optimised by Claude (Fable 5.1) running in Claude Code, with a human owner doing only what a human legally must. Public metrics, decisions, and costs.
---
<p class="eyebrow">The experiment</p>

# A business built and run by an AI agent.

**Premise.** Can a frontier model, given a terminal, a browser, a cloud scheduler and a small budget, build and run a real product business end to end — and keep running it without a human steering day to day?

**Setup.** On 6 September 2026 a human owner gave Claude (Fable 5.1, via Claude Code) one instruction: research, pick, build, launch and operate an online business. The model chose the niche, wrote every line of the product, this site and its docs, and runs the ongoing operations through scheduled cloud agents. The human does exactly the things a human legally must: hold the payment and hosting accounts, approve anything irreversible or public-facing the first time, and pay the bills.

**Why this product.** Job boards and content sites take a year of SEO before they earn anything; micro-SaaS in the AI category is the most crowded market in software. A developer tool sold to developers, distributed through GitHub, with a maintenance burden that a model is unusually good at carrying (tracking Claude Code releases and adjusting hooks the same day) looked like the shortest honest path to first revenue. The full reasoning is in the [decision log](https://github.com/anchorwatch-dev/anchorwatch/blob/main/ops/DECISIONS.md).

## Live metrics

<div class="stat" id="live">
<div class="card"><b id="m-pv30">…</b>pageviews, 30 days</div>
<div class="card"><b id="m-uv30">…</b>unique visitors, 30 days</div>
<div class="card"><b id="m-today">…</b>visitors today</div>
<div class="card"><b id="m-clicks">…</b>checkout clicks, 30 days</div>
</div>
<p class="small">Pageviews are counted server-side from an anonymous beacon: path, referrer hostname, and a hash of IP + user agent that rotates daily. No cookies, no third-party scripts. Raw JSON: <a href="/api/stats">/api/stats</a>.</p>

<h3>Daily visitors</h3>
<div id="chart" class="small">loading…</div>
<h3>Top referrers</h3>
<div id="refs" class="small">loading…</div>

## Ledger

Updated by the weekly metrics routine; the source of truth is [ops/METRICS.md](https://github.com/anchorwatch-dev/anchorwatch/blob/main/ops/METRICS.md).

| Week | Visitors | GitHub stars | Installs (unique clones) | Pro sales | Revenue (net) | Costs |
|---|---|---|---|---|---|---|
| 2026-W36 (build) | 0 | 0 | 0 | 0 | $0 | ~$0 (Fly idle) |

## What the agent does each day

- **Release watch** — checks Claude Code's changelog; when hooks, plugins, skills or settings change, updates the plugins, runs the test suite, ships a release, and posts a changelog entry.
- **Support** — triages new GitHub issues, reproduces bugs against the test suite, fixes what it can, and drafts replies; a human reviews anything involving money.
- **Growth** — writes one useful guide a week for real search intent, keeps the docs accurate, and reads referrer data to see what's working.
- **Metrics** — every Monday: visitors, stars, clones, sales, revenue, costs → the ledger above, plus a short written assessment and the next experiment to run.

## Rules the agent works under

1. It never touches payment credentials, creates accounts, or accepts terms — the human does those.
2. Anything public and irreversible (making a repo public, posting, releasing) needed a human "go" the first time.
3. It reports results honestly, including failure. If nobody buys, this page will say so.

<script>
(async function(){try{const s=await (await fetch('/api/stats')).json();
const t=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
t('m-pv30',s.last30.pageviews.toLocaleString());t('m-uv30',s.last30.uniques.toLocaleString());t('m-today',s.today.uniques.toLocaleString());
t('m-clicks',(s.events||[]).filter(e=>e.name==='checkout_click').reduce((a,e)=>a+e.n,0).toLocaleString());
const days=s.daily||[];const max=Math.max(1,...days.map(d=>d.uniques));
document.getElementById('chart').innerHTML=days.length?'<div style="display:flex;align-items:flex-end;gap:3px;height:120px">'+days.map(d=>`<div title="${d.day}: ${d.uniques} visitors, ${d.pageviews} views" style="flex:1;background:var(--accent);height:${Math.max(2,Math.round(d.uniques/max*110))}px;border-radius:2px 2px 0 0"></div>`).join('')+'</div><div style="display:flex;justify-content:space-between"><span>'+days[0].day+'</span><span>'+days[days.length-1].day+'</span></div>':'No visits recorded yet.';
const r=s.referrers||[];document.getElementById('refs').innerHTML=r.length?'<table><tr><th>Referrer</th><th>Views</th></tr>'+r.map(x=>`<tr><td>${x.ref.replace(/</g,'&lt;')}</td><td>${x.n}</td></tr>`).join('')+'</table>':'No referrers yet — all traffic is direct.';
}catch(e){document.getElementById('chart').textContent='Stats unavailable right now.'}})();
</script>
