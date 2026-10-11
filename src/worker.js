// API for saving learning progress. Static files in /public are served automatically.
// Storage model (MVP): one JSON document per (device, collection, id) in D1.
const COLS = new Set(["attempts", "tests", "app"]);
const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (url.pathname === "/api/health") return json({ ok: true });

    const device = url.searchParams.get("d") || "";
    if (!ID.test(device)) return json({ error: "missing device" }, 400);
    const parts = url.pathname.split("/").filter(Boolean); // ["api","c"|"d",col,id?]
    const [, kind, col, id] = parts;
    if (!COLS.has(col)) return json({ error: "unknown collection" }, 400);

    if (kind === "c" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, data FROM docs WHERE device = ? AND col = ? ORDER BY updated LIMIT 5000"
      ).bind(device, col).all();
      return json(results.map(r => ({ id: r.id, data: JSON.parse(r.data) })));
    }
    if (kind === "d" && id && ID.test(id)) {
      if (request.method === "GET") {
        const row = await env.DB.prepare("SELECT data FROM docs WHERE device = ? AND col = ? AND id = ?").bind(device, col, id).first();
        return row ? json(JSON.parse(row.data)) : json({ error: "not found" }, 404);
      }
      if (request.method === "PUT") {
        const body = await request.text();
        if (body.length > 256 * 1024) return json({ error: "too large" }, 413);
        try { if (typeof JSON.parse(body) !== "object") throw 0; } catch { return json({ error: "bad json" }, 400); }
        await env.DB.prepare(
          "INSERT INTO docs (device, col, id, data, updated) VALUES (?, ?, ?, ?, ?) " +
          "ON CONFLICT(device, col, id) DO UPDATE SET data = excluded.data, updated = excluded.updated"
        ).bind(device, col, id, body, new Date().toISOString()).run();
        return json({ ok: true });
      }
    }
    return json({ error: "not found" }, 404);
  },
};
