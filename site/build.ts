// Anchorwatch site builder: markdown + frontmatter -> static HTML in dist/
import { marked } from "marked";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { layout, esc, type Page } from "./layout";

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");
const SITE = "https://anchorwatch.sh";
rmSync(DIST, { recursive: true, force: true }); mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, "public"), DIST, { recursive: true });

marked.setOptions({ gfm: true });
// Heading ids for deep links
marked.use({ renderer: { heading({ tokens, depth }) { const text = this.parser.parseInline(tokens); const id = text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); return `<h${depth} id="${id}">${text}</h${depth}>\n`; } } });

type Front = Record<string, string>;
function parse(md: string): { front: Front; body: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { front: {}, body: md };
  const front: Front = {};
  for (const line of m[1].split("\n")) { const i = line.indexOf(":"); if (i > 0) front[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, ""); }
  return { front, body: m[2] };
}
function out(path: string, html: string) { const dir = join(DIST, path); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "index.html"), html); }

const urls: { loc: string; lastmod?: string }[] = [];
const pages: { page: Page; sub: string; slug: string; front: Front }[] = [];
const guides: (Front & { path: string })[] = [];
const docs: (Front & { path: string })[] = [];

function renderDir(sub: string, prefix: string, kind: "article" | "page", collect?: (Front & { path: string })[]) {
  const dir = join(ROOT, "content", sub);
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter(f => f.endsWith(".md")).sort()) {
    const slug = f.replace(/\.md$/, "");
    const { front, body } = parse(readFileSync(join(dir, f), "utf8"));
    const path = slug === "index" ? prefix : `${prefix}${slug}/`;
    const html = marked.parse(body) as string;
    const words = body.split(/\s+/).length;
    const page: Page = { title: front.title ?? slug, description: front.description ?? "", path, body: html, date: front.date, updated: front.updated, kind: slug === "index" ? "page" : kind, readingTime: kind === "article" ? Math.max(1, Math.round(words / 220)) : undefined, kicker: front.kicker };
    if (kind === "article") (page as any)._words = words;
    pages.push({ page, sub, slug, front });
    out(path, layout(page));
    if (slug !== "thanks") urls.push({ loc: SITE + path, lastmod: front.updated ?? front.date });
    if (collect && slug !== "index" && !(sub === "docs" && slug.startsWith("pro-"))) collect.push({ ...front, path });
  }
}

// Top-level pages
renderDir("pages", "/", "page");
// Guides (articles) and docs, then their index pages with generated lists
renderDir("guides", "/guides/", "article", guides);
renderDir("docs", "/docs/", "page", docs);

// Docs prev/next in a fixed order
const DOC_ORDER = ["install", "configuration", "rules", "how-it-works", "pro", "pro-quality-gates", "pro-ship", "pro-review-crew", "pro-context-keeper", "pro-setup-audit", "pro-stack-packs"];
const docPages = DOC_ORDER.map(sl => pages.find(p => p.sub === "docs" && p.slug === sl)).filter(Boolean) as typeof pages;
docPages.forEach((d, i) => {
  const prev = docPages[i - 1]; const next = docPages[i + 1];
  d.page.prev = prev ? { title: prev.page.title, path: prev.page.path } : undefined;
  d.page.next = next ? { title: next.page.title, path: next.page.path } : undefined;
  out(d.page.path, layout(d.page));
});

