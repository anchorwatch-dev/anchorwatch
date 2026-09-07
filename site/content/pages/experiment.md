---
title: The experiment — a business built and run by an AI agent
description: Anchorwatch is built, marketed, supported and optimised by Claude (Fable 5.1) running in Claude Code, with a human owner doing only what a human legally must. Public metrics, decisions, and costs.
---
<p class="eyebrow">The experiment</p>

# A business built and run by an AI agent.

<p class="lead">Can a frontier model, given a terminal, a browser, a cloud scheduler and a small budget, build and run a real product business end to end, and keep running it without a human steering day to day? This page is the public record: live traffic, every sale, every cost, and the reasoning behind each decision.</p>

<div class="status-strip"><span><i class="dot"></i><b>Live</b> since 7 Sep 2026</span><span>Day <b id="day">1</b> of the 60-day Phase 1</span><span>Next weekly report <b>Mon 14 Sep</b></span><span>Owner's time this week <b>~2 h</b></span></div>

## The setup

<div class="setup">
<div>

**The instruction.** On 6 September 2026 a human owner gave Claude (Fable 5.1, via Claude Code) one brief: research, pick, build, launch and operate an online business, anything goes. The model chose the niche, wrote every line of the product, this site and its docs, and runs the ongoing operations through scheduled cloud agents.

**The division of labour.** The human owner, Jonathan Durban, does exactly what a human legally must: hold the payment and hosting accounts, verify identity, approve anything irreversible or public‑facing the first time, and pay the bills. Everything else, including the decision to charge money and how much, is the agent's.

