"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { LEVELS, LEVEL_ORDER, type Level } from "@/lib/levels";
import { buildRound, type Direction, type Question } from "@/lib/quiz";

const ROUND_LENGTH = 10;

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "en-fi", label: "English → Suomi" },
  { value: "fi-en", label: "Suomi → English" },
];

type Miss = { prompt: string; chosen: string; correct: string };
type Screen = "start" | "quiz" | "result";

/** Bilingual label: Finnish part tagged lang="fi" so screen readers pronounce it correctly. */
function Bi({ fi, en }: { fi: string; en: string }) {
  return (
    <>
      <span lang="fi">{fi}</span> / {en}
    </>
  );
}

const toggleBase =
  "min-h-12 flex-1 rounded-xl border-2 px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:focus-visible:outline-blue-300";
const toggleOn =
  "border-blue-800 bg-blue-800 text-white dark:border-blue-300 dark:bg-blue-300 dark:text-slate-900";
const toggleOff =
  "border-slate-300 bg-white text-slate-900 hover:border-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-blue-300";
const primaryBtn =
  "min-h-12 rounded-xl bg-blue-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:bg-blue-300 dark:text-slate-900 dark:hover:bg-blue-200 dark:focus-visible:outline-blue-300";
const secondaryBtn =
  "min-h-12 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:border-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-blue-300 dark:focus-visible:outline-blue-300";

export default function Quiz() {
  const [screen, setScreen] = useState<Screen>("start");
  const [level, setLevel] = useState<Level>("easy");
  const [direction, setDirection] = useState<Direction>("en-fi");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Miss[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);
  // Receives focus when the screen or question changes, so keyboard users keep their place.
  const focusRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);

  const question = questions[index];
  const promptLang = direction === "en-fi" ? "en" : "fi";
  const answerLang = direction === "en-fi" ? "fi" : "en";

  function start() {
    setQuestions(buildRound(LEVELS[level].words, direction, ROUND_LENGTH));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setMissed([]);
    setScreen("quiz");
  }

  function answer(option: string) {
    if (selected !== null || !question) return;
    setSelected(option);
    if (option === question.correct) {
      setScore((s) => s + 1);
    } else {
      setMissed((m) => [
        ...m,
        { prompt: question.prompt, chosen: option, correct: question.correct },
      ]);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setScreen("result");
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }

  // Keys 1–4 pick an option while a question is open.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (screen !== "quiz" || selected !== null || !question) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= question.options.length) {
      answer(question.options[n - 1]);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Move focus to the new screen's heading or word (not on first page load).
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    focusRef.current?.focus();
  }, [screen, index]);

  // Focus "Next" after answering so Enter continues.
  useEffect(() => {
    if (selected !== null) nextRef.current?.focus();
  }, [selected]);

  if (screen === "start") {
    return (
      <section className="flex flex-col gap-8">
        <header className="text-center">
          <h1
            ref={focusRef}
            tabIndex={-1}
            lang="fi"
            className="text-4xl font-bold tracking-tight outline-none"
          >
            Sanavisa
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Finnish–English word quiz
          </p>
        </header>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold">
            <Bi fi="Vaikeustaso" en="Difficulty" />
          </legend>
          <div className="flex gap-2">
            {LEVEL_ORDER.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(l)}
                lang="fi"
                className={`${toggleBase} ${level === l ? toggleOn : toggleOff}`}
              >
                {LEVELS[l].label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold">
            <Bi fi="Suunta" en="Direction" />
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={direction === d.value}
                onClick={() => setDirection(d.value)}
                className={`${toggleBase} ${direction === d.value ? toggleOn : toggleOff}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="button" onClick={start} className={primaryBtn}>
          <Bi fi="Aloita" en="Start" />
        </button>
      </section>
    );
  }

  if (screen === "result") {
    return (
      <section className="flex flex-col gap-8 text-center">
        <div>
          <h1
            ref={focusRef}
            tabIndex={-1}
            className="text-slate-600 outline-none dark:text-slate-400"
          >
            <Bi fi="Tulos" en="Score" />
          </h1>
          <p className="text-6xl font-bold text-blue-800 dark:text-blue-300">
            {score} / {questions.length}
          </p>
        </div>

        {missed.length > 0 ? (
          <div className="text-left">
            <h2 className="mb-3 font-semibold">
              <Bi fi="Väärät vastaukset" en="Missed words" />
            </h2>
            <ul className="flex flex-col gap-2">
              {missed.map((m) => (
                <li
                  key={m.prompt}
                  className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <span className="font-semibold" lang={promptLang}>
                    {m.prompt}
                  </span>
                  <span
                    className="block text-sm text-red-700 dark:text-red-400"
                    lang={answerLang}
                  >
                    ✗ {m.chosen}
                  </span>
                  <span
                    className="block text-sm text-green-700 dark:text-green-400"
                    lang={answerLang}
                  >
                    ✓ {m.correct}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-lg font-medium text-green-700 dark:text-green-400">
            ✓ <Bi fi="Kaikki oikein!" en="All correct!" />
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={start} className={primaryBtn}>
            <Bi fi="Pelaa uudelleen" en="Play again" />
          </button>
          <button
            type="button"
            onClick={() => setScreen("start")}
            className={secondaryBtn}
          >
            <Bi fi="Vaihda asetuksia" en="Change settings" />
          </button>
        </div>
      </section>
    );
  }

  const answered = selected !== null;
  const wasCorrect = selected === question.correct;
  const progress = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <section className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span lang="fi">{LEVELS[level].label}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-label="Edistyminen / Progress"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={index + (answered ? 1 : 0)}
        >
          <div
            className="h-full bg-blue-800 transition-all dark:bg-blue-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h1
        ref={focusRef}
        tabIndex={-1}
        lang={promptLang}
        className="text-center text-4xl font-bold break-words outline-none"
      >
        {question.prompt}
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrect = option === question.correct;
          const isChosen = option === selected;
          let style = toggleOff;
          let mark = "";
          if (answered && isCorrect) {
            style =
              "border-green-700 bg-green-50 text-green-800 dark:border-green-400 dark:bg-green-950 dark:text-green-300";
            mark = "✓";
          } else if (answered && isChosen) {
            style =
              "border-red-700 bg-red-50 text-red-800 dark:border-red-400 dark:bg-red-950 dark:text-red-300";
            mark = "✗";
          } else if (answered) {
            style =
              "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500";
          }
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => answer(option)}
              lang={answerLang}
              className={`${toggleBase} flex items-center gap-3 text-left text-lg ${style}`}
            >
              <span className="text-sm text-slate-500 dark:text-slate-400" aria-hidden>
                {i + 1}
              </span>
              <span className="flex-1">{option}</span>
              {mark && <span aria-hidden>{mark}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-12 items-center justify-between gap-4">
        <p aria-live="polite" className="font-medium">
          {answered &&
            (wasCorrect ? (
              <span className="text-green-700 dark:text-green-400">
                ✓ <Bi fi="Oikein!" en="Correct!" />
              </span>
            ) : (
              <span className="text-red-700 dark:text-red-400">
                ✗ <Bi fi="Oikea vastaus" en="Correct answer" />:{" "}
                <span lang={answerLang}>{question.correct}</span>
              </span>
            ))}
        </p>
        {answered && (
          <button ref={nextRef} type="button" onClick={next} className={primaryBtn}>
            {index + 1 >= questions.length ? (
              <Bi fi="Tulos" en="Results" />
            ) : (
              <Bi fi="Seuraava" en="Next" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}