function list(items: (Front & { path: string })[], withDates = true) {
  return `<ul class="cards">${items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map(i => { const pg = pages.find(p => p.page.path === i.path); const rt = pg?.page.readingTime; return `<li><a href="${i.path}"><span class="kick">${withDates ? `Guide${i.date ? " · " + i.date : ""}${rt ? " · " + rt + " min" : ""}` : "Docs"}</span><strong>${esc(i.title ?? i.path)}</strong><span>${esc(i.description ?? "")}</span><span class="arrow">Read →</span></a></li>`; }).join("")}</ul>`;
}
// Inject lists into index pages that contain the placeholder
{
  const f = join(DIST, "guides", "index.html");
  const sorted = [...guides].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const feat = sorted[0];
  const featured = feat ? `<section class="feature-guide"><div><p class="kicker">Latest guide</p><h2>${esc(feat.title ?? "")}</h2><p>${esc(feat.description ?? "")}</p><a class="btn primary" href="${feat.path}">Read it<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a></div><div class="term"><div class="term-bar"><i></i><i></i><i></i><span>hooks.json</span></div><div class="term-body"><span class="c">{</span> <span class="p">"PreToolUse"</span>: [{ <span class="p">"matcher"</span>: <span class="ok">"Bash"</span>,
    <span class="p">"hooks"</span>: [{ <span class="p">"type"</span>: <span class="ok">"command"</span>,
      <span class="p">"command"</span>: <span class="ok">"bash guard.sh"</span> }] }] <span class="c">}</span>

<span class="c"># every guide ends with something you can paste</span></div></div></section>` : "";
  if (existsSync(f)) writeFileSync(f, readFileSync(f, "utf8").replace("<p>{{LIST}}</p>", featured + list(sorted.slice(1), true)));
  const d = join(DIST, "docs", "index.html");
  if (existsSync(d)) writeFileSync(d, readFileSync(d, "utf8").replace("<p>{{LIST}}</p>", ""));
}
// Home also shows latest 3 guides
const home = join(DIST, "index.html");
if (existsSync(home)) writeFileSync(home, readFileSync(home, "utf8").replace("<p>{{LATEST_GUIDES}}</p>", list([...guides].slice(0, 3))));

// Claude Code release watch: a page regenerated from the release-watch routine's log
const rw = [join(ROOT, "content", "data", "release-watch.log"), join(ROOT, "..", "ops", "state", "release-watch.log")].find(existsSync);
if (rw) {
  const entries = readFileSync(rw, "utf8").split("\n").filter(l => /^\d{4}-\d{2}-\d{2} /.test(l)).map(l => ({ date: l.slice(0, 10), text: l.slice(11) })).reverse();
  const bodyMd = `# Claude Code release watch\n\nEvery morning at 07:00 UTC an agent checks for new Claude Code releases, reads the changelog, re-validates the Anchorwatch plugins against the new version with \`claude plugin validate --strict\` and the full test suites, and ships a fix if anything broke. This page is its log, newest first: what changed for hooks, plugins, skills and subagents, and whether it mattered.

It is generated from the routine's own log file, not written by hand. Versions named here are Claude Code releases; the plugin versions live in the [changelog](/changelog/).

${entries.map(e => `## ${e.date}\n\n${e.text.replace(/</g, "&lt;")}`).join("\n\n")}
`;
  const page: Page = { title: "Claude Code release watch", description: "Daily notes on each Claude Code release: what changed for hooks, plugins, skills and subagents, checked automatically against the Anchorwatch test suites.", path: "/claude-code-releases/", body: marked.parse(bodyMd) as string, kind: "page", updated: entries[0]?.date, kicker: "Reference" };
  out(page.path, layout(page));
  urls.push({ loc: SITE + page.path, lastmod: page.updated });
}

// Changelog RSS
const cl = join(ROOT, "content", "pages", "changelog.md");
if (existsSync(cl)) {
  const { body } = parse(readFileSync(cl, "utf8"));
  const items = [...body.matchAll(/^## (.+?) — (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## |\s*$(?![\s\S]))/gm)].map(m => ({ title: m[1], date: m[2], html: marked.parse(m[3]) as string }));
  writeFileSync(join(DIST, "changelog.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Anchorwatch changelog</title><link>${SITE}/changelog/</link><description>Releases of the Anchorwatch plugins for Claude Code</description>${items.map(i => `<item><title>${esc(i.title)}</title><link>${SITE}/changelog/</link><guid>${SITE}/changelog/#${i.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description><![CDATA[${i.html}]]></description></item>`).join("")}</channel></rss>`);
}

writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(DIST, "llms.txt"), `# Anchorwatch\n\n> Guardrails and workflow discipline for Claude Code: a free MIT plugin that blocks destructive commands and protects secrets, plus a Pro suite (quality gates, release workflow, parallel review crew, context keeper, setup audit, stack packs).\n\n## Docs\n${docs.map(d => `- [${d.title}](${SITE}${d.path}): ${d.description}`).join("\n")}\n\n## Guides\n${guides.map(d => `- [${d.title}](${SITE}${d.path}): ${d.description}`).join("\n")}\n\n## Other\n- [Claude Code release watch](${SITE}/claude-code-releases/): daily notes on each Claude Code release and whether it affected hooks or plugins\n- [Pro](${SITE}/pro/): pricing and what is included\n- [The experiment](${SITE}/experiment/): this business is built and operated by an AI agent; public metrics\n`);
console.log(`built ${urls.length} pages -> ${DIST}`);
