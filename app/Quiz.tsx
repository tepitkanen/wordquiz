"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { LEVELS, LEVEL_ORDER, SPECIAL_LEVELS, type Level } from "@/lib/levels";
import { saveRound } from "@/app/actions/progress";
import { authClient } from "@/lib/auth-client";
import { toPair, type Answer } from "@/lib/progress";
import { buildRound, DIRECTION_LABELS, type Direction, type Question } from "@/lib/quiz";
import { BEFORE_SIGN_IN_EVENT, stashRound, takeStashedRound, type Miss } from "@/lib/resume";
import { STRINGS, uiLangFor } from "@/lib/strings";
import { primaryBtn, secondaryBtn, textLink, toggleBase, toggleOff, toggleOn } from "./styles";

const ROUND_LENGTH = 10;

type Screen = "start" | "quiz" | "result";

export default function Quiz({ direction }: { direction: Direction }) {
  const [screen, setScreen] = useState<Screen>("start");
  const [level, setLevel] = useState<Level>("easy");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Miss[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  // Whether this round's result has been sent to saveRound (once per round).
  const recorded = useRef(false);
  const { data: session } = authClient.useSession();
  const nextRef = useRef<HTMLButtonElement>(null);
  // Receives focus when the screen or question changes, so keyboard users keep their place.
  const focusRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);

  const question = questions[index];
  const promptLang = direction === "en-fi" ? "en" : "fi";
  const answerLang = direction === "en-fi" ? "fi" : "en";
  const ui = uiLangFor(direction);
  const t = STRINGS[ui];

  function start() {
    setQuestions(buildRound(LEVELS[level].words, direction, ROUND_LENGTH));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setMissed([]);
    setAnswers([]);
    recorded.current = false;
    setScreen("quiz");
  }

  function answer(option: string) {
    if (selected !== null || !question) return;
    setSelected(option);
    const correct = option === question.correct;
    setAnswers((a) => [...a, { ...toPair(question, direction), correct }]);
    if (correct) {
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

  // Signing in leaves the page: save a round in progress (or its result) first.
  const onBeforeSignIn = useEffectEvent(() => {
    if (screen === "start") return;
    stashRound({
      direction,
      screen,
      level,
      questions,
      index,
      selected,
      score,
      missed,
      answers,
      recorded: recorded.current,
    });
  });
  useEffect(() => {
    window.addEventListener(BEFORE_SIGN_IN_EVENT, onBeforeSignIn);
    return () => window.removeEventListener(BEFORE_SIGN_IN_EVENT, onBeforeSignIn);
  }, []);

  // Back from signing in: continue the saved round, once.
  useEffect(() => {
    const saved = takeStashedRound(direction);
    if (!saved) return;
    // sessionStorage exists only in the browser, so this can't happen during the
    // prerender or in a useState initializer (hydration would mismatch). Runs once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevel(saved.level);
    setQuestions(saved.questions);
    setIndex(saved.index);
    setSelected(saved.selected);
    setScore(saved.score);
    setMissed(saved.missed);
    setAnswers(saved.answers);
    recorded.current = saved.recorded;
    setScreen(saved.screen);
  }, [direction]);

  // Save a finished round for a signed-in user, once. This also covers a guest who
  // finishes and then signs in from the result screen. Failures are ignored: the
  // quiz works the same without saved progress.
  useEffect(() => {
    if (screen !== "result" || !session || recorded.current || answers.length === 0) return;
    recorded.current = true;
    saveRound({ direction, level, answers }).catch(() => {});
  }, [screen, session, direction, level, answers]);

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
      <section lang={ui} className="flex flex-col gap-8">
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
            {t.subtitle}
          </p>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold">{DIRECTION_LABELS[direction]}</span>
            <Link href="/" className={textLink}>
              ← {t.back}
            </Link>
          </p>
        </header>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold">
            {t.difficulty}
          </legend>
          <div className="flex gap-2">
            {LEVEL_ORDER.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(l)}
                className={`${toggleBase} ${level === l ? toggleOn : toggleOff}`}
              >
                {LEVELS[l].label[ui]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold">
            {t.special}
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {SPECIAL_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(l)}
                className={`${toggleBase} ${level === l ? toggleOn : toggleOff}`}
              >
                {LEVELS[l].label[ui]}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="button" onClick={start} className={primaryBtn}>
          {t.start}
        </button>
      </section>
    );
  }

  if (screen === "result") {
    return (
      <section lang={ui} className="flex flex-col gap-8 text-center">
        <div>
          <h1
            ref={focusRef}
            tabIndex={-1}
            className="text-slate-600 outline-none dark:text-slate-400"
          >
            {t.score}
          </h1>
          <p className="text-6xl font-bold text-accent-800 dark:text-accent-300">
            {score} / {questions.length}
          </p>
        </div>

        {missed.length > 0 ? (
          <div className="text-left">
            <h2 className="mb-3 font-semibold">
              {t.missedWords}
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
            ✓ {t.allCorrect}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={start} className={primaryBtn}>
            {t.playAgain}
          </button>
          <button
            type="button"
            onClick={() => setScreen("start")}
            className={secondaryBtn}
          >
            {t.changeSettings}
          </button>
        </div>
      </section>
    );
  }

  const answered = selected !== null;
  const wasCorrect = selected === question.correct;
  const progress = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <section lang={ui} className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span>
            {index + 1} / {questions.length} · {LEVELS[level].label[ui]}
          </span>
          <button
            type="button"
            onClick={() => setScreen("start")}
            className={secondaryBtn}
          >
            {t.quit}
          </button>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-label={t.progress}
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={index + (answered ? 1 : 0)}
        >
          <div
            className="h-full bg-accent-800 transition-all dark:bg-accent-300"
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
                ✓ {t.correct}
              </span>
            ) : (
              <span className="text-red-700 dark:text-red-400">
                ✗ {t.correctAnswer}:{" "}
                <span lang={answerLang}>{question.correct}</span>
              </span>
            ))}
        </p>
        {answered && (
          <button ref={nextRef} type="button" onClick={next} className={primaryBtn}>
            {index + 1 >= questions.length ? t.results : t.next}
          </button>
        )}
      </div>
    </section>
  );
}
