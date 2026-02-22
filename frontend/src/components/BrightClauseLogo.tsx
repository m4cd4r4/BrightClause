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
    >
      {/* Background */}
      <rect width="40" height="40" rx="10" fill="#0F0F0F" />
      <rect width="40" height="40" rx="10" fill="url(#grad)" opacity="0.6" />

      {/* Document body */}
      <path
        d="M11 8h13l6 6v18a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        fill="#1a1a1a"
        stroke="#333"
        strokeWidth="1"
      />
      {/* Folded corner */}
      <path d="M24 8l6 6h-5.5A.5.5 0 0 1 24 13.5V8Z" fill="#222" stroke="#333" strokeWidth="1" />

      {/* Document lines */}
      <line x1="13" y1="18" x2="22" y2="18" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="21.5" x2="24" y2="21.5" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="25" x2="20" y2="25" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />

      {/* Accent spark — bottom right */}
      <circle cx="28" cy="28" r="7" fill="#0F0F0F" />
      <circle cx="28" cy="28" r="7" fill="url(#sparkGrad)" opacity="0.15" />
      <path
        d="M28 23.5v2.8m0 3.4v2.8M23.5 28h2.8m3.4 0h2.8"
        stroke="#c9a227"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="28" cy="28" r="1.4" fill="#c9a227" />

      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c9a227" stopOpacity="0.3" />
          <stop offset="1" stopColor="#c9a227" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sparkGrad" cx="28" cy="28" r="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c9a227" />
          <stop offset="1" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}
