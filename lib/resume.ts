import { LEVELS, type Level } from "./levels";
import type { Direction, Question } from "./quiz";

// Signing in leaves the page for Google. Just before that, AccountMenu fires
// BEFORE_SIGN_IN_EVENT; Quiz saves its round here and restores it once on return.

export const BEFORE_SIGN_IN_EVENT = "sanavisa:before-sign-in";
const STORAGE_KEY = "sanavisa-resume";

export type Miss = { prompt: string; chosen: string; correct: string };

export type SavedRound = {
  direction: Direction;
  screen: "quiz" | "result";
  level: Level;
  questions: Question[];
  index: number;
  selected: string | null;
  score: number;
  missed: Miss[];
};

export function saveRound(round: SavedRound) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(round));
  } catch {
    // Storage unavailable (e.g. private mode): the round just starts over.
  }
}

/** Returns the saved round for this direction, if any, and removes it so it's used once. */
export function takeSavedRound(direction: Direction): SavedRound | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as SavedRound;
    const valid =
      r.direction === direction &&
      (r.screen === "quiz" || r.screen === "result") &&
      Object.hasOwn(LEVELS, r.level) &&
      Array.isArray(r.questions) &&
      r.questions.length > 0 &&
      Number.isInteger(r.index) &&
      r.index >= 0 &&
      r.index < r.questions.length &&
      Number.isInteger(r.score) &&
      Array.isArray(r.missed);
    return valid ? r : null;
  } catch {
    return null;
  }
}
