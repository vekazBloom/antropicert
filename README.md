# CCAO-F Exam Trainer

A local study app for the **Claude Certified Associate – Foundations** exam, built from the
8 practice-question PDFs in this folder.

- **757 questions** across 8 modules, every one with the correct answer and the explanation
  from the source answer key.
- **Practice mode** — pick a module, get told right or wrong immediately, with the explanation.
- **Exam mode** — 53 questions drawn across all 8 modules, no feedback until you submit,
  graded against the 72% pass mark (39 of 53).
- **Profiles** — every attempt is saved per person, with history and per-module progress.

## Running it

Needs Node 20+ (`nvm use 20`) and a Postgres database (Supabase).

1. Create a Supabase project.
2. Copy the connection string: **Project Settings → Database → Connection string →
   Transaction pooler** (port 6543).
3. Set it up locally:

```bash
cd exam-trainer && npm install && cp .env.example .env.local
```

Paste the connection string into `.env.local`, then create the tables and start:

```bash
npm run db:init && npm run dev
```

Then open http://localhost:3000.

## Deploying to Vercel

Two settings matter:

- **Root Directory** must be `exam-trainer` — the app is not at the repo root, and
  leaving this unset is what produces a `404: NOT_FOUND` on every page.
- **Environment variable** `DATABASE_URL` — the same Supabase transaction-pooler
  string. Add it for Production, Preview and Development.

Run `npm run db:init` once locally against the same database (or paste
`db/schema.sql` into the Supabase SQL editor) so the tables exist.

## Re-extracting the questions

The question bank lives in `exam-trainer/data/questions.json`, generated from the PDFs.
It is committed, so you only need this if the PDFs change. Requires `pdftotext` (poppler).

```bash
cd exam-trainer && node scripts/extract-questions.mjs
```

The script refuses to write the file unless all 757 questions parse with four options,
a correct letter, and an explanation.

## How it fits together

| Path | Role |
|---|---|
| `exam-trainer/scripts/extract-questions.mjs` | PDF → `data/questions.json` |
| `exam-trainer/data/questions.json` | The question bank (generated) |
| `exam-trainer/data/modules.ts` | Module titles and the exam rules (53 questions, 72%) |
| `exam-trainer/lib/questions.ts` | Loads the bank, shuffles answer order per attempt |
| `exam-trainer/lib/examBuilder.ts` | Picks the 53, stratified across modules |
| `exam-trainer/lib/attempts.ts` | Creates attempts, records answers, grades — all server-side |
| `exam-trainer/lib/db.ts` | Postgres client and row types |
| `exam-trainer/db/schema.sql` | Tables for profiles, attempts and answers |
| `exam-trainer/app/` | Pages and API routes |

Grading runs on the server on purpose: during an exam the correct answers and explanations
are never sent to the browser, so they cannot be read out of the page source.

Only profiles, attempts and answers live in Postgres. The 757 questions stay in
`data/questions.json`, so the answer key is never reachable through the database.

Note there are no passwords — anyone with the URL can create a profile and see the
other profiles listed. That is fine for personal study on a link you don't share.

Answer order is shuffled per attempt. In modules 1, 2 and 8 the source answer keys are
heavily weighted towards option B (72–87% of answers), so without shuffling you would learn
the position rather than the material. Modules 3–7 are already evenly balanced across A/B/C/D.

The material is self-study practice derived from course screenshots — it is not official
Anthropic exam content.
