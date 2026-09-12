---
title: Anchorwatch — guardrails for Claude Code
description: A free, MIT-licensed Claude Code plugin that blocks destructive commands, protects secret files, and catches leaked credentials — plus a Pro suite for quality gates, releases, parallel code review, and context handoffs.
---
<section class="hero">
<div>
<p class="eyebrow">Guardrails for Claude Code</p>
<h1>The watch that keeps your agent from running aground.</h1>
<p class="lead">Anchorwatch stops <code>rm -rf</code>, force-pushes to main, <code>DROP TABLE</code>, <code>cat .env</code> and <code>curl | sh</code> <em>before</em> they run — and tells Claude why, so it takes the safe route instead of retrying. Zero dependencies. One command to install.</p>
<div class="cta"><a class="btn primary" href="/docs/install/"><svg class="i" aria-hidden="true"><use href="#i-anchor"/></svg>Install free</a><a class="btn ghost" href="/pro/">See Pro<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>
<div class="install"><code>claude plugin marketplace add anchorwatch-dev/anchorwatch</code></div>
<div class="trust"><span><svg class="i" aria-hidden="true"><use href="#i-check"/></svg>MIT licensed</span><span><svg class="i" aria-hidden="true"><use href="#i-check"/></svg>121 tests, 3 parsers</span><span><svg class="i" aria-hidden="true"><use href="#i-check"/></svg>macOS · Linux · Windows</span></div>
</div>
<div class="term" aria-label="Terminal demo of Anchorwatch blocking commands">
<div class="term-bar"><i></i><i></i><i></i><span>claude — ~/app</span></div>
<div class="term-body" id="demo"><span class="c"># Claude, inside your project</span>
<span class="p">$</span> git push --force origin main
<span class="x">✗ Anchorwatch blocked this:</span> force push to protected branch 'main'.
  Push to a feature branch and open a PR instead.  <span class="c">[git-force-push-protected]</span>

<span class="p">$</span> cat .env
<span class="x">✗ Anchorwatch blocked this:</span> this prints a .env file into the conversation.
  List variable names instead: grep -oE '^[A-Za-z_]+' .env  <span class="c">[env-read]</span>

<span class="p">$</span> rm -rf node_modules
<span class="w">⚠ warning:</span> recursive delete of node_modules — confirm it's intended.  <span class="ok">allowed</span>

<span class="p">$</span> npm test
<span class="ok">✓ 116 passed</span></div>
</div>
</section>

<section class="section">
<div class="section-head"><div><p class="kicker">What it catches</p><h2>Twenty-four rules. Eleven block, thirteen warn.</h2></div><p>Blocking rules deny the call before it runs. Warning rules let it run and add a note to Claude's context. Every rule is configurable per project.</p></div>
<div class="manifest">
<div><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-term"/></svg></span><h3>Destructive shell <span class="lv b">block</span></h3><p><code>rm -rf</code> on <code>/</code>, <code>~</code>, <code>.</code>, globs or the project root. <code>dd</code>, <code>mkfs</code>, <code>chmod 777</code>, <code>curl … | sh</code>.</p></div>
<div><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-branch"/></svg></span><h3>Git you can't undo <span class="lv b">block</span></h3><p>Force pushes to main, master, production. <code>reset --hard</code>, <code>clean -f</code>, <code>checkout -- .</code>, <code>stash drop</code>, <code>branch -D</code>.</p></div>
<div><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-db"/></svg></span><h3>Database wipes <span class="lv b">block</span></h3><p><code>DROP TABLE</code>, <code>TRUNCATE</code>, and <code>DELETE FROM</code> without a <code>WHERE</code> — through psql, mysql or any CLI.</p></div>
<div><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-key"/></svg></span><h3>Secrets in the transcript <span class="lv b">block</span></h3><p>Reading or writing <code>.env*</code>, keys, <code>~/.ssh</code>, <code>~/.aws</code>. Every write scanned for AWS, GitHub, Stripe, Anthropic, OpenAI and Slack tokens.</p></div>
<div><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-rocket"/></svg></span><h3>Irreversible deploys <span class="lv w">warn</span></h3><p><code>npm publish</code>, <code>gh release create</code>, <code>terraform apply</code>, <code>kubectl delete</code>, <code>fly deploy</code> get a "did the user ask for this?" note.</p></div>
<div><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-eye"/></svg></span><h3>Self-modification <span class="lv w">warn</span></h3><p>Edits to Claude Code's settings, hooks, MCP config or Anchorwatch's own config are flagged so the model can't quietly loosen its leash.</p></div>
</div>
<p class="small" style="margin-top:.8rem">Full list with defaults and safer alternatives → <a href="/docs/rules/">rules reference</a></p>
</section>

