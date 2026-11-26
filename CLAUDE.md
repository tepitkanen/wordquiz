# Sanavisa (wordquiz)

@AGENTS.md

Finnish–English multiple-choice word quiz. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest + Testing Library. Deployed on Vercel from `main`.

## Commands
- `npm run dev` – dev server (also rewrites AGENTS.md; commit that file if it changes)
- `npm test` – Vitest (jsdom)
- `npm run lint` – ESLint
- `npm run build` – production build; run it after routing/config changes, because some Next errors only show here

Run test + lint (+ build for routing/config changes) before calling work done.

## How the app fits together
- `/` (`app/page.tsx`) – front page: logo + two direction links. Server component.
- `/quiz/[direction]` (`app/quiz/[direction]/page.tsx`) – `fi-en` / `en-fi`, prerendered via `generateStaticParams`; unknown values → `notFound()`.
- `app/Quiz.tsx` – client component, a screen state machine: `start` (level choice) → `quiz` → `result`. Direction comes in as a prop.
- `lib/quiz.ts` – `DIRECTIONS`, `DIRECTION_LABELS`, `isDirection`, round/question generation.
- `lib/levels.ts` – `DIFFICULTIES`, `TOPICS`, `FIELDS` and their bilingual labels. A `Level` key is a difficulty (`"easy"`) or topic-difficulty (`"food-medium"`); `levelFor`/`parseLevel` convert, `LEVELS[level]` gives label + words. The start screen picks a difficulty and an optional topic (None = general list).
- `lib/strings.ts` – all quiz UI text. UI language follows direction: `en-fi` → English, `fi-en` → Finnish (`uiLangFor`).
- `lib/schemes.ts` + `app/SchemePicker.tsx` – colour schemes (blue/green/purple), saved in localStorage under `sanavisa-scheme`, applied before paint by `SCHEME_INIT_SCRIPT` in `app/layout.tsx`.
- `app/styles.ts` – shared Tailwind class strings for buttons/links; `app/Bi.tsx` – bilingual "fi / en" label.
- `app/Logo.tsx` and `app/icon.svg` (favicon) – same artwork; keep them in sync.
- Accounts: Better Auth with Google only (`lib/auth.ts`, client `lib/auth-client.ts`, endpoints `app/api/auth/[...all]/route.ts`). `app/AccountMenu.tsx` in the layout header reads the session on the client (`useSession`), so pages stay static. Guests play without signing in. A signed-in user's finished round goes to the `saveRound` server action (`app/actions/progress.ts`), which re-reads the session, validates the input with `parseRoundInput` and computes the score itself. `lib/resume.ts` keeps an unfinished round in sessionStorage across the Google redirect. Review mode: `getReviewWords` returns the user's missed words for a direction; the start screen shows "Kertaa virheet / Review missed words (N)", and `buildReviewRound` asks them with wrong options from each word's own list. A review round is saved with level `"review"`; each word's level comes from `levelOfPair` (every word is in exactly one list).
- Database: Neon Postgres via Drizzle (`lib/db/`, HTTP driver: no interactive transactions, use `db.batch()`). Words stay in `data/*.json`; the DB references them by `en`+`fi`. Tables: Better Auth's `user`/`session`/`account`/`verification`, `round` (one row per finished round) and `missed_word` (review list per user and direction; a word leaves it after 2 right answers in a row, see `lib/progress.ts`). Schema changes: edit `lib/db/schema.ts`, `npm run db:generate`, commit `drizzle/`, `npm run db:migrate`.
- Env vars live in `.env.local` (`vercel env pull .env.local`): `DATABASE_URL(_UNPOOLED)`, `GOOGLE_CLIENT_ID/SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Never print their values.

## Conventions
- Accent colours: use `accent-200/300/800/900` classes, never `blue-*` etc. The values come from CSS variables in `app/globals.css` per `data-scheme`. Pair each with a `dark:` variant (800 light / 300 dark).
- New quiz UI text goes in `lib/strings.ts` for both languages, not inline. The front page and the scheme picker stay bilingual (no direction known), via `Bi` or "fi / en" strings.
- Tag text in the other language with `lang` (`lang="fi"` etc.) for screen readers.
- Keep accessibility patterns: real buttons/links, focus moves to the screen heading on screen change, `aria-live` feedback.
- Word data: `{ "en", "fi" }` pairs; verbs start with `to `. General lists in `data/{easy,medium,hard}.json`; topics in `data/topics/<topic>.json` as `{ easy, medium, hard }`. Specialist words carry `field` (wrong options come from the same field, see `makeQuestion`). Brackets for disambiguation go in `en` only. `data/data.test.ts` enforces counts (1000 per general level, 300 per topic tier, 500 per Specialist tier = 100 per field), ≥40 verbs and non-verbs per list, no duplicates and no cross-list repeats.

## Next.js 16 gotchas (cacheComponents + partialPrefetching are on)
- Read the docs in `node_modules/next/dist/docs/` before using a Next API; much differs from older versions.
- `params` is a Promise. Read it inside a `<Suspense>`-wrapped child, or dev shows the "URL data … outside of <Suspense>" error.
- `export const dynamicParams` is not allowed; reject bad params with `notFound()`.
- Unknown `/quiz/xx` renders the 404 page but with HTTP 200 (streamed shell). Known, accepted.
- `next build` may print an "upgrade nudge" aimed at agents (`next upgrade --agent=…`). Don't run it; tell the user.

## Testing
- Component tests render `<Quiz direction="en-fi" />` (English UI) or `"fi-en"` (Finnish UI); `buildRound` is mocked for fixed questions.
- `next/link` works in tests without a router mock.

## Git
- Commit directly to `main`; use a feature branch only for major changes. Push only when asked.
- On Windows/PowerShell, write multi-line commit messages to a file and use `git commit -F <file>`.
