type IconProps = { className?: string };

const svgBase = {
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} width="18" height="18" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 1 0 7.07 7.07L14 18.07" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.71" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
