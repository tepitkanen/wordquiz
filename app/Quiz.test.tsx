import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/actions/progress", () => ({
  saveRound: vi.fn(() => Promise.resolve()),
  getReviewWords: vi.fn(() => Promise.resolve([])),
}));
vi.mock("@/lib/auth-client", () => ({ authClient: { useSession: vi.fn() } }));
vi.mock("@/lib/quiz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/quiz")>();
  return { ...actual, buildRound: vi.fn() };
});

import { getReviewWords, saveRound } from "@/app/actions/progress";
import { LEVELS } from "@/lib/levels";
import { authClient } from "@/lib/auth-client";
import { buildRound, type Direction } from "@/lib/quiz";
import { BEFORE_SIGN_IN_EVENT } from "@/lib/resume";
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

const mockedSave = vi.mocked(saveRound);
const mockedReview = vi.mocked(getReviewWords);
function setSignedIn(signedIn: boolean) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: signedIn ? { user: { id: "u1", name: "Maija" } } : null,
    isPending: false,
  } as unknown as ReturnType<typeof authClient.useSession>);
}

beforeEach(() => {
  mockedBuild.mockReset();
  mockedBuild.mockImplementation(() => fixedRound());
  mockedSave.mockClear();
  mockedReview.mockReset();
  mockedReview.mockResolvedValue([]);
  setSignedIn(false);
});

type User = ReturnType<typeof userEvent.setup>;

