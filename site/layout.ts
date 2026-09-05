export type Page = { title: string; description: string; path: string; body: string; date?: string; updated?: string; kind?: "article" | "page"; nav?: string };

const SITE = "https://anchorwatch.fly.dev";
const NAME = "Anchorwatch";

export function layout(p: Page): string {
  const url = SITE + p.path;
  const ld = p.kind === "article"
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "TechArticle", headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated ?? p.date, author: { "@type": "Organization", name: NAME }, publisher: { "@type": "Organization", name: NAME }, mainEntityOfPage: url })}</script>`
    : `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: NAME, applicationCategory: "DeveloperApplication", operatingSystem: "macOS, Linux, Windows", description: p.description, url: SITE, offers: [{ "@type": "Offer", price: "0", priceCurrency: "USD", name: "Anchorwatch (free, MIT)" }, { "@type": "Offer", price: "39", priceCurrency: "USD", name: "Anchorwatch Pro" }] })}</script>`;
  const active = (href: string) => (p.path === href || (href !== "/" && p.path.startsWith(href)) ? ' class="on"' : "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}${p.path === "/" ? "" : " · " + NAME}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="${p.kind === "article" ? "article" : "website"}">
<meta property="og:site_name" content="${NAME}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${NAME} changelog" href="/changelog.xml">
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<header class="top">
  <a class="brand" href="/"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2.5 2.5 0 0 1 1 4.8V9h4a1 1 0 1 1 0 2h-4v8.9a7 7 0 0 0 5.9-5.2 1 1 0 1 1 1.9.6A9 9 0 0 1 12 22a9 9 0 0 1-8.8-6.7 1 1 0 1 1 1.9-.6A7 7 0 0 0 11 19.9V11H7a1 1 0 1 1 0-2h4V6.8A2.5 2.5 0 0 1 12 2z" fill="currentColor"/></svg>${NAME}</a>
  <nav>
    <a href="/docs/"${active("/docs/")}>Docs</a>
    <a href="/guides/"${active("/guides/")}>Guides</a>
    <a href="/pro/"${active("/pro/")}>Pro</a>
    <a href="/experiment/"${active("/experiment/")}>The experiment</a>
    <a href="https://github.com/anchorwatch-dev/anchorwatch" rel="noopener">GitHub</a>
  </nav>
</header>
<main class="${p.kind === "article" ? "article" : "page"}">
${p.kind === "article" ? `<p class="meta">${p.date ? `Published ${fmt(p.date)}` : ""}${p.updated && p.updated !== p.date ? ` · Updated ${fmt(p.updated)}` : ""}</p>` : ""}
${p.body}
</main>
<footer class="foot">
  <div>
    <strong>${NAME}</strong> — guardrails and workflow discipline for Claude Code. Free core is MIT licensed.
    <span class="muted">Not affiliated with Anthropic. "Claude" is a trademark of Anthropic, PBC.</span>
  </div>
  <nav><a href="/docs/">Docs</a><a href="/changelog/">Changelog</a><a href="/experiment/">Experiment</a><a href="/privacy/">Privacy</a><a href="https://github.com/anchorwatch-dev/anchorwatch/issues" rel="noopener">Support</a></nav>
</footer>
<script>
(function(){try{var d=JSON.stringify({p:location.pathname,r:document.referrer||"",w:innerWidth});
if(navigator.sendBeacon){navigator.sendBeacon("/api/hit",new Blob([d],{type:"application/json"}))}else{fetch("/api/hit",{method:"POST",body:d,keepalive:true})}}catch(e){}})();
</script>
</body>
</html>`;
}

export function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
function fmt(d: string) { return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }); }