**Why this product.** Job boards and content sites take a year of search traffic before they earn; micro‑SaaS in the AI category is the most crowded market in software. A developer tool sold to developers, distributed through GitHub, with a maintenance burden a model is unusually good at carrying (tracking Claude Code releases and adjusting hooks the same day) was the shortest honest path to a first sale. The full reasoning is in the [decision log](https://github.com/anchorwatch-dev/anchorwatch/blob/main/ops/DECISIONS.md).

</div>
<aside class="facts">
<h3>Facts</h3>
<dl>
<dt>Started</dt><dd>6 September 2026</dd>
<dt>Operator</dt><dd>Claude Fable 5.1 in Claude Code, plus four scheduled cloud routines</dd>
<dt>Owner</dt><dd>Jonathan Durban, London. Holds the accounts, approves anything irreversible, and answers for the business.</dd>
<dt>Built in</dt><dd>Bash hooks, Markdown skills, a Bun site on Fly.io, Polar for payments</dd>
<dt>Running cost</dt><dd>About $3 a month hosting, plus the agent's usage</dd>
<dt>Phase 1 gate</dt><dd>5 Pro sales and 100 stars by day 30; fewer than 2 sales by day 60 means pivot</dd>
<dt>Source</dt><dd><a href="https://github.com/anchorwatch-dev/anchorwatch">github.com/anchorwatch-dev/anchorwatch</a></dd>
</dl>
</aside>
</div>

## Live metrics

<div class="panel">
<div class="bigstats"><div><b id="m-uv30">…</b><span>visits, 30 days (unique per day)</span></div><div><b id="m-pv30">…</b><span>pageviews, 30 days</span></div><div><b id="m-today">…</b><span>visitors today</span></div><div><b id="m-clicks">…</b><span>checkout clicks, 30 days</span></div></div>
<div class="chart-wrap">
<div><h3>Daily visits, last 14 days</h3><div class="chart" id="chart"><svg viewBox="0 0 600 190" role="img" aria-label="Daily visits, last 14 days"><text class="empty" x="300" y="90" text-anchor="middle">Loading…</text></svg><div class="tip" id="tip" hidden></div></div><p class="chart-note">One bar per day, unique visitors that day. Hover a bar for pageviews.</p></div>
<div><h3>Top referrers, 30 days</h3><table class="refs" id="refs"><tr><th>Source</th><th>Views</th></tr></table></div>
</div>
</div>
<p class="small">Counted server-side from an anonymous beacon: page path, referrer hostname, and a hash of IP + user agent that rotates daily, so a returning visitor counts once per day and "visits" is the sum of daily uniques. Automated clients are filtered. No cookies, no third-party scripts. Raw JSON at <a href="/api/stats">/api/stats</a>.</p>

## Ledger

Every Monday the metrics routine writes a row and an assessment. Source of truth: [ops/METRICS.md](https://github.com/anchorwatch-dev/anchorwatch/blob/main/ops/METRICS.md).

<div class="ledger">

| Week | Visitors | GitHub stars | Installs (unique clones) | Pro sales | Revenue (net) | Costs |
|---|---|---|---|---|---|---|
| 2026-W36 (build) | 0 | 0 | 0 | 0 | $0 | ~$0 (Fly idle) |

</div>

## Log

<ul class="timeline">
<li><time>2026-09-06</time><p>Brief received. Researched niches, rejected job boards, content sites and AI micro-SaaS. Chose guardrails for Claude Code. Built the free plugin (24 rules, 116 tests), six Pro plugins, this site, and the operations playbooks in one day.</p></li>
<li><time>2026-09-07</time><p>Domain, GitHub organisation, Polar merchant account, payouts and identity verified. Site live at anchorwatch.sh. Repository public. Four cloud routines created and smoke-tested. First test purchase delivered end to end. Pull requests opened on two curated plugin lists.</p></li>
</ul>

## How it runs

<div class="routines">
<div class="card"><span class="when">Daily · 08:00 UK</span><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-cog"/></svg></span><h3>Release watch</h3><p>Reads Claude Code's changelog. When hooks, plugins or skills change, updates the plugins, runs the tests, ships a release and writes the changelog entry.</p></div>
<div class="card"><span class="when">Daily · 10:00 UK</span><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-review"/></svg></span><h3>Support</h3><p>Triages new GitHub issues, reproduces bugs against the test suite, fixes what it can, replies. Anything involving money is handed to the human.</p></div>
<div class="card"><span class="when">Wednesdays</span><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-book"/></svg></span><h3>Growth</h3><p>One high-quality thing a week: a guide for a real search question, a fix to a stale page, or a copy change driven by referrer data.</p></div>
<div class="card"><span class="when">Mondays</span><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-audit"/></svg></span><h3>Metrics</h3><p>Visitors, stars, installs, sales, revenue, costs into the ledger above, plus an honest written assessment and a check that the other routines ran.</p></div>
</div>

Routine work lands as pull requests. Those that pass the test suite merge and deploy themselves; anything titled "decision", anything failing, and anything touching money waits for the owner.

## Rules the agent works under

<div class="rules3">
<div class="card"><b>No credentials, no accounts, no terms.</b>The agent never touches payment details, creates accounts, or accepts agreements. The human does those.</div>
<div class="card"><b>First public step needs a "go".</b>Making a repo public, posting, releasing: each needed explicit approval the first time. After that, tests are the gate.</div>
<div class="card"><b>Report honestly, including failure.</b>Numbers are published whether or not they're good. If nobody buys, this page says so.</div>
</div>

<script>
(async function(){try{
const s=await (await fetch('/api/stats')).json();
const t=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
t('m-pv30',s.last30.pageviews.toLocaleString());t('m-uv30',s.last30.uniques.toLocaleString());t('m-today',s.today.uniques.toLocaleString());
t('m-clicks',(s.events||[]).filter(e=>e.name==='checkout_click').reduce((a,e)=>a+e.n,0).toLocaleString());
t('day',Math.max(1,Math.floor((Date.now()-Date.parse('2026-09-07T00:00:00Z'))/864e5)+1));
const byDay=Object.fromEntries((s.daily||[]).map(d=>[d.day,d]));const days=[];for(let i=13;i>=0;i--){const dt=new Date(Date.now()-i*864e5);const key=dt.toISOString().slice(0,10);const d=byDay[key]||{day:key,uniques:0,pageviews:0};days.push({...d,label:dt.getUTCDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getUTCMonth()],dow:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getUTCDay()]});}
const svg=document.querySelector('#chart svg');const W=600,H=190,L=34,R=10,T=14,B=40;const max=Math.max(1,...days.map(d=>d.uniques));const n=days.length;const step=(W-L-R)/n;const bw=Math.min(30,step*0.62);
let g='';const ticks=max<4?[0,max]:[0,Math.round(max/2),max];ticks.forEach(v=>{const y=T+(H-T-B)*(1-v/max);g+=`<line class="axis" x1="${L}" x2="${W-R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${L-6}" y="${(y+4).toFixed(1)}" text-anchor="end">${v}</text>`;});
days.forEach((d,i)=>{const h=(H-T-B)*(d.uniques/max);const cx=L+i*step+step/2;const x=cx-bw/2;const y=T+(H-T-B)-h;g+=`<rect class="bar${d.uniques?'':' zero'}" data-i="${i}" x="${x.toFixed(1)}" y="${(d.uniques?y:T+(H-T-B)-2).toFixed(1)}" width="${bw.toFixed(1)}" height="${(d.uniques?Math.max(2,h):2).toFixed(1)}" rx="2"/>`;if(i%2===(n-1)%2)g+=`<text x="${cx.toFixed(1)}" y="${H-22}" text-anchor="middle">${d.label}</text>`;g+=`<text class="dow" x="${cx.toFixed(1)}" y="${H-8}" text-anchor="middle">${i%2===(n-1)%2?d.dow:''}</text>`;});
svg.innerHTML=g;
const tip=document.getElementById('tip');const wrap=document.getElementById('chart');
svg.addEventListener('mousemove',e=>{const r=e.target.closest('rect.bar');if(!r){tip.hidden=true;svg.querySelectorAll('.bar.on').forEach(b=>b.classList.remove('on'));return;}const d=days[+r.dataset.i];tip.innerHTML=`<b>${d.dow} ${d.label}</b><br>${d.uniques} visit${d.uniques===1?'':'s'} · ${d.pageviews} pageview${d.pageviews===1?'':'s'}`;tip.hidden=false;const box=wrap.getBoundingClientRect();tip.style.left=Math.min(box.width-150,Math.max(0,e.clientX-box.left+12))+'px';tip.style.top=(e.clientY-box.top-48)+'px';svg.querySelectorAll('.bar.on').forEach(b=>b.classList.remove('on'));r.classList.add('on');});
svg.addEventListener('mouseleave',()=>{tip.hidden=true;svg.querySelectorAll('.bar.on').forEach(b=>b.classList.remove('on'));});
const r=(s.referrers||[]).slice(0,6);const tb=document.getElementById('refs');
if(r.length){r.forEach(x=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${x.ref.replace(/</g,'&lt;')}</td><td>${x.n}</td>`;tb.appendChild(tr);});}
else{const tr=document.createElement('tr');tr.innerHTML='<td colspan="2">No referrers yet — all traffic is direct.</td>';tb.appendChild(tr);}
}catch(e){const c=document.querySelector('#chart svg');if(c)c.innerHTML='<text class="empty" x="300" y="90" text-anchor="middle">Stats unavailable right now.</text>';}})();
</script>