async function startQuiz(direction: Direction = "en-fi") {
  const user = userEvent.setup();
  render(<Quiz direction={direction} />);
  await user.click(screen.getByRole("button", { name: direction === "en-fi" ? "Start" : "Aloita" }));
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
  it("has easy selected by default", () => {
    render(<Quiz direction="en-fi" />);
    expect(screen.getByRole("button", { name: "Easy" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Medium" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Hard" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the chosen direction and a link back to the front page", () => {
    render(<Quiz direction="fi-en" />);
    expect(screen.getByText("Suomi → English")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Takaisin/ })).toHaveAttribute("href", "/");
  });

  it("uses an English interface for English → Suomi", () => {
    render(<Quiz direction="en-fi" />);
    expect(screen.getByRole("group", { name: "Difficulty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back/ })).toBeInTheDocument();
    expect(screen.queryByText(/Aloita|Vaikeustaso/)).not.toBeInTheDocument();
  });

  it("uses a Finnish interface for Suomi → English, through a whole round", async () => {
    const user = await startQuiz("fi-en");
    await user.keyboard("2");
    expect(feedback()).toHaveTextContent("Oikea vastaus: c0");
    await user.click(screen.getByRole("button", { name: "Seuraava" }));
    for (let i = 1; i < 10; i++) {
      await user.keyboard("1");
      await user.click(screen.getByRole("button", { name: i === 9 ? "Tulokset" : "Seuraava" }));
    }
    expect(screen.getByRole("heading", { name: "Tulos" })).toBeInTheDocument();
    expect(screen.getByText("Väärät vastaukset")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pelaa uudelleen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vaihda asetuksia" })).toBeInTheDocument();
    expect(screen.queryByText(/Results|Play again|Missed words/)).not.toBeInTheDocument();
  });

  it("has no direction toggle on the level screen", () => {
    render(<Quiz direction="en-fi" />);
    expect(
      screen.queryByRole("button", { name: /English → Suomi|Suomi → English/ }),
    ).not.toBeInTheDocument();
  });

  it("starts a 10-question round with the default settings", async () => {
    await startQuiz();
    expect(mockedBuild).toHaveBeenCalledTimes(1);
    const [words, dir, count] = mockedBuild.mock.calls[0];
    expect(words).toHaveLength(1000);
    expect(dir).toBe("en-fi");
    expect(count).toBe(10);
    expect(screen.getByText("1 / 10 · Easy")).toBeInTheDocument();
    expect(screen.getByText("p0")).toBeInTheDocument();
  });

  it("passes the chosen direction and level", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="fi-en" />);
    await user.click(screen.getByRole("button", { name: "Vaikea" }));
    await user.click(screen.getByRole("button", { name: /Aloita/ }));
    expect(mockedBuild.mock.calls[0][1]).toBe("fi-en");
    expect(screen.getByText("1 / 10 · Vaikea")).toBeInTheDocument();
  });

  it("has no topic selected by default and uses the general list", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    const group = screen.getByRole("group", { name: "Topic" });
    expect(within(group).getByRole("button", { name: "None" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Words:").parentElement).toHaveTextContent("Words: Easy");
    await user.click(screen.getByRole("button", { name: /Start/ }));
    expect(mockedBuild.mock.calls[0][0]).toHaveLength(1000);
  });

  it("combines a topic with the chosen difficulty", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(screen.getByRole("button", { name: "Medium" }));
    await user.click(screen.getByRole("button", { name: "Literary" }));
    expect(screen.getByRole("button", { name: "Literary" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Medium" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Words:").parentElement).toHaveTextContent("Words: Literary · Medium");
    await user.click(screen.getByRole("button", { name: /Start/ }));
    expect(mockedBuild.mock.calls[0][0]).toHaveLength(300);
    expect(screen.getByText("1 / 10 · Literary · Medium")).toBeInTheDocument();
  });

  it("falls back to the general list when the topic is set back to None", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(screen.getByRole("button", { name: "Hard" }));
    await user.click(screen.getByRole("button", { name: "Food" }));
    await user.click(screen.getByRole("button", { name: "None" }));
    await user.click(screen.getByRole("button", { name: /Start/ }));
    expect(mockedBuild.mock.calls[0][0]).toHaveLength(1000);
    expect(screen.getByText("1 / 10 · Hard")).toBeInTheDocument();
  });

  it("uses the 500-word Specialist tiers", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(screen.getByRole("button", { name: "Specialist" }));
    await user.click(screen.getByRole("button", { name: /Start/ }));
    expect(mockedBuild.mock.calls[0][0]).toHaveLength(500);
  });

  it("shows Finnish topic labels for fi-en", () => {
    render(<Quiz direction="fi-en" />);
    const group = screen.getByRole("group", { name: "Aihe" });
    const labels = within(group).getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["Ei aihetta", "Tarinat", "Erikoissanasto", "Matkailu", "Ruoka", "Urheilu"]);
  });
});

describe("field label", () => {
  it("shows a Specialist word's field under the word, as part of the heading", async () => {
    mockedBuild.mockImplementation(() =>
      fixedRound().map((q) => ({ ...q, field: "law" as const })),
    );
    await startQuiz("en-fi");
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("p0");
    expect(heading).toHaveTextContent("Law");
    // jsdom trims spaces between the parts; browsers keep them.
    expect(heading).toHaveAccessibleName(/^p0s*Field:s*Law$/);
  });

  it("shows no field label for other words", async () => {
    await startQuiz("en-fi");
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("p0");
  });
});

describe("question screen", () => {
  it("correct answer shows check and feedback and focuses Next", async () => {
    const user = await startQuiz();
    await user.click(optionBtn("c0"));
    expect(feedback()).toHaveTextContent("Correct!");
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

  it("Quit returns to the level screen with the settings kept", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(screen.getByRole("button", { name: "Hard" }));
    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.keyboard("1");
    await user.click(screen.getByRole("button", { name: "Quit" }));
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hard" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Sanavisa" })).toHaveFocus();
    // Starting again begins a fresh round.
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(mockedBuild).toHaveBeenCalledTimes(2);
    expect(screen.getByText("1 / 10 · Hard")).toBeInTheDocument();
    expect(optionBtn("c0")).toBeEnabled();
  });

  it("Quit is labelled Lopeta in the Finnish interface", async () => {
    await startQuiz("fi-en");
    expect(screen.getByRole("button", { name: "Lopeta" })).toBeInTheDocument();
  });

  it("Next advances and re-enables options", async () => {
    const user = await startQuiz();
    await user.keyboard("1");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText(/^2 \/ 10/)).toBeInTheDocument();
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
    render(<Quiz direction="en-fi" />);
    await user.click(screen.getByRole("button", { name: "Medium" }));
    await user.click(screen.getByRole("button", { name: /Start/ }));
    await playRound(user, [0, 1, 2]);
    await user.click(screen.getByRole("button", { name: /Play again/ }));
    expect(mockedBuild).toHaveBeenCalledTimes(2);
    expect(mockedBuild.mock.calls[1][1]).toBe("en-fi");
    expect(mockedBuild.mock.calls[1][0]).toBe(mockedBuild.mock.calls[0][0]);
    expect(screen.getByText(/^1 \/ 10/)).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument();
  });
});

