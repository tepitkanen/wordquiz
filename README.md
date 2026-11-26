# Sanavisa – Finnish–English Word Quiz

A small multiple-choice vocabulary quiz for practising Finnish and English words, built with Next.js and React.

**Play it live: [wordquiz-delta.vercel.app](https://wordquiz-delta.vercel.app/)**

## Features

- **Three difficulty levels** – Helppo (easy), Keskitaso (medium) and Vaikea (hard), 1000 word pairs each
- **Five topics, each at the same three difficulties** – pick a difficulty and optionally a topic (e.g. Literary + Medium):
  - Tarinat (literary: story, poetic and old-fashioned words), Matkailu (travel), Ruoka (food) and Urheilu (sports): 300 word pairs per difficulty
  - Erikoissanasto (specialist: law, medicine, finance, science and computing): 500 word pairs per difficulty, with the field shown on each question
- **Both directions** – choose Finnish → English or English → Finnish on the front page
- **10-question rounds** with four answer options per question
- **Smarter wrong answers** – distractors come from the same word class (verbs vs. other words), so you can't guess from the form alone; Specialist distractors also come from the same field
- **Results screen** listing missed words with your answer and the correct one
- **Keyboard friendly** – press `1`–`4` to answer and `Enter` to continue
- **Interface in your language** – English when practising English → Finnish, Finnish the other way round
- **Colour schemes** – blue, green or purple, remembered between visits
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
  page.tsx                  Front page: logo and direction choice
  quiz/[direction]/page.tsx Quiz page for /quiz/fi-en and /quiz/en-fi
  Quiz.tsx                  Quiz UI: level, question and result screens
  SchemePicker.tsx          Colour scheme dropdown
  Logo.tsx, icon.svg        Logo and favicon
  styles.ts                 Shared button and link styles
data/
  easy.json       General word lists, one per difficulty
  medium.json
  hard.json
  topics/         One file per topic: { "easy": [...], "medium": [...], "hard": [...] }
    literary.json, specialist.json, travel.json, food.json, sports.json
lib/
  levels.ts       Difficulties, topics, fields, and the word list for each combination
  quiz.ts         Directions, shuffling and question/round generation
  strings.ts      Quiz interface text in Finnish and English
  schemes.ts      Colour schemes
```

## Adding or editing words

Words are `{ "en": "...", "fi": "..." }` pairs. The general lists are arrays in `data/easy.json`, `medium.json` and `hard.json`; each topic file in `data/topics/` holds an `easy`, `medium` and `hard` array. Specialist words also have a `"field"` (`law`, `medicine`, `finance`, `science` or `computing`). Verbs are written with a leading `to` (e.g. `"to run"`) so they're grouped together when picking wrong answers.

The tests in `data/data.test.ts` check each list's size (1000 per general difficulty, 300 per topic difficulty, 500 per Specialist difficulty with 100 per field), at least 40 verbs and 40 other words per list, no empty or untrimmed strings, no duplicates, and that no English or Finnish word appears in more than one list. Run `npm test` after editing.
