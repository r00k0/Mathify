# Mathify

Real-life maths for K–12, coached by Kip the kangaroo. Kids learn to think: what is being asked, what's a good guess, what's impossible, which move fits.

## What's in it
- **Kangaroo prep**: daily adaptive sets, 17 thinking moves with stories and memory hooks, 3 Socratic hints per problem, timed tests.
- **Kip's way, step by step**: after the 3rd hint, the next tap shows a full kid-friendly explanation (what it's asking, numbered steps, answer, check, the move and how to spot it, a common mistake). Every problem has one: Kip's 36 puzzles, all 269 book problems (2012–2021) and the 30 sample-test questions.
- **Kip's moves library**: each move's story, how to spot it, clues from real problems, a worked example, every problem that uses it (try-again first), and practice ordered weakest move first.
- **Learn K–12**: placement check, a K–12 skill ladder where every problem comes from real life, mastery (3 in a row alone) and daily mixed review. Problems are generated, so numbers change every time.
- **Coach view** for parents: weakest moves, struggling alerts, pace controls.

## Stack
- `app/mathify.html`: the whole front end (no framework). `npm run build` wraps it into `public/index.html`.
- Explanations: `app/explain.js` (Kip's puzzles) and `data/explain/<year>.json` + `data/explain/sample.json`, inlined by the build. Fields: `ask, steps, answer, check, spot, oops`.
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
All problems are original. Competition papers (Math Kangaroo, AoPS, etc.) are referenced by year and number only, never copied. Explanations for those problems start with a short own-words summary of what is being asked, not the original wording.

The family's licensed copy of the book and sample questions (text + picture) is stored only in encrypted form in `public/k/*.bin` (AES-GCM, key derived from the family passcode with PBKDF2). The Worker also refuses to serve them unless the request carries a passcode-derived token, with at most 20 wrong tries per IP per hour. The passcode is not in this repo; without it the files can't be read. To regenerate them you need the original PDFs and the passcode.
