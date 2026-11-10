import { describe, expect, it } from "vitest";
import easy from "./easy.json";
import medium from "./medium.json";
import hard from "./hard.json";
import { LEVELS, LEVEL_ORDER } from "@/lib/levels";

const files: Record<string, { en: string; fi: string }[]> = {
  easy,
  medium,
  hard,
};

describe.each(Object.entries(files))("data/%s.json", (_name, data) => {
  it("has 100 entries", () => {
    expect(data).toHaveLength(100);
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

describe("levels", () => {
  it("maps each level to its data file", () => {
    expect(LEVEL_ORDER).toEqual(["easy", "medium", "hard"]);
    expect(LEVELS.easy.words).toBe(easy);
    expect(LEVELS.medium.words).toBe(medium);
    expect(LEVELS.hard.words).toBe(hard);
  });
});
