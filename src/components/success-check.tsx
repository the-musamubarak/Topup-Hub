export function SuccessCheck({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke="url(#sc-g)"
        strokeWidth="5"
        strokeLinecap="round"
        className="animate-check-circle"
      />
      <path
        d="M38 62 L54 78 L84 46"
        stroke="url(#sc-g)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animate-check-draw"
      />
      <defs>
        <linearGradient id="sc-g" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EB001B" />
          <stop offset="60%" stopColor="#FF6600" />
          <stop offset="100%" stopColor="#F79E1B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
