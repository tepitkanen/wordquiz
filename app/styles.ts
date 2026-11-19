export const toggleBase =
  "min-h-12 flex-1 rounded-xl border-2 px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:focus-visible:outline-blue-300";
export const toggleOn =
  "border-blue-800 bg-blue-800 text-white dark:border-blue-300 dark:bg-blue-300 dark:text-slate-900";
export const toggleOff =
  "border-slate-300 bg-white text-slate-900 hover:border-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-blue-300";
export const primaryBtn =
  "min-h-12 rounded-xl bg-blue-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:bg-blue-300 dark:text-slate-900 dark:hover:bg-blue-200 dark:focus-visible:outline-blue-300";
export const secondaryBtn =
  "min-h-12 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:border-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-blue-300 dark:focus-visible:outline-blue-300";

/** Front-page direction choice: looks like a level button, as a link. */
export const choiceLink = `${toggleBase} ${toggleOff} flex items-center justify-center text-lg`;

/** Inline text link, e.g. "Back". */
export const textLink =
  "rounded text-blue-800 underline underline-offset-2 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:text-blue-300 dark:hover:text-blue-200 dark:focus-visible:outline-blue-300";
