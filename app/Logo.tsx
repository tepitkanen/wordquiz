/** Sanavisa logo icon: two overlapping speech bubbles, "Eng" and "Fi". Decorative. */
export function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 64" aria-hidden="true" className={className}>
      {/* Back bubble: solid blue, "Eng" */}
      <path
        d="M14,4 H48 Q58,4 58,14 V30 Q58,40 48,40 H24 L13,49 L16,40 H14 Q4,40 4,30 V14 Q4,4 14,4 Z"
        className="fill-accent-800 dark:fill-accent-300"
      />
      <text
        x="26"
        y="29"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        className="fill-white dark:fill-slate-900"
      >
        Eng
      </text>
      {/* Front bubble: page background with a blue border, "Fi" */}
      <path
        d="M58,20 H82 Q92,20 92,30 V46 Q92,56 82,56 L86,63 L74,56 H58 Q48,56 48,46 V30 Q48,20 58,20 Z"
        strokeWidth="3"
        strokeLinejoin="round"
        className="fill-background stroke-accent-800 dark:stroke-accent-300"
      />
      <text
        x="70"
        y="46"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        className="fill-accent-800 dark:fill-accent-300"
      >
        Fi
      </text>
    </svg>
  );
}
