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
    const page: Page = { title: front.title ?? slug, description: front.description ?? "", path, body: html, date: front.date, updated: front.updated, kind: slug === "index" ? "page" : kind };
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

function list(items: (Front & { path: string })[], withDates = true) {
  return `<ul class="cards">${items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map(i => `<li><a href="${i.path}"><strong>${esc(i.title ?? i.path)}</strong><span>${esc(i.description ?? "")}</span>${withDates && i.date ? `<time>${i.date}</time>` : ""}</a></li>`).join("")}</ul>`;
}
// Inject lists into index pages that contain the placeholder
for (const [path, items, dates] of [["/guides/", guides, true], ["/docs/", docs, false]] as const) {
  const f = join(DIST, path, "index.html");
  if (existsSync(f)) writeFileSync(f, readFileSync(f, "utf8").replace("<p>{{LIST}}</p>", list([...items], dates)));
}
// Home also shows latest 3 guides
const home = join(DIST, "index.html");
if (existsSync(home)) writeFileSync(home, readFileSync(home, "utf8").replace("<p>{{LATEST_GUIDES}}</p>", list([...guides].slice(0, 3))));

// Changelog RSS
const cl = join(ROOT, "content", "pages", "changelog.md");
if (existsSync(cl)) {
  const { body } = parse(readFileSync(cl, "utf8"));
  const items = [...body.matchAll(/^## (.+?) — (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## |\s*$(?![\s\S]))/gm)].map(m => ({ title: m[1], date: m[2], html: marked.parse(m[3]) as string }));
  writeFileSync(join(DIST, "changelog.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Anchorwatch changelog</title><link>${SITE}/changelog/</link><description>Releases of the Anchorwatch plugins for Claude Code</description>${items.map(i => `<item><title>${esc(i.title)}</title><link>${SITE}/changelog/</link><guid>${SITE}/changelog/#${i.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description><![CDATA[${i.html}]]></description></item>`).join("")}</channel></rss>`);
}

writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(DIST, "llms.txt"), `# Anchorwatch\n\n> Guardrails and workflow discipline for Claude Code: a free MIT plugin that blocks destructive commands and protects secrets, plus a Pro suite (quality gates, release workflow, parallel review crew, context keeper, setup audit, stack packs).\n\n## Docs\n${docs.map(d => `- [${d.title}](${SITE}${d.path}): ${d.description}`).join("\n")}\n\n## Guides\n${guides.map(d => `- [${d.title}](${SITE}${d.path}): ${d.description}`).join("\n")}\n\n## Other\n- [Pro](${SITE}/pro/): pricing and what is included\n- [The experiment](${SITE}/experiment/): this business is built and operated by an AI agent; public metrics\n`);
console.log(`built ${urls.length} pages -> ${DIST}`);
