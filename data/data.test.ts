import { describe, expect, it } from "vitest";
import easy from "./easy.json";
import medium from "./medium.json";
import hard from "./hard.json";
import literary from "./literary.json";
import specialist from "./specialist.json";
import { LEVELS, LEVEL_ORDER, SPECIAL_LEVELS } from "@/lib/levels";

const files: Record<string, { en: string; fi: string }[]> = {
  easy,
  medium,
  hard,
  literary,
  specialist,
};

const expectedCount: Record<string, number> = {
  easy: 1000,
  medium: 1000,
  hard: 1000,
  literary: 500,
  specialist: 500,
};

describe.each(Object.entries(files))("data/%s.json", (name, data) => {
  it("has the expected number of entries", () => {
    expect(data).toHaveLength(expectedCount[name]);
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
});

describe("across levels", () => {
  it.each(["en", "fi"] as const)("no %s value appears in more than one level", (k) => {
    const owner = new Map<string, string>();
    const dups: string[] = [];
    for (const [name, data] of Object.entries(files)) {
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
  it("maps each level to its data file", () => {
    expect(LEVEL_ORDER).toEqual(["easy", "medium", "hard"]);
    expect(LEVELS.easy.words).toBe(easy);
    expect(LEVELS.medium.words).toBe(medium);
    expect(LEVELS.hard.words).toBe(hard);
    expect(SPECIAL_LEVELS).toEqual(["literary", "specialist"]);
    expect(LEVELS.literary.words).toBe(literary);
    expect(LEVELS.specialist.words).toBe(specialist);
  });
});
