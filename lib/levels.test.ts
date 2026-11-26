import { describe, expect, it } from "vitest";
import { DIFFICULTIES, LEVELS, TOPICS, levelFor, parseLevel } from "./levels";

describe("levelFor / parseLevel", () => {
  it("uses the general list when there is no topic", () => {
    expect(levelFor("medium", null)).toBe("medium");
    expect(parseLevel("medium")).toEqual({ difficulty: "medium", topic: null });
  });

  it("round-trips every topic and difficulty", () => {
    for (const topic of TOPICS) {
      for (const difficulty of DIFFICULTIES) {
        const level = levelFor(difficulty, topic);
        expect(level).toBe(`${topic}-${difficulty}`);
        expect(parseLevel(level)).toEqual({ difficulty, topic });
      }
    }
  });
});

describe("LEVELS labels", () => {
  it("combines topic and difficulty in both languages", () => {
    expect(LEVELS["literary-medium"].label).toEqual({ fi: "Tarinat · Keskitaso", en: "Literary · Medium" });
    expect(LEVELS["food-hard"].label).toEqual({ fi: "Ruoka · Vaikea", en: "Food · Hard" });
    expect(LEVELS.easy.label).toEqual({ fi: "Helppo", en: "Easy" });
  });
});
