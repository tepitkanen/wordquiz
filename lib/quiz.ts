export type WordPair = { en: string; fi: string };
export type Direction = "en-fi" | "fi-en";

export type Question = {
  prompt: string;
  correct: string;
  options: string[];
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
 * so the class alone doesn't give the answer away.
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
  const sameClass = others.filter((w) => isVerb(w) === isVerb(pair));
  const otherClass = others.filter((w) => isVerb(w) !== isVerb(pair));
  const wrong = [...shuffle(sameClass), ...shuffle(otherClass)]
    .slice(0, OPTION_COUNT - 1)
    .map((w) => w[to]);
  return {
    prompt: pair[from],
    correct: pair[to],
    options: shuffle([pair[to], ...wrong]),
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
