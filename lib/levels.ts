import easy from "@/data/easy.json";
import medium from "@/data/medium.json";
import hard from "@/data/hard.json";
import literary from "@/data/topics/literary.json";
import specialist from "@/data/topics/specialist.json";
import travel from "@/data/topics/travel.json";
import food from "@/data/topics/food.json";
import sports from "@/data/topics/sports.json";
import type { WordPair } from "./quiz";
import type { UiLang } from "./strings";

/** Difficulty levels, shown as the first row on the start screen. */
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Topics, each split into the same three difficulties. */
export const TOPICS = ["literary", "specialist", "travel", "food", "sports"] as const;
export type Topic = (typeof TOPICS)[number];

/** Specialist words carry a field; wrong options come from the same field. */
export const FIELDS = ["law", "medicine", "finance", "science", "computing"] as const;
export type Field = (typeof FIELDS)[number];

/** A word list: a general difficulty, or a topic at a difficulty ("food-medium"). */
export type Level = Difficulty | `${Topic}-${Difficulty}`;

type Label = Record<UiLang, string>;

export const DIFFICULTY_LABELS: Record<Difficulty, Label> = {
  easy: { fi: "Helppo", en: "Easy" },
  medium: { fi: "Keskitaso", en: "Medium" },
  hard: { fi: "Vaikea", en: "Hard" },
};

export const TOPIC_LABELS: Record<Topic, Label> = {
  literary: { fi: "Tarinat", en: "Literary" },
  specialist: { fi: "Erikoissanasto", en: "Specialist" },
  travel: { fi: "Matkailu", en: "Travel" },
  food: { fi: "Ruoka", en: "Food" },
  sports: { fi: "Urheilu", en: "Sports" },
};

export const FIELD_LABELS: Record<Field, Label> = {
  law: { fi: "Laki", en: "Law" },
  medicine: { fi: "Lääketiede", en: "Medicine" },
  finance: { fi: "Talous", en: "Finance" },
  science: { fi: "Tiede", en: "Science" },
  computing: { fi: "Tietotekniikka", en: "Computing" },
};

type TieredList = Record<Difficulty, WordPair[]>;
const TOPIC_WORDS: Record<Topic, TieredList> = {
  literary,
  specialist: specialist as TieredList,
  travel,
  food,
  sports,
};
const GENERAL_WORDS: Record<Difficulty, WordPair[]> = { easy, medium, hard };

export function levelFor(difficulty: Difficulty, topic: Topic | null): Level {
  return topic ? `${topic}-${difficulty}` : difficulty;
}

/** Splits a level key back into its difficulty and topic (null for a general list). */
export function parseLevel(level: Level): { difficulty: Difficulty; topic: Topic | null } {
  const [first, second] = level.split("-") as [string, string | undefined];
  return second
    ? { difficulty: second as Difficulty, topic: first as Topic }
    : { difficulty: first as Difficulty, topic: null };
}

function buildLevels(): Record<Level, { label: Label; words: WordPair[] }> {
  const levels = {} as Record<Level, { label: Label; words: WordPair[] }>;
  for (const d of DIFFICULTIES) {
    levels[d] = { label: DIFFICULTY_LABELS[d], words: GENERAL_WORDS[d] };
    for (const t of TOPICS) {
      levels[levelFor(d, t)] = {
        label: {
          fi: `${TOPIC_LABELS[t].fi} · ${DIFFICULTY_LABELS[d].fi}`,
          en: `${TOPIC_LABELS[t].en} · ${DIFFICULTY_LABELS[d].en}`,
        },
        words: TOPIC_WORDS[t][d],
      };
    }
  }
  return levels;
}

/** Every word list, keyed by level, with its bilingual label. */
export const LEVELS = buildLevels();
