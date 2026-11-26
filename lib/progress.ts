import { LEVELS, type Level } from "./levels";
import { DIRECTIONS, type Direction, type Question, type WordPair } from "./quiz";

// Pure progress logic, shared by the quiz (client) and the progress actions (server).

/** A missed word leaves the review list after this many correct answers in a row. */
export const STREAK_TO_CLEAR = 2;
const MAX_ANSWERS = 10;

/** A review round mixes words from several levels; each word keeps its own level. */
export const REVIEW = "review";
export type RoundLevel = Level | typeof REVIEW;

export type Answer = WordPair & { correct: boolean };
export type RoundInput = { direction: Direction; level: RoundLevel; answers: Answer[] };
/** A word on the review list, with the level its word list belongs to. */
export type ReviewPair = { en: string; fi: string; level: Level };

/** Maps a question back to its word pair (prompt is in the "from" language). */
export function toPair(question: Pick<Question, "prompt" | "correct">, direction: Direction): WordPair {
  return direction === "en-fi"
    ? { en: question.prompt, fi: question.correct }
    : { en: question.correct, fi: question.prompt };
}

type MissedState = { missCount: number; correctStreak: number };
export type MissedUpdate =
  | { kind: "none" }
  | { kind: "delete" }
  | ({ kind: "upsert" } & MissedState);

/**
 * How one answer changes a word's review-list row (null = not on the list).
 * Wrong: miss count +1, streak back to 0. Right: streak +1, and the word
 * leaves the list when the streak reaches STREAK_TO_CLEAR.
 */
export function nextMissedState(row: MissedState | null, correct: boolean): MissedUpdate {
  if (!correct) {
    return { kind: "upsert", missCount: (row?.missCount ?? 0) + 1, correctStreak: 0 };
  }
  if (!row) return { kind: "none" };
  const correctStreak = row.correctStreak + 1;
  if (correctStreak >= STREAK_TO_CLEAR) return { kind: "delete" };
  return { kind: "upsert", missCount: row.missCount, correctStreak };
}

const pairKey = (p: Pick<WordPair, "en" | "fi">) => `${p.en}\u0000${p.fi}`;

// Every word belongs to exactly one list (data/data.test.ts checks this).
let levelByPair: Map<string, Level> | null = null;

/** The level a word pair belongs to, or null if it's in no current list. */
export function levelOfPair(pair: Pick<WordPair, "en" | "fi">): Level | null {
  if (!levelByPair) {
    levelByPair = new Map();
    for (const [level, { words }] of Object.entries(LEVELS) as [Level, { words: WordPair[] }][]) {
      for (const w of words) levelByPair.set(pairKey(w), level);
    }
  }
  return levelByPair.get(pairKey(pair)) ?? null;
}

/**
 * Validates untrusted saveRound input: a known direction and level (or "review"),
 * 1–10 answers, each a distinct word from that level's list (any list for a review
 * round). Returns null if anything is off.
 */
export function parseRoundInput(input: unknown): RoundInput | null {
  if (typeof input !== "object" || input === null) return null;
  const { direction, level, answers } = input as Record<string, unknown>;
  if (typeof direction !== "string" || !(DIRECTIONS as readonly string[]).includes(direction)) return null;
  if (typeof level !== "string" || (level !== REVIEW && !Object.hasOwn(LEVELS, level))) return null;
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) return null;

  const seen = new Set<string>();
  const parsed: Answer[] = [];
  for (const a of answers) {
    if (typeof a !== "object" || a === null) return null;
    const { en, fi, correct } = a as Record<string, unknown>;
    if (typeof en !== "string" || typeof fi !== "string" || typeof correct !== "boolean") return null;
    const key = pairKey({ en, fi });
    const wordLevel = levelOfPair({ en, fi });
    if (!wordLevel || (level !== REVIEW && wordLevel !== level) || seen.has(key)) return null;
    seen.add(key);
    parsed.push({ en, fi, correct });
  }
  return { direction: direction as Direction, level: level as RoundLevel, answers: parsed };
}
