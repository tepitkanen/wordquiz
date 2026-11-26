import type { Field } from "./levels";

/** A word and its translation. Specialist words also name their field. */
export type WordPair = { en: string; fi: string; field?: Field };
/** Quiz directions, in the order they appear on the front page. */
export const DIRECTIONS = ["fi-en", "en-fi"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const DIRECTION_LABELS: Record<Direction, string> = {
  "fi-en": "Suomi → English",
  "en-fi": "English → Suomi",
};

/** True if a string from the URL is a known direction. */
export function isDirection(s: string): s is Direction {
  return (DIRECTIONS as readonly string[]).includes(s);
}

export type Question = {
  prompt: string;
  correct: string;
  options: string[];
  /** The word's field (Specialist only), shown as a hint. */
  field?: Field;
};

const OPTION_COUNT = 4;

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const isVerb = (w: WordPair) => w.en.startsWith("to ");

/**
 * Builds a question for words[index]: the correct answer plus 3 wrong ones from other pairs.
 * Wrong options come from the same word class (verb / non-verb) when possible,
 * so the class alone doesn't give the answer away. Words with a field draw their
 * wrong options from the same field first (same class, then other class).
 */
export function makeQuestion(
  words: readonly WordPair[],
  index: number,
  direction: Direction,
): Question {
  const from = direction === "en-fi" ? "en" : "fi";
  const to = direction === "en-fi" ? "fi" : "en";
  const pair = words[index];
  const others = words.filter((_, i) => i !== index);
  const byClass = (list: readonly WordPair[]) => [
    ...shuffle(list.filter((w) => isVerb(w) === isVerb(pair))),
    ...shuffle(list.filter((w) => isVerb(w) !== isVerb(pair))),
  ];
  const pool = pair.field
    ? [
        ...byClass(others.filter((w) => w.field === pair.field)),
        ...byClass(others.filter((w) => w.field !== pair.field)),
      ]
    : byClass(others);
  const wrong = pool.slice(0, OPTION_COUNT - 1).map((w) => w[to]);
  return {
    prompt: pair[from],
    correct: pair[to],
    options: shuffle([pair[to], ...wrong]),
    ...(pair.field ? { field: pair.field } : {}),
  };
}

/** Picks `count` distinct words at random and builds a question for each. */
export function buildRound(
  words: readonly WordPair[],
  direction: Direction,
  count: number,
): Question[] {
  const indices = shuffle(words.map((_, i) => i)).slice(0, count);
  return indices.map((i) => makeQuestion(words, i, direction));
}
