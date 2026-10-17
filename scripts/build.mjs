// Wraps the app fragment (app/mathify.html) into a full HTML document for the website,
// and inlines Kip's step-by-step explanations (app/explain.js + data/explain/*.json).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
const root = new URL("../", import.meta.url);
const body = readFileSync(new URL("app/mathify.html", root), "utf8");

// Kip's own puzzles live in app/explain.js as `const EXPLAIN = {...}`.
const ownSrc = readFileSync(new URL("app/explain.js", root), "utf8");
const explain = new Function(`${ownSrc}\nreturn EXPLAIN;`)();
// Book years and the sample test live in data/explain/*.json.
const dir = new URL("data/explain/", root);
for (const f of readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  Object.assign(explain, JSON.parse(readFileSync(new URL(f, dir), "utf8")));
}
for (const [id, x] of Object.entries(explain)) {
  for (const k of ["ask", "steps", "answer", "check", "spot", "oops"]) {
    if (!x[k] || (k === "steps" && !x[k].length)) throw new Error(`explain ${id} is missing ${k}`);
  }
}
const data = JSON.stringify(explain).replace(/</g, "\\u003c");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#E2570B">
<style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
<script>window.__EXPLAIN__=${data};</script>
</head>
<body>
${body}
</body>
</html>
`;
mkdirSync(new URL("public/", root), { recursive: true });
writeFileSync(new URL("public/index.html", root), html);
console.log(`Built public/index.html (${Object.keys(explain).length} explanations)`);
