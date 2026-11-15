import easy from "@/data/easy.json";
import medium from "@/data/medium.json";
import hard from "@/data/hard.json";
import literary from "@/data/literary.json";
import specialist from "@/data/specialist.json";
import type { WordPair } from "./quiz";

export type Level = "easy" | "medium" | "hard" | "literary" | "specialist";

export const LEVELS: Record<Level, { label: string; words: WordPair[] }> = {
  easy: { label: "Helppo", words: easy },
  medium: { label: "Keskitaso", words: medium },
  hard: { label: "Vaikea", words: hard },
  literary: { label: "Kirjallinen", words: literary },
  specialist: { label: "Erikoissanasto", words: specialist },
};

/** Difficulty levels, shown in the first row on the start screen. */
export const LEVEL_ORDER: Level[] = ["easy", "medium", "hard"];

/** Themed vocabulary levels, shown in their own group below the difficulty levels. */
export const SPECIAL_LEVELS: Level[] = ["literary", "specialist"];
