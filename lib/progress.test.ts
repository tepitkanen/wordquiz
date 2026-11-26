import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { levelOfPair, nextMissedState, parseRoundInput, toPair } from "./progress";

describe("toPair", () => {
  it("maps a question back to its en/fi pair in both directions", () => {
    expect(toPair({ prompt: "dog", correct: "koira" }, "en-fi")).toEqual({ en: "dog", fi: "koira" });
    expect(toPair({ prompt: "koira", correct: "dog" }, "fi-en")).toEqual({ en: "dog", fi: "koira" });
  });
});

describe("nextMissedState", () => {
  it("adds a newly missed word with one miss", () => {
    expect(nextMissedState(null, false)).toEqual({ kind: "upsert", missCount: 1, correctStreak: 0 });
  });

  it("counts another miss and resets the streak", () => {
    expect(nextMissedState({ missCount: 2, correctStreak: 1 }, false)).toEqual({
      kind: "upsert",
      missCount: 3,
      correctStreak: 0,
    });
  });

  it("raises the streak on a right answer", () => {
    expect(nextMissedState({ missCount: 2, correctStreak: 0 }, true)).toEqual({
      kind: "upsert",
      missCount: 2,
      correctStreak: 1,
    });
  });

  it("removes the word on the second right answer in a row", () => {
    expect(nextMissedState({ missCount: 2, correctStreak: 1 }, true)).toEqual({ kind: "delete" });
  });

  it("does nothing for a right answer to a word not on the list", () => {
    expect(nextMissedState(null, true)).toEqual({ kind: "none" });
  });
});

describe("parseRoundInput", () => {
  const [w0, w1] = LEVELS.easy.words;
  const valid = {
    direction: "en-fi",
    level: "easy",
    answers: [
      { ...w0, correct: true },
      { ...w1, correct: false },
    ],
  };

  it("accepts a valid round", () => {
    expect(parseRoundInput(valid)).toEqual(valid);
  });

  it("drops unknown extra fields from answers", () => {
    const input = { ...valid, answers: [{ ...w0, correct: true, score: 99 }] };
    expect(parseRoundInput(input)?.answers).toEqual([{ ...w0, correct: true }]);
  });

  it.each([
    ["not an object", "nope"],
    ["null", null],
    ["unknown direction", { ...valid, direction: "sv-fi" }],
    ["unknown level", { ...valid, level: "expert" }],
    ["inherited key as level", { ...valid, level: "toString" }],
    ["no answers", { ...valid, answers: [] }],
    ["answers not an array", { ...valid, answers: "x" }],
    ["more than 10 answers", { ...valid, answers: LEVELS.easy.words.slice(0, 11).map((w) => ({ ...w, correct: true })) }],
    ["word not in the level", { ...valid, answers: [{ en: "dog", fi: "kissa", correct: true }] }],
    ["word from another level", { ...valid, answers: [{ ...LEVELS.hard.words[0], correct: true }] }],
    ["the same word twice", { ...valid, answers: [{ ...w0, correct: true }, { ...w0, correct: false }] }],
    ["correct not a boolean", { ...valid, answers: [{ ...w0, correct: "yes" }] }],
    ["answer not an object", { ...valid, answers: [null] }],
  ])("rejects %s", (_, input) => {
    expect(parseRoundInput(input)).toBeNull();
  });
});

describe("review rounds", () => {
  const easyWord = LEVELS.easy.words[0];
  const foodWord = LEVELS["food-hard"].words[0];

  it("finds the level a word belongs to", () => {
    expect(levelOfPair(easyWord)).toBe("easy");
    expect(levelOfPair(foodWord)).toBe("food-hard");
    expect(levelOfPair({ en: "dog", fi: "kissa" })).toBeNull();
  });

  it("accepts words from different levels in a review round", () => {
    const input = {
      direction: "fi-en",
      level: "review",
      answers: [
        { ...easyWord, correct: true },
        { ...foodWord, correct: false },
      ],
    };
    expect(parseRoundInput(input)).toEqual(input);
  });

  it("still rejects unknown words in a review round", () => {
    const input = { direction: "fi-en", level: "review", answers: [{ en: "dog", fi: "kissa", correct: true }] };
    expect(parseRoundInput(input)).toBeNull();
  });
});
