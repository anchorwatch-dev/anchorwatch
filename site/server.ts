// Anchorwatch site server: static files + privacy-preserving pageview stats (SQLite), no cookies, no third parties.
import { Database } from "bun:sqlite";
import { join, extname } from "node:path";
import { existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const DIST = join(import.meta.dir, "dist");
const DATA = process.env.DATA_DIR ?? join(import.meta.dir, "data");
const PORT = Number(process.env.PORT ?? 8080);
const SITE_HOST = process.env.SITE_HOST ?? "anchorwatch.fly.dev";

const db = new Database(join(DATA, "stats.db"), { create: true });
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS hits (day TEXT NOT NULL, path TEXT NOT NULL, ref TEXT NOT NULL DEFAULT '', uid TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS hits_day ON hits(day);
CREATE TABLE IF NOT EXISTS events (day TEXT NOT NULL, name TEXT NOT NULL, meta TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL);`);
const ins = db.prepare("INSERT INTO hits (day, path, ref, uid, ts) VALUES (?, ?, ?, ?, ?)");
const insEv = db.prepare("INSERT INTO events (day, name, meta, ts) VALUES (?, ?, ?, ?)");

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".json": "application/json; charset=utf-8", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const dayOf = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const salt = () => createHash("sha256").update(`${process.env.STATS_SALT ?? "anchorwatch"}:${dayOf()}`).digest("hex");
const uidOf = (req: Request) => createHash("sha256").update(`${salt()}|${req.headers.get("fly-client-ip") ?? req.headers.get("x-forwarded-for") ?? ""}|${req.headers.get("user-agent") ?? ""}`).digest("hex").slice(0, 16);
const refHost = (r: string) => { try { const h = new URL(r).hostname; return h === SITE_HOST ? "" : h; } catch { return ""; } };
const isBot = (ua: string) => /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|python-requests|curl|wget|Go-http-client|monitor/i.test(ua);

function stats() {
  const since = dayOf(Date.now() - 29 * 864e5);
  const q = (sql: string, ...a: any[]) => db.query(sql).all(...a) as any[];
  return {
    generated: new Date().toISOString(),
    last30: { pageviews: q("SELECT COUNT(*) n FROM hits WHERE day>=?", since)[0].n, uniques: q("SELECT COUNT(DISTINCT day||uid) n FROM hits WHERE day>=?", since)[0].n },
    today: { pageviews: q("SELECT COUNT(*) n FROM hits WHERE day=?", dayOf())[0].n, uniques: q("SELECT COUNT(DISTINCT uid) n FROM hits WHERE day=?", dayOf())[0].n },
    daily: q("SELECT day, COUNT(*) pageviews, COUNT(DISTINCT uid) uniques FROM hits WHERE day>=? GROUP BY day ORDER BY day", since),
    pages: q("SELECT path, COUNT(*) n FROM hits WHERE day>=? GROUP BY path ORDER BY n DESC LIMIT 15", since),
    referrers: q("SELECT ref, COUNT(*) n FROM hits WHERE day>=? AND ref<>'' GROUP BY ref ORDER BY n DESC LIMIT 15", since),
    events: q("SELECT day, name, COUNT(*) n FROM events WHERE day>=? GROUP BY day, name ORDER BY day", since),
  };
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (req.method === "POST" && path === "/api/hit") {
      try {
        const b = await req.json() as { p?: string; r?: string };
        const ua = req.headers.get("user-agent") ?? "";
        if (!isBot(ua) && typeof b.p === "string" && b.p.startsWith("/") && b.p.length < 200) ins.run(dayOf(), b.p.replace(/\/+$/, "") || "/", refHost(b.r ?? "").slice(0, 100), uidOf(req), Date.now());
      } catch {}
      return new Response(null, { status: 204 });
    }
    if (req.method === "POST" && path === "/api/event") {
      try { const b = await req.json() as { n?: string; m?: string }; if (typeof b.n === "string" && /^[a-z_-]{1,40}$/.test(b.n)) insEv.run(dayOf(), b.n, String(b.m ?? "").slice(0, 200), Date.now()); } catch {}
      return new Response(null, { status: 204 });
    }
    if (path === "/api/stats") return Response.json(stats(), { headers: { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } });
    if (path === "/healthz") return new Response("ok");
    if (path === "/go/pro") { // outbound click tracking to checkout
      insEv.run(dayOf(), "checkout_click", url.searchParams.get("from") ?? "", Date.now());
      return Response.redirect(process.env.CHECKOUT_URL ?? "/pro/#soon", 302);
    }
    // static
    if (path.endsWith("/")) path += "index.html";
    let file = join(DIST, path);
    if (!file.startsWith(DIST)) return new Response("nope", { status: 400 });
    if (!existsSync(file) && existsSync(join(DIST, path, "index.html"))) return Response.redirect(url.pathname + "/", 301);
    if (!existsSync(file) || statSync(file).isDirectory()) return new Response(Bun.file(join(DIST, "404.html")), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
    const ext = extname(file);
    return new Response(Bun.file(file), { headers: { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": ext === ".html" ? "public, max-age=300" : "public, max-age=86400", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" } });
  },
});
console.log(`anchorwatch site on :${PORT} (data: ${DATA})`);
