import { describe, expect, it } from "vitest";
import { buildReviewRound, buildRound, isDirection, makeQuestion, shuffle, type WordPair } from "./quiz";

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

describe("isDirection", () => {
  it("accepts the known directions", () => {
    expect(isDirection("fi-en")).toBe(true);
    expect(isDirection("en-fi")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const s of ["", "fi", "EN-FI", "fi-en ", "de-fi"]) {
      expect(isDirection(s)).toBe(false);
    }
  });
});

describe("makeQuestion with fields", () => {
  // 6 law words and 6 medicine words; half of each are verbs.
  const fielded: WordPair[] = [
    ...Array.from({ length: 6 }, (_, i) => ({
      en: i < 3 ? `to law${i}` : `law${i}`,
      fi: `laki${i}`,
      field: "law" as const,
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      en: i < 3 ? `to med${i}` : `med${i}`,
      fi: `lääke${i}`,
      field: "medicine" as const,
    })),
  ];

  it("takes all wrong options from the word's own field", () => {
    for (let run = 0; run < 30; run++) {
      const q = makeQuestion(fielded, 4, "en-fi");
      expect(q.options.every((o) => o.startsWith("laki"))).toBe(true);
    }
  });

  it("copies the field onto the question", () => {
    expect(makeQuestion(fielded, 7, "en-fi").field).toBe("medicine");
    expect(makeQuestion(words, 0, "en-fi").field).toBeUndefined();
  });

  it("fills up from other fields when a field is too small", () => {
    const small: WordPair[] = [
      { en: "a", fi: "a1", field: "law" },
      { en: "b", fi: "b1", field: "law" },
      ...Array.from({ length: 5 }, (_, i) => ({ en: `m${i}`, fi: `m${i}fi`, field: "medicine" as const })),
    ];
    const q = makeQuestion(small, 0, "en-fi");
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain("b1");
    expect(q.options.filter((o) => o.startsWith("m"))).toHaveLength(2);
  });
});

describe("buildReviewRound", () => {
  const listA: WordPair[] = Array.from({ length: 10 }, (_, i) => ({ en: `a${i}`, fi: `afi${i}` }));
  const listB: WordPair[] = Array.from({ length: 10 }, (_, i) => ({ en: `b${i}`, fi: `bfi${i}` }));
  const wordsFor = (level: "A" | "B") => (level === "A" ? listA : listB);

  it("asks each missed word once, with wrong options from its own list", () => {
    const pairs = [
      { en: "a1", fi: "afi1", level: "A" as const },
      { en: "b2", fi: "bfi2", level: "B" as const },
    ];
    const round = buildReviewRound(pairs, "en-fi", 10, wordsFor);
    expect(round).toHaveLength(2);
    const qa = round.find((q) => q.prompt === "a1")!;
    const qb = round.find((q) => q.prompt === "b2")!;
    expect(qa.correct).toBe("afi1");
    expect(qa.options).toHaveLength(4);
    expect(qa.options.every((o) => o.startsWith("afi"))).toBe(true);
    expect(qb.options.every((o) => o.startsWith("bfi"))).toBe(true);
  });

  it("caps the round length", () => {
    const pairs = listA.map((w) => ({ ...w, level: "A" as const }));
    expect(buildReviewRound(pairs, "fi-en", 4, wordsFor)).toHaveLength(4);
  });

  it("skips words that are no longer in their list", () => {
    const pairs = [
      { en: "gone", fi: "poissa", level: "A" as const },
      { en: "a3", fi: "afi3", level: "A" as const },
    ];
    const round = buildReviewRound(pairs, "en-fi", 10, wordsFor);
    expect(round.map((q) => q.prompt)).toEqual(["a3"]);
  });
});
