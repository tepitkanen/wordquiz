import easy from "@/data/easy.json";
import medium from "@/data/medium.json";
import hard from "@/data/hard.json";
import literary from "@/data/literary.json";
import specialist from "@/data/specialist.json";
import type { WordPair } from "./quiz";
import type { UiLang } from "./strings";

export type Level = "easy" | "medium" | "hard" | "literary" | "specialist";

export const LEVELS: Record<Level, { label: Record<UiLang, string>; words: WordPair[] }> = {
  easy: { label: { fi: "Helppo", en: "Easy" }, words: easy },
  medium: { label: { fi: "Keskitaso", en: "Medium" }, words: medium },
  hard: { label: { fi: "Vaikea", en: "Hard" }, words: hard },
  literary: { label: { fi: "Kirjallinen", en: "Literary" }, words: literary },
  specialist: { label: { fi: "Erikoissanasto", en: "Specialist" }, words: specialist },
};

/** Difficulty levels, shown in the first row on the start screen. */
export const LEVEL_ORDER: Level[] = ["easy", "medium", "hard"];

/** Themed vocabulary levels, shown in their own group below the difficulty levels. */
export const SPECIAL_LEVELS: Level[] = ["literary", "specialist"];
