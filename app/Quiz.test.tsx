import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/quiz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/quiz")>();
  return { ...actual, buildRound: vi.fn() };
});

import { buildRound } from "@/lib/quiz";
import Quiz from "./Quiz";

// Question i: prompt "p{i}", fixed option order, correct answer is option 1.
function fixedRound() {
  return Array.from({ length: 10 }, (_, i) => ({
    prompt: `p${i}`,
    correct: `c${i}`,
    options: [`c${i}`, `a${i}`, `b${i}`, `d${i}`],
  }));
}

const mockedBuild = vi.mocked(buildRound);

beforeEach(() => {
  mockedBuild.mockReset();
  mockedBuild.mockImplementation(() => fixedRound());
});

type User = ReturnType<typeof userEvent.setup>;

async function startQuiz() {
  const user = userEvent.setup();
  render(<Quiz />);
  await user.click(screen.getByRole("button", { name: /Start/ }));
  return user;
}

const optionBtn = (text: string) =>
  // The number and ✓/✗ marks are aria-hidden, so the accessible name is the word.
  screen.getByRole("button", { name: text });

// The aria-live feedback line (its text is split across lang-tagged spans).
const feedback = () => document.querySelector<HTMLElement>('[aria-live="polite"]')!;

async function playRound(user: User, wrongAt: number[]) {
  for (let i = 0; i < 10; i++) {
    await user.keyboard(wrongAt.includes(i) ? "2" : "1");
    await user.click(
      screen.getByRole("button", { name: i === 9 ? /Results/ : /Next/ }),
    );
  }
}

describe("start screen", () => {
  it("has easy and en-fi selected by default", () => {
    render(<Quiz />);
    expect(screen.getByRole("button", { name: "Helppo" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Keskitaso" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Vaikea" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /English → Suomi/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Suomi → English/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("starts a 10-question round with the default settings", async () => {
    await startQuiz();
    expect(mockedBuild).toHaveBeenCalledTimes(1);
    const [words, dir, count] = mockedBuild.mock.calls[0];
    expect(words).toHaveLength(100);
    expect(dir).toBe("en-fi");
    expect(count).toBe(10);
    expect(screen.getByText("1 / 10")).toBeInTheDocument();
    expect(screen.getByText("p0")).toBeInTheDocument();
  });

  it("passes the chosen direction and level", async () => {
    const user = userEvent.setup();
    render(<Quiz />);
    await user.click(screen.getByRole("button", { name: "Vaikea" }));
    await user.click(screen.getByRole("button", { name: /Suomi → English/ }));
    await user.click(screen.getByRole("button", { name: /Start/ }));
    expect(mockedBuild.mock.calls[0][1]).toBe("fi-en");
    expect(screen.getByText("Vaikea")).toBeInTheDocument();
  });
});

describe("question screen", () => {
  it("correct answer shows check and feedback and focuses Next", async () => {
    const user = await startQuiz();
    await user.click(optionBtn("c0"));
    expect(feedback()).toHaveTextContent("Oikein! / Correct!");
    expect(optionBtn("c0")).toHaveTextContent("✓");
    expect(screen.getByRole("button", { name: /Next/ })).toHaveFocus();
  });

  it("moves focus to the new word after Next, and to the heading on results", async () => {
    const user = await startQuiz();
    expect(screen.getByRole("heading", { name: "p0" })).toHaveFocus();
    await user.keyboard("1");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByRole("heading", { name: "p1" })).toHaveFocus();
    for (let i = 1; i < 10; i++) {
      await user.keyboard("1");
      await user.click(screen.getByRole("button", { name: i === 9 ? /Results/ : /Next/ }));
    }
    expect(screen.getByRole("heading", { name: /Score/ })).toHaveFocus();
  });

  it("wrong answer shows red mark and the correct answer", async () => {
    const user = await startQuiz();
    await user.click(optionBtn("a0"));
    expect(optionBtn("a0")).toHaveTextContent("✗");
    expect(optionBtn("c0")).toHaveTextContent("✓");
    expect(feedback()).toHaveTextContent("Correct answer: c0");
  });

  it("disables all options after answering and ignores further input", async () => {
    const user = await startQuiz();
    await user.click(optionBtn("a0"));
    for (const t of ["c0", "a0", "b0", "d0"]) expect(optionBtn(t)).toBeDisabled();
    await user.keyboard("1");
    expect(feedback()).toHaveTextContent("Correct answer: c0");
    expect(feedback()).not.toHaveTextContent("Correct!");
  });

  it.each([
    ["1", "c0"],
    ["2", "a0"],
    ["3", "b0"],
    ["4", "d0"],
  ])("key %s selects option %s", async (key, text) => {
    const user = await startQuiz();
    await user.keyboard(key);
    expect(optionBtn(text)).toHaveTextContent(text === "c0" ? "✓" : "✗");
    expect(optionBtn("c0")).toBeDisabled();
  });

  it("ignores other keys and modifier combos", async () => {
    const user = await startQuiz();
    await user.keyboard("5");
    await user.keyboard("0");
    await user.keyboard("x");
    await user.keyboard("{Control>}1{/Control}");
    expect(optionBtn("c0")).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Next/ })).not.toBeInTheDocument();
  });

  it("Next advances and re-enables options", async () => {
    const user = await startQuiz();
    await user.keyboard("1");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("2 / 10")).toBeInTheDocument();
    expect(screen.getByText("p1")).toBeInTheDocument();
    expect(optionBtn("c1")).toBeEnabled();
  });
});

describe("result screen", () => {
  it("shows score and missed words after 10 questions", async () => {
    const user = await startQuiz();
    await playRound(user, [2, 5]);
    expect(screen.getByText("8 / 10")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("p2")).toBeInTheDocument();
    expect(within(items[0]).getByText(/✗ a2/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/✓ c2/)).toBeInTheDocument();
    expect(within(items[1]).getByText("p5")).toBeInTheDocument();
  });

  it("shows the all-correct message on a perfect round", async () => {
    const user = await startQuiz();
    await playRound(user, []);
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    expect(screen.getByText(/All correct!/)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("Play again resets the round with the same settings", async () => {
    const user = userEvent.setup();
    render(<Quiz />);
    await user.click(screen.getByRole("button", { name: "Keskitaso" }));
    await user.click(screen.getByRole("button", { name: /Suomi → English/ }));
    await user.click(screen.getByRole("button", { name: /Start/ }));
    await playRound(user, [0, 1, 2]);
    await user.click(screen.getByRole("button", { name: /Play again/ }));
    expect(mockedBuild).toHaveBeenCalledTimes(2);
    expect(mockedBuild.mock.calls[1][1]).toBe("fi-en");
    expect(mockedBuild.mock.calls[1][0]).toBe(mockedBuild.mock.calls[0][0]);
    expect(screen.getByText("1 / 10")).toBeInTheDocument();
    expect(optionBtn("c0")).toBeEnabled();
    // A perfect second round must not carry over score or missed words.
    await playRound(user, []);
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    expect(screen.getByText(/All correct!/)).toBeInTheDocument();
  });

  it("Change settings returns to the start screen", async () => {
    const user = await startQuiz();
    await playRound(user, []);
    await user.click(screen.getByRole("button", { name: /Change settings/ }));
    expect(screen.getByRole("button", { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Helppo" })).toBeInTheDocument();
  });
});
