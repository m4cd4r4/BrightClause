interface BrightClauseLogoProps {
  size?: number
  className?: string
}

export function BrightClauseMark({ size = 40, className = '' }: BrightClauseLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BrightClause"
      role="img"
    >
      {/* Document body */}
      <path
        d="M10 8h14l7 7v18a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        fill="rgba(201,162,39,0.08)"
        stroke="rgba(201,162,39,0.35)"
        strokeWidth="1.2"
      />
      {/* Folded corner */}
      <path d="M24 8l7 7h-6.5A.5.5 0 0 1 24 14.5V8Z"
        fill="rgba(201,162,39,0.15)"
        stroke="rgba(201,162,39,0.35)"
        strokeWidth="1.2"
      />

      {/* Document lines */}
      <line x1="13" y1="18" x2="22" y2="18" stroke="rgba(201,162,39,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="22" x2="25" y2="22" stroke="rgba(201,162,39,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="26" x2="19" y2="26" stroke="rgba(201,162,39,0.3)" strokeWidth="1.2" strokeLinecap="round" />

      {/* Gold spark — bottom right */}
      <path
        d="M29 25v3m0 3v3M26 28h3m3 0h3"
        stroke="#c9a227"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="29" cy="28" r="1.6" fill="#c9a227" />
    </svg>
  )
}
