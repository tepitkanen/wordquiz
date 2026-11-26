import { describe, expect, it } from "vitest";
import easy from "./easy.json";
import medium from "./medium.json";
import hard from "./hard.json";
import literary from "./topics/literary.json";
import specialist from "./topics/specialist.json";
import travel from "./topics/travel.json";
import food from "./topics/food.json";
import sports from "./topics/sports.json";
import { DIFFICULTIES, FIELDS, LEVELS, TOPICS, levelFor } from "@/lib/levels";

type Word = { en: string; fi: string; field?: string };
type Tiered = Record<(typeof DIFFICULTIES)[number], Word[]>;

const topicFiles: Record<string, Tiered> = { literary, specialist, travel, food, sports };

// Every word list: the three general levels and each topic tier ("food-medium").
const lists: Record<string, Word[]> = { easy, medium, hard };
for (const [topic, tiers] of Object.entries(topicFiles)) {
  for (const d of DIFFICULTIES) lists[`${topic}-${d}`] = tiers[d];
}

function expectedCount(name: string): number {
  if (!name.includes("-")) return 1000;
  return name.startsWith("specialist-") ? 500 : 300;
}

describe.each(Object.entries(lists))("%s word list", (name, data) => {
  it("has the expected number of entries", () => {
    expect(data).toHaveLength(expectedCount(name));
  });

  it("has enough verbs and non-verbs for distractors", () => {
    const verbs = data.filter((w) => w.en.startsWith("to ")).length;
    expect(verbs).toBeGreaterThanOrEqual(40);
    expect(data.length - verbs).toBeGreaterThanOrEqual(40);
  });

  it("has non-empty, trimmed en and fi strings", () => {
    for (const w of data) {
      for (const k of ["en", "fi"] as const) {
        expect(typeof w[k], JSON.stringify(w)).toBe("string");
        expect(w[k].length, JSON.stringify(w)).toBeGreaterThan(0);
        expect(w[k], JSON.stringify(w)).toBe(w[k].trim());
      }
    }
  });

  it.each(["en", "fi"] as const)("has no duplicate %s values", (k) => {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const w of data) {
      const v = w[k].toLowerCase();
      if (seen.has(v)) dups.push(w[k]);
      seen.add(v);
    }
    expect(dups).toEqual([]);
  });

  it("tags fields only on Specialist words", () => {
    const tagged = data.filter((w) => w.field !== undefined).length;
    expect(tagged).toBe(name.startsWith("specialist-") ? data.length : 0);
  });
});

describe.each(DIFFICULTIES)("specialist-%s fields", (d) => {
  it("has 100 words in each field", () => {
    for (const f of FIELDS) {
      expect(specialist[d].filter((w) => w.field === f), f).toHaveLength(100);
    }
  });
});

describe("across lists", () => {
  it.each(["en", "fi"] as const)("no %s value appears in more than one list", (k) => {
    const owner = new Map<string, string>();
    const dups: string[] = [];
    for (const [name, data] of Object.entries(lists)) {
      for (const w of data) {
        const v = w[k].toLowerCase();
        const prev = owner.get(v);
        if (prev && prev !== name) dups.push(`${w[k]} (${prev}, ${name})`);
        else owner.set(v, name);
      }
    }
    expect(dups).toEqual([]);
  });
});

describe("levels", () => {
  it("maps each general level and topic tier to its data", () => {
    expect(LEVELS.easy.words).toBe(easy);
    expect(LEVELS.medium.words).toBe(medium);
    expect(LEVELS.hard.words).toBe(hard);
    for (const t of TOPICS) {
      for (const d of DIFFICULTIES) {
        expect(LEVELS[levelFor(d, t)].words).toBe(topicFiles[t][d]);
      }
    }
  });
});