describe("continuing a round after signing in", () => {
  beforeEach(() => sessionStorage.clear());

  const signIn = () => act(() => window.dispatchEvent(new Event(BEFORE_SIGN_IN_EVENT)));

  it("restores the round saved before sign-in, once", async () => {
    const user = await startQuiz();
    await user.keyboard("2"); // wrong on p0
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.keyboard("1"); // right on p1, left unanswered-next
    signIn();
    cleanup();

    // Back from Google: the page loads again.
    render(<Quiz direction="en-fi" />);
    expect(screen.getByText(/^2 \/ 10/)).toBeInTheDocument();
    expect(optionBtn("c1")).toBeDisabled(); // already answered
    await user.click(screen.getByRole("button", { name: /Next/ }));
    for (let i = 2; i < 10; i++) {
      await user.keyboard("1");
      await user.click(screen.getByRole("button", { name: i === 9 ? /Results/ : /Next/ }));
    }
    expect(screen.getByText("9 / 10")).toBeInTheDocument();
    expect(screen.getByText("p0")).toBeInTheDocument();

    // Used once: another load starts fresh.
    cleanup();
    render(<Quiz direction="en-fi" />);
    expect(screen.getByRole("button", { name: /Start/ })).toBeInTheDocument();
  });

  it("saves nothing from the start screen", () => {
    render(<Quiz direction="en-fi" />);
    signIn();
    expect(sessionStorage.length).toBe(0);
  });

  it("restores a topic round with its topic and difficulty", async () => {
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(screen.getByRole("button", { name: "Hard" }));
    await user.click(screen.getByRole("button", { name: "Food" }));
    await user.click(screen.getByRole("button", { name: /Start/ }));
    signIn();
    cleanup();

    render(<Quiz direction="en-fi" />);
    expect(screen.getByText("1 / 10 · Food · Hard")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quit" }));
    expect(screen.getByRole("button", { name: "Food" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hard" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores a round saved for the other direction", async () => {
    await startQuiz("en-fi");
    signIn();
    cleanup();
    render(<Quiz direction="fi-en" />);
    expect(screen.getByRole("button", { name: "Aloita" })).toBeInTheDocument();
  });
});

describe("saving progress", () => {
  beforeEach(() => sessionStorage.clear());

  // en-fi: prompt p{i} is the English word, c{i} the Finnish one.
  const expectedAnswers = (wrongAt: number[]) =>
    Array.from({ length: 10 }, (_, i) => ({ en: `p${i}`, fi: `c${i}`, correct: !wrongAt.includes(i) }));

  it("saves the finished round once for a signed-in user", async () => {
    setSignedIn(true);
    const user = await startQuiz();
    await playRound(user, [3, 7]);
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledWith({
      direction: "en-fi",
      level: "easy",
      answers: expectedAnswers([3, 7]),
    });
  });

  it("saves each round of Play again separately", async () => {
    setSignedIn(true);
    const user = await startQuiz();
    await playRound(user, [0]);
    await user.click(screen.getByRole("button", { name: /Play again/ }));
    await playRound(user, []);
    expect(mockedSave).toHaveBeenCalledTimes(2);
    expect(mockedSave.mock.calls[1][0]).toMatchObject({ answers: expectedAnswers([]) });
  });

  it("saves nothing for a guest", async () => {
    const user = await startQuiz();
    await playRound(user, [1]);
    expect(screen.getByText("9 / 10")).toBeInTheDocument();
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it("keeps working when saving fails", async () => {
    setSignedIn(true);
    mockedSave.mockRejectedValueOnce(new Error("offline"));
    const user = await startQuiz();
    await playRound(user, []);
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
  });

  it("saves a guest's result after they sign in from the result screen", async () => {
    const user = await startQuiz();
    await playRound(user, [5]);
    act(() => window.dispatchEvent(new Event(BEFORE_SIGN_IN_EVENT)));
    cleanup();

    setSignedIn(true);
    render(<Quiz direction="en-fi" />);
    expect(screen.getByText("9 / 10")).toBeInTheDocument();
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledWith({
      direction: "en-fi",
      level: "easy",
      answers: expectedAnswers([5]),
    });
  });

  it("doesn't save a restored result twice", async () => {
    setSignedIn(true);
    const user = await startQuiz();
    await playRound(user, []);
    expect(mockedSave).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event(BEFORE_SIGN_IN_EVENT)));
    cleanup();

    render(<Quiz direction="en-fi" />);
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    expect(mockedSave).toHaveBeenCalledTimes(1);
  });
});

describe("review mode", () => {
  // Real words, so buildReviewRound finds them in their lists.
  const w1 = LEVELS.easy.words[0];
  const w2 = LEVELS["food-hard"].words[0];
  const pairs = [
    { en: w1.en, fi: w1.fi, level: "easy" as const },
    { en: w2.en, fi: w2.fi, level: "food-hard" as const },
  ];
  const reviewButton = () => screen.queryByRole("button", { name: /Review missed words/ });

  it("shows no review button to guests and doesn't ask the server", async () => {
    mockedReview.mockResolvedValue(pairs);
    render(<Quiz direction="en-fi" />);
    await screen.findByRole("button", { name: /Start/ });
    expect(reviewButton()).toBeNull();
    expect(mockedReview).not.toHaveBeenCalled();
  });

  it("shows no review button when the list is empty", async () => {
    setSignedIn(true);
    render(<Quiz direction="en-fi" />);
    await vi.waitFor(() => expect(mockedReview).toHaveBeenCalledWith("en-fi"));
    expect(reviewButton()).toBeNull();
  });

  it("shows the count and plays a review round of the missed words", async () => {
    setSignedIn(true);
    mockedReview.mockResolvedValue(pairs);
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    const button = await screen.findByRole("button", { name: "Review missed words (2)" });
    await user.click(button);

    expect(screen.getByText("1 / 2 · Review")).toBeInTheDocument();
    const prompts: string[] = [];
    for (let i = 0; i < 2; i++) {
      const prompt = screen.getByRole("heading", { level: 1 }).textContent!;
      prompts.push(prompt);
      const correct = pairs.find((p) => p.en === prompt)!.fi;
      await user.click(screen.getByRole("button", { name: correct }));
      await user.click(screen.getByRole("button", { name: i === 1 ? /Results/ : /Next/ }));
    }
    expect(prompts.sort()).toEqual([w1.en, w2.en].sort());
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(mockedSave).toHaveBeenCalledWith({
      direction: "en-fi",
      level: "review",
      answers: expect.arrayContaining([
        { en: w1.en, fi: w1.fi, correct: true },
        { en: w2.en, fi: w2.fi, correct: true },
      ]),
    });
  });

  it("hides Play again after a review round once the list is empty", async () => {
    setSignedIn(true);
    mockedReview.mockResolvedValueOnce(pairs.slice(0, 1)).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(await screen.findByRole("button", { name: "Review missed words (1)" }));
    await user.click(screen.getByRole("button", { name: w1.fi }));
    await user.click(screen.getByRole("button", { name: /Results/ }));
    await vi.waitFor(() => expect(screen.queryByRole("button", { name: /Play again/ })).toBeNull());
    expect(screen.getByRole("button", { name: /Change settings/ })).toBeInTheDocument();
  });

  it("labels the button in Finnish for fi-en", async () => {
    setSignedIn(true);
    mockedReview.mockResolvedValue(pairs);
    render(<Quiz direction="fi-en" />);
    expect(await screen.findByRole("button", { name: "Kertaa virheet (2)" })).toBeInTheDocument();
  });
});

describe("review mode, Play again", () => {
  it("offers Play again only after the refreshed list arrives", async () => {
    setSignedIn(true);
    const w1 = LEVELS.easy.words[0];
    const w2 = LEVELS.easy.words[1];
    const both = [
      { en: w1.en, fi: w1.fi, level: "easy" as const },
      { en: w2.en, fi: w2.fi, level: "easy" as const },
    ];
    let releaseRefresh!: () => void;
    mockedReview
      .mockResolvedValueOnce(both)
      .mockImplementationOnce(() => new Promise((r) => (releaseRefresh = () => r(both.slice(1)))));
    const user = userEvent.setup();
    render(<Quiz direction="en-fi" />);
    await user.click(await screen.findByRole("button", { name: "Review missed words (2)" }));
    for (let i = 0; i < 2; i++) {
      const prompt = screen.getByRole("heading", { level: 1 }).textContent!;
      await user.click(screen.getByRole("button", { name: both.find((p) => p.en === prompt)!.fi }));
      await user.click(screen.getByRole("button", { name: i === 1 ? /Results/ : /Next/ }));
    }
    expect(screen.queryByRole("button", { name: /Play again/ })).toBeNull();
    await act(async () => releaseRefresh());
    expect(screen.getByRole("button", { name: /Play again/ })).toBeInTheDocument();
  });
});
