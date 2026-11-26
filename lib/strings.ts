import type { Direction } from "./quiz";

/** Language of the quiz interface. */
export type UiLang = "fi" | "en";

/** English → Suomi gets an English interface, Suomi → English a Finnish one. */
export function uiLangFor(direction: Direction): UiLang {
  return direction === "en-fi" ? "en" : "fi";
}

type Strings = {
  subtitle: string;
  back: string;
  difficulty: string;
  topic: string;
  noTopic: string;
  wordList: string;
  field: string;
  review: string;
  reviewRound: string;
  start: string;
  quit: string;
  progress: string;
  correct: string;
  correctAnswer: string;
  next: string;
  results: string;
  score: string;
  missedWords: string;
  allCorrect: string;
  playAgain: string;
  changeSettings: string;
};

export const STRINGS: Record<UiLang, Strings> = {
  fi: {
    subtitle: "Suomi–englanti-sanavisa",
    back: "Takaisin",
    difficulty: "Vaikeustaso",
    topic: "Aihe",
    noTopic: "Ei aihetta",
    wordList: "Sanasto",
    field: "Ala",
    review: "Kertaa virheet",
    reviewRound: "Kertaus",
    start: "Aloita",
    quit: "Lopeta",
    progress: "Edistyminen",
    correct: "Oikein!",
    correctAnswer: "Oikea vastaus",
    next: "Seuraava",
    results: "Tulokset",
    score: "Tulos",
    missedWords: "Väärät vastaukset",
    allCorrect: "Kaikki oikein!",
    playAgain: "Pelaa uudelleen",
    changeSettings: "Vaihda asetuksia",
  },
  en: {
    subtitle: "Finnish–English word quiz",
    back: "Back",
    difficulty: "Difficulty",
    topic: "Topic",
    noTopic: "None",
    wordList: "Words",
    field: "Field",
    review: "Review missed words",
    reviewRound: "Review",
    start: "Start",
    quit: "Quit",
    progress: "Progress",
    correct: "Correct!",
    correctAnswer: "Correct answer",
    next: "Next",
    results: "Results",
    score: "Score",
    missedWords: "Missed words",
    allCorrect: "All correct!",
    playAgain: "Play again",
    changeSettings: "Change settings",
  },
};
