export type Page = { title: string; description: string; path: string; body: string; date?: string; updated?: string; kind?: "article" | "page"; nav?: string };

const SITE = "https://anchorwatch.sh";
const NAME = "Anchorwatch";
const V = Date.now().toString(36); // cache-busts style.css on every build

// Hand-drawn 24px line icons, referenced with <svg class="i"><use href="#i-name"/></svg>
const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
<symbol id="i-anchor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M7 11h10M4.5 14.5a7.5 7.5 0 0 0 15 0"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.6-3 8.2-7 9.5-4-1.3-7-4.9-7-9.5V6l7-3z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/></symbol>
<symbol id="i-branch" viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 3-4 3.5-8 4.5"/></symbol>
<symbol id="i-db" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="14" r="4"/><path d="M11 11l8-8M15.5 6.5l2.5 2.5M13 9l2.5 2.5"/></symbol>
<symbol id="i-rocket" viewBox="0 0 24 24"><path d="M14 4c3-1 6 0 6 0s1 3 0 6l-6 6-4-4 4-8zM8 12l-3 1 2 2M12 16l-1 3 2 2"/><circle cx="15" cy="9" r="1.3"/></symbol>
<symbol id="i-cog" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/></symbol>
<symbol id="i-term" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3l9.5 16.5h-19L12 3z"/><path d="M12 10v4M12 17v.5"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 4l16 16"/></symbol>
<symbol id="i-layers" viewBox="0 0 24 24"><path d="M12 4l8 4-8 4-8-4 8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/></symbol>
<symbol id="i-ship" viewBox="0 0 24 24"><path d="M4 15l8 3 8-3M4 15v-3l8-2 8 2v3M12 4v6M8 8h8"/><path d="M3 19c1.5 1 3 1 4.5 0s3 1 4.5 0 3 1 4.5 0 3 1 4.5 0"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4V5zM20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7V5z"/></symbol>
<symbol id="i-git" viewBox="0 0 24 24"><path d="M12 3l9 9-9 9-9-9 9-9z"/><circle cx="12" cy="12" r="1.8"/><path d="M12 6.5v3.7M12 13.8v3.7"/></symbol>
<symbol id="i-review" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20M8 10h4M10 8v4"/></symbol>
<symbol id="i-brain" viewBox="0 0 24 24"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 3 3 3 0 0 0 1 5 3 3 0 0 0 3 3h1V4H9zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 3 3 3 0 0 1-1 5 3 3 0 0 1-3 3h-1V4h1z"/></symbol>
<symbol id="i-audit" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></symbol>
<symbol id="i-stack" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="5" rx="1.5"/><rect x="4" y="11" width="16" height="5" rx="1.5"/><path d="M4 20h16"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-github" viewBox="0 0 24 24"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></symbol>
</svg>`;

export function layout(p: Page): string {
  const url = SITE + p.path;
  const ld = p.kind === "article"
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "TechArticle", headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated ?? p.date, author: { "@type": "Organization", name: NAME }, publisher: { "@type": "Organization", name: NAME }, mainEntityOfPage: url })}</script>`
    : `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: NAME, applicationCategory: "DeveloperApplication", operatingSystem: "macOS, Linux, Windows", description: p.description, url: SITE, offers: [{ "@type": "Offer", price: "0", priceCurrency: "USD", name: "Anchorwatch (free, MIT)" }, { "@type": "Offer", price: "39", priceCurrency: "USD", name: "Anchorwatch Pro" }] })}</script>`;
  const active = (href: string) => (p.path === href || (href !== "/" && p.path.startsWith(href)) ? ' class="on"' : "");
  const isDocs = p.path.startsWith("/docs/");
  const docsNav = isDocs ? `<nav class="subnav" aria-label="Docs"><a href="/docs/install/"${active("/docs/install/")}>Install</a><a href="/docs/configuration/"${active("/docs/configuration/")}>Configuration</a><a href="/docs/rules/"${active("/docs/rules/")}>Rules reference</a><a href="/docs/how-it-works/"${active("/docs/how-it-works/")}>How it works</a></nav>` : "";
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
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a1626">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${NAME} changelog" href="/changelog.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/style.css?v=${V}">
${ld}
</head>
<body>
${SPRITE}
<header class="top">
  <a class="brand" href="/" aria-label="Anchorwatch home"><span class="mark"><svg class="i" aria-hidden="true"><use href="#i-anchor"/></svg></span>${NAME}</a>
  <nav class="menu">
    <a href="/docs/"${active("/docs/")}>Docs</a>
    <a href="/guides/"${active("/guides/")}>Guides</a>
    <a href="/pro/"${active("/pro/")}>Pro</a>
    <a href="/experiment/"${active("/experiment/")}>The experiment</a>
    <a class="gh" href="https://github.com/anchorwatch-dev/anchorwatch" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-github"/></svg>GitHub</a>
  </nav>
</header>
${docsNav}
<main class="${p.kind === "article" ? "article" : "page"}${p.path === "/" ? " home" : ""}">
${p.kind === "article" ? `<p class="meta">${p.date ? `Published ${fmt(p.date)}` : ""}${p.updated && p.updated !== p.date ? ` · Updated ${fmt(p.updated)}` : ""}</p>` : ""}
${p.body}
</main>
<footer class="foot">
  <div class="foot-brand"><svg class="i" aria-hidden="true"><use href="#i-anchor"/></svg><div><strong>${NAME}</strong><br><span class="muted">The one who stays awake so the ship doesn't drift.</span></div></div>
  <nav><a href="/docs/">Docs</a><a href="/guides/">Guides</a><a href="/changelog/">Changelog</a><a href="/experiment/">Experiment</a><a href="/privacy/">Privacy</a><a href="https://github.com/anchorwatch-dev/anchorwatch/issues" rel="noopener">Support</a></nav>
  <p class="muted legal">Free core is MIT licensed. Not affiliated with Anthropic; "Claude" is a trademark of Anthropic, PBC.</p>
</footer>
<script>
(function(){try{var d=JSON.stringify({p:location.pathname,r:document.referrer||""});
if(navigator.sendBeacon){navigator.sendBeacon("/api/hit",new Blob([d],{type:"application/json"}))}else{fetch("/api/hit",{method:"POST",body:d,keepalive:true})}}catch(e){}})();
</script>
</body>
</html>`;
}

export function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
function fmt(d: string) { return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }); }
