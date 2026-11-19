/** Colour schemes; each swaps the accent colour defined in app/globals.css. */
export const SCHEMES = ["blue", "green", "purple"] as const;
export type Scheme = (typeof SCHEMES)[number];

export const DEFAULT_SCHEME: Scheme = "blue";

export const SCHEME_LABELS: Record<Scheme, string> = {
  blue: "Sininen / Blue",
  green: "Vihreä / Green",
  purple: "Violetti / Purple",
};

/** localStorage key for the chosen scheme. */
export const SCHEME_STORAGE_KEY = "sanavisa-scheme";

export function isScheme(s: unknown): s is Scheme {
  return typeof s === "string" && (SCHEMES as readonly string[]).includes(s);
}

/**
 * Runs in <head> before the page paints, so a saved scheme shows without a flash of blue.
 * Only known scheme names are applied.
 */
export const SCHEME_INIT_SCRIPT = `try{var s=localStorage.getItem(${JSON.stringify(
  SCHEME_STORAGE_KEY,
)});if(${JSON.stringify(SCHEMES)}.indexOf(s)>0)document.documentElement.dataset.scheme=s}catch(e){}`;
