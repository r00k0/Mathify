# Mathify

Real-life maths for K–12, coached by Kip the kangaroo. Kids learn to think: what is being asked, what's a good guess, what's impossible, which move fits.

## What's in it
- **Kangaroo prep**: daily adaptive sets, 14 thinking moves with stories and memory hooks, 3 Socratic hints per problem, timed tests.
- **Learn K–12**: placement check, a K–12 skill ladder where every problem comes from real life, mastery (3 in a row alone) and daily mixed review. Problems are generated, so numbers change every time.
- **Coach view** for parents: weakest moves, struggling alerts, pace controls.

## Stack
- `app/mathify.html`: the whole front end (no framework). `npm run build` wraps it into `public/index.html`.
- `src/worker.js`: Cloudflare Worker. Serves `public/` and a small JSON API under `/api/` for saving progress.
- Cloudflare D1 database `mathify-db` (binding `DB`), schema in `migrations/`.

## Run locally
```
npm install
npx wrangler d1 migrations apply mathify-db --local
npm run dev        # http://localhost:8787
```

## Deploy
Connected to Cloudflare Workers Builds: every push to `main` runs `npm run build` and `npx wrangler deploy`.

## Content rules
All problems are original. Competition papers (Math Kangaroo, AoPS, etc.) are referenced by year and number only, never copied.
