import easy from "@/data/easy.json";
import medium from "@/data/medium.json";
import hard from "@/data/hard.json";
import type { WordPair } from "./quiz";

export type Level = "easy" | "medium" | "hard";

export const LEVELS: Record<Level, { label: string; words: WordPair[] }> = {
  easy: { label: "Helppo", words: easy },
  medium: { label: "Keskitaso", words: medium },
  hard: { label: "Vaikea", words: hard },
};

export const LEVEL_ORDER: Level[] = ["easy", "medium", "hard"];
