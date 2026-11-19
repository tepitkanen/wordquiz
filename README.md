# Sanavisa – Finnish–English Word Quiz

A small multiple-choice vocabulary quiz for practising Finnish and English words, built with Next.js and React.

**Play it live: [wordquiz-delta.vercel.app](https://wordquiz-delta.vercel.app/)**

## Features

- **Three difficulty levels** – Helppo (easy), Keskitaso (medium) and Vaikea (hard), 1000 word pairs each
- **Two special levels** – Kirjallinen (literary: poetic and old-fashioned words) and Erikoissanasto (specialist: law, medicine, finance, science and computing terms), 500 word pairs each
- **Both directions** – choose Finnish → English or English → Finnish on the front page
- **10-question rounds** with four answer options per question
- **Smarter wrong answers** – distractors come from the same word class (verbs vs. other words), so you can't guess from the form alone
- **Results screen** listing missed words with your answer and the correct one
- **Keyboard friendly** – press `1`–`4` to answer and `Enter` to continue
- **Accessible** – focus management, `lang` attributes for correct screen-reader pronunciation, live feedback, dark mode

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) and React 19
- TypeScript
- Tailwind CSS 4
- Vitest + Testing Library

## Getting started

Requires Node.js 20 or newer.

```bash
git clone https://github.com/tepitkanen/wordquiz.git
cd wordquiz
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                      |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the development server     |
| `npm run build` | Create a production build        |
| `npm start`     | Serve the production build       |
| `npm run lint`  | Run ESLint                       |
| `npm test`      | Run the test suite (Vitest)      |

## Project structure

```
app/
  Quiz.tsx        Quiz UI: start, question and result screens
  page.tsx        Home page
data/
  easy.json       Word lists, one per level
  medium.json
  hard.json
  literary.json
  specialist.json
lib/
  levels.ts       Difficulty and special levels and their word lists
  quiz.ts         Shuffling and question/round generation
```

## Adding or editing words

Word lists live in `data/*.json` as arrays of `{ "en": "...", "fi": "..." }` pairs. Verbs are written with a leading `to` (e.g. `"to run"`) so they're grouped together when picking wrong answers.

The tests in `data/data.test.ts` check that each list has the expected number of entries (1000 for the difficulty levels, 500 for the special levels), with no empty or untrimmed strings and no duplicates, and that no English or Finnish word appears in more than one level. Run `npm test` after editing.