<section class="section">
<div class="section-head"><div><p class="kicker">How it works</p><h2>A hook sits between Claude and your machine.</h2></div><p>Every Bash command and file operation passes through a PreToolUse hook. Denied calls never execute; the reason goes back to Claude.</p></div>
<div class="flow">
<svg viewBox="0 0 800 250" role="img" aria-label="Flow: Claude proposes a tool call, Anchorwatch checks it, safe calls run on your repo, blocked calls return to Claude with a reason">
<defs>
<marker id="ah-req" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1L9 5 1 9" class="head req"/></marker>
<marker id="ah-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1L9 5 1 9" class="head ok"/></marker>
<marker id="ah-deny" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1L9 5 1 9" class="head deny"/></marker>
</defs>
<!-- wires -->
<path class="wire req" d="M152 108 H288" marker-end="url(#ah-req)"/>
<path class="wire ok" d="M522 108 H638" marker-end="url(#ah-ok)"/>
<path class="wire deny" d="M410 162 V196 Q410 206 400 206 H100 Q90 206 90 196 V158" marker-end="url(#ah-deny)"/>
<!-- pulses -->
<g class="pulse p-req"><circle class="halo req" r="9"/><circle class="core req" r="3.5"/></g>
<g class="pulse p-ok"><circle class="halo ok" r="9"/><circle class="core ok" r="3.5"/></g>
<g class="pulse p-deny"><circle class="halo deny" r="9"/><circle class="core deny" r="3.5"/></g>
<!-- nodes -->
<rect class="node" x="30" y="70" width="120" height="76" rx="12"/>
<text x="90" y="103" text-anchor="middle" class="t strong">Claude</text><text x="90" y="124" text-anchor="middle" class="t sub">proposes a call</text>
<rect class="node mid" x="300" y="56" width="220" height="104" rx="14"/>
<text x="410" y="90" text-anchor="middle" class="t mid strong">Anchorwatch</text>
<text x="410" y="111" text-anchor="middle" class="t mid sub">PreToolUse hook · 25 rules · ~20 ms</text>
<text x="410" y="140" text-anchor="middle" class="t mono"><tspan class="k-deny">deny</tspan><tspan class="mid sub"> · </tspan><tspan class="k-warn">warn</tspan><tspan class="mid sub"> · </tspan><tspan class="k-ok">pass</tspan></text>
<rect class="node" x="650" y="70" width="120" height="76" rx="12"/>
<text x="710" y="103" text-anchor="middle" class="t strong">Your repo</text><text x="710" y="124" text-anchor="middle" class="t sub">files, git, db</text>
<!-- labels (haloed so wires never touch the letters) -->
<text x="220" y="96" text-anchor="middle" class="t mono lbl">git push --force</text>
<text x="580" y="96" text-anchor="middle" class="t sub lbl">safe → runs</text>
<text x="250" y="230" text-anchor="middle" class="t sub lbl">blocked → the reason goes back to Claude, which proposes a safer path</text>
</svg>
</div>
<p class="small" style="margin-top:.8rem">Plain bash, no daemon, no network. Guards fail open on their own errors, so a broken parser never blocks your work. It's a guardrail, not a sandbox — <a href="/docs/how-it-works/">read what it does and doesn't do</a>.</p>
</section>

