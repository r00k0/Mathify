// API for saving learning progress. Static files in /public are served automatically.
// Storage model (MVP): one JSON document per (device, collection, id) in D1.
const COLS = new Set(["attempts", "tests", "app"]);
const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// Family-only question files (/k/*.bin). They are encrypted with the family passcode, and on top of that
// the server only hands them out when the request proves it knows the passcode. Wrong guesses are
// limited to 20 per IP per hour so a short passcode can't be found by trying every number.
const GATE = "f98416de631a217acc9646ffae6ae9977e0c3d9700badb25e5bf92d0c340a47a"; // SHA-256 of "mathify-gate:" + passcode
async function gate(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const hour = new Date().toISOString().slice(0, 13);
  const fails = async () => {
    try { return (await env.DB.prepare("SELECT n FROM gate_fail WHERE ip = ? AND hour = ?").bind(ip, hour).first())?.n || 0; }
    catch { await env.DB.prepare("CREATE TABLE IF NOT EXISTS gate_fail (ip TEXT, hour TEXT, n INTEGER, PRIMARY KEY (ip, hour))").run(); return 0; }
  };
  if ((await fails()) >= 20) return new Response("Too many tries. Please wait an hour.", { status: 429 });
  if ((request.headers.get("x-family") || "") !== GATE) {
    await env.DB.prepare("INSERT INTO gate_fail (ip, hour, n) VALUES (?, ?, 1) ON CONFLICT(ip, hour) DO UPDATE SET n = n + 1").bind(ip, hour).run();
    return new Response("Locked", { status: 403, headers: { "cache-control": "no-store" } });
  }
  const res = await env.ASSETS.fetch(request);
  const out = new Response(res.body, res); out.headers.set("cache-control", "private, max-age=86400"); return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/k/")) return gate(request, env);
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
