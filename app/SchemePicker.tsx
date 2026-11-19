"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_SCHEME,
  SCHEMES,
  SCHEME_LABELS,
  SCHEME_STORAGE_KEY,
  isScheme,
  type Scheme,
} from "@/lib/schemes";

// The scheme lives on <html data-scheme>, set early by SCHEME_INIT_SCRIPT in the layout.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getScheme(): Scheme {
  const s = document.documentElement.dataset.scheme;
  return isScheme(s) ? s : DEFAULT_SCHEME;
}

function setScheme(s: Scheme) {
  const root = document.documentElement;
  if (s === DEFAULT_SCHEME) delete root.dataset.scheme;
  else root.dataset.scheme = s;
  try {
    localStorage.setItem(SCHEME_STORAGE_KEY, s);
  } catch {
    // Storage can be unavailable (e.g. private mode); the choice then lasts until reload.
  }
  listeners.forEach((l) => l());
}

const selectClass =
  "min-h-10 rounded-lg border-2 border-slate-300 bg-white py-1 pr-2 pl-3 text-sm font-medium text-slate-900 transition-colors hover:border-accent-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-accent-300 dark:focus-visible:outline-accent-300";

export function SchemePicker() {
  const scheme = useSyncExternalStore(subscribe, getScheme, () => DEFAULT_SCHEME);

  return (
    <div className="flex items-center gap-2">
      {/* Swatch of the current accent colour. */}
      <span
        aria-hidden="true"
        className="size-4 rounded-full bg-accent-800 dark:bg-accent-300"
      />
      <label htmlFor="scheme-picker" className="sr-only">
        <span lang="fi">Väriteema</span> / Colour scheme
      </label>
      <select
        id="scheme-picker"
        value={scheme}
        onChange={(e) => {
          if (isScheme(e.target.value)) setScheme(e.target.value);
        }}
        className={selectClass}
      >
        {SCHEMES.map((s) => (
          <option key={s} value={s}>
            {SCHEME_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
