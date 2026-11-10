import { describe, expect, it } from "vitest";
import { buildRound, makeQuestion, shuffle, type WordPair } from "./quiz";

const words: WordPair[] = Array.from({ length: 20 }, (_, i) => ({
  en: `en${i}`,
  fi: `fi${i}`,
}));

describe("shuffle", () => {
  it("returns a permutation of the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it("does not mutate its input and returns a new array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    const out = shuffle(input);
    expect(input).toEqual(copy);
    expect(out).not.toBe(input);
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["a"])).toEqual(["a"]);
  });

  it("can produce more than one ordering", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(shuffle([1, 2, 3, 4]).join());
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("makeQuestion", () => {
  it("maps en -> fi", () => {
    const q = makeQuestion(words, 3, "en-fi");
    expect(q.prompt).toBe("en3");
    expect(q.correct).toBe("fi3");
    expect(q.options.every((o) => o.startsWith("fi"))).toBe(true);
  });

  it("maps fi -> en", () => {
    const q = makeQuestion(words, 7, "fi-en");
    expect(q.prompt).toBe("fi7");
    expect(q.correct).toBe("en7");
    expect(q.options.every((o) => o.startsWith("en"))).toBe(true);
  });

  it("always has 4 distinct options including the correct one", () => {
    for (let i = 0; i < 100; i++) {
      for (const dir of ["en-fi", "fi-en"] as const) {
        const q = makeQuestion(words, i % words.length, dir);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.correct);
      }
    }
  });

  it("takes wrong options from other pairs only", () => {
    const q = makeQuestion(words, 0, "en-fi");
    expect(q.options.filter((o) => o === "fi0")).toHaveLength(1);
  });

  it("puts the correct answer in varying positions", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(words, 0, "en-fi");
      positions.add(q.options.indexOf(q.correct));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  const mixed: WordPair[] = [
    ...Array.from({ length: 6 }, (_, i) => ({ en: `to v${i}`, fi: `verbi${i}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ en: `n${i}`, fi: `nomini${i}` })),
  ];

  it("takes wrong options from the same word class (verb / non-verb)", () => {
    for (let r = 0; r < 100; r++) {
      expect(makeQuestion(mixed, 0, "en-fi").options.every((o) => o.startsWith("verbi"))).toBe(true);
      expect(makeQuestion(mixed, 6, "en-fi").options.every((o) => o.startsWith("nomini"))).toBe(true);
    }
  });

  it("fills up from the other class when the same class is too small", () => {
    const fewVerbs = [mixed[0], mixed[1], ...mixed.slice(6)];
    const q = makeQuestion(fewVerbs, 0, "en-fi");
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options).toContain("verbi1");
  });
});

describe("buildRound", () => {
  it("returns `count` questions with distinct prompts", () => {
    for (let i = 0; i < 50; i++) {
      const round = buildRound(words, "en-fi", 10);
      expect(round).toHaveLength(10);
      expect(new Set(round.map((q) => q.prompt)).size).toBe(10);
    }
  });

  it("works in fi-en direction", () => {
    const round = buildRound(words, "fi-en", 10);
    expect(round.every((q) => q.prompt.startsWith("fi"))).toBe(true);
    expect(round.every((q) => q.correct.startsWith("en"))).toBe(true);
  });

  it("each question is valid", () => {
    for (const q of buildRound(words, "en-fi", 10)) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correct);
    }
  });

  it("returns an empty round for count 0", () => {
    expect(buildRound(words, "en-fi", 0)).toEqual([]);
  });

  it("caps at the number of words when count is larger", () => {
    expect(buildRound(words, "en-fi", 50)).toHaveLength(words.length);
  });
});