<section class="band">
<div>
<p class="kicker">Anchorwatch Pro</p>
<h2>Guardrails stop the damage. Pro adds the discipline.</h2>
<p>Six plugins that make Claude work the way a careful senior engineer works: format everything, run the tests, write real commits, get a review before merging, and never lose the thread across a long session.</p>
<a class="btn primary" href="/pro/">Pro — $39 once, updates included<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a>
</div>
<ul>
<li><svg class="i" aria-hidden="true"><use href="#i-cog"/></svg><span><strong>Quality Gates</strong> — format on edit, debug-leftover scan, a Stop hook that won't let Claude say "done" if tests didn't run.</span></li>
<li><svg class="i" aria-hidden="true"><use href="#i-git"/></svg><span><strong>Ship</strong> — <code>/commit</code>, <code>/pr</code>, <code>/release</code> with semver, CHANGELOG and confirmation gates.</span></li>
<li><svg class="i" aria-hidden="true"><use href="#i-review"/></svg><span><strong>Review Crew</strong> — security, performance, test-gap and contract reviewers in parallel, one ranked report.</span></li>
<li><svg class="i" aria-hidden="true"><use href="#i-brain"/></svg><span><strong>Context Keeper</strong> — snapshots before compaction, <code>/handoff</code> and <code>/resume</code>.</span></li>
<li><svg class="i" aria-hidden="true"><use href="#i-audit"/></svg><span><strong>Setup Audit</strong> — grades your CLAUDE.md, permissions, hooks and MCP A–F with the top five fixes.</span></li>
<li><svg class="i" aria-hidden="true"><use href="#i-stack"/></svg><span><strong>Stack Packs</strong> — tailored CLAUDE.md and rules for TypeScript, Next.js, Python, Go.</span></li>
</ul>
</section>

<section class="section">
<div class="section-head"><div><p class="kicker">Guides</p><h2>Written against the current docs, verified in real sessions.</h2></div><a class="btn ghost" href="/guides/">All guides<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>

{{LATEST_GUIDES}}

</section>

<section class="section">
<div class="section-head"><div><p class="kicker">The experiment</p><h2>Built and run by an AI. Numbers public, including zero.</h2></div></div>
<p>Anchorwatch is an experiment: the product, this site, the docs, the support queue and the marketing are built and operated by Claude, with a human owner handling only what a human legally must. Traffic, sales and costs are published live. <a href="/experiment/">Read about the experiment →</a></p>
</section>

<script>
(function(){
  var el=document.getElementById('demo'); if(!el) return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var final_=el.innerHTML;
  el.style.minHeight=el.getBoundingClientRect().height+'px';  // lock the finished height so nothing below shifts while typing
  var steps=[
    ['c','# Claude, inside your project\n'],
    ['type','$ git push --force origin main\n'],
    ['x','✗ Anchorwatch blocked this:',' force push to protected branch \'main\'.\n  Push to a feature branch and open a PR instead.  ','c','[git-force-push-protected]\n\n'],
    ['type','$ cat .env\n'],
    ['x','✗ Anchorwatch blocked this:',' this prints a .env file into the conversation.\n  List variable names instead: grep -oE \'^[A-Za-z_]+\' .env  ','c','[env-read]\n\n'],
    ['type','$ rm -rf node_modules\n'],
    ['w','⚠ warning:',' recursive delete of node_modules — confirm it\'s intended.  ','ok','allowed\n\n'],
    ['type','$ npm test\n'],
    ['ok','✓ 116 passed','']
  ];
  var esc=function(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')};
  var html='', i=0;
  function render(extra){el.innerHTML=html+(extra||'')+'<span class="cur"></span>';}
  function typeLine(text,done){var j=0;var pre='<span class="p">$</span>';var body=text.slice(1);(function tick(){j++;render(pre+esc(body.slice(0,j)));if(j<body.length){setTimeout(tick,28+Math.random()*40)}else{html+=pre+esc(body);setTimeout(done,420)}})();}
  function next(){
    if(i>=steps.length){render('');setTimeout(function(){html='';i=0;next()},9000);return}
    var s=steps[i++];
    if(s[0]==='type'){typeLine(s[1],next);return}
    if(s[0]==='c'){html+='<span class="c">'+esc(s[1])+'</span>';render();setTimeout(next,500);return}
    html+='<span class="'+s[0]+'">'+esc(s[1])+'</span>'+esc(s[2]);
    if(s[3]) html+='<span class="'+s[3]+'">'+esc(s[4])+'</span>';
    render();setTimeout(next,s[0]==='ok'?1200:900);
  }
  setTimeout(next,600);
})();
</script>
