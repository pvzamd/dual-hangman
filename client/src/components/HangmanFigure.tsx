/**
 * A static, fully-drawn hangman — the cosmetic defeat illustration shown to
 * the loser at game over (ADR-009: the figure is purely decorative, never a
 * gameplay penalty). Not animated.
 */
export default function HangmanFigure({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={`h-40 w-auto ${className}`}
      role="img"
      aria-label="A hanged stick figure — you lost"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
    >
      {/* gallows */}
      <line x1="10" y1="135" x2="80" y2="135" />
      <line x1="30" y1="135" x2="30" y2="10" />
      <line x1="30" y1="10" x2="85" y2="10" />
      <line x1="85" y1="10" x2="85" y2="28" />
      {/* head */}
      <circle cx="85" cy="40" r="12" />
      {/* body */}
      <line x1="85" y1="52" x2="85" y2="92" />
      {/* arms */}
      <line x1="85" y1="62" x2="70" y2="78" />
      <line x1="85" y1="62" x2="100" y2="78" />
      {/* legs */}
      <line x1="85" y1="92" x2="72" y2="112" />
      <line x1="85" y1="92" x2="98" y2="112" />
      {/* X eyes for the defeated look */}
      <g strokeWidth={2.5}>
        <line x1="80" y1="37" x2="83" y2="40" />
        <line x1="83" y1="37" x2="80" y2="40" />
        <line x1="87" y1="37" x2="90" y2="40" />
        <line x1="90" y1="37" x2="87" y2="40" />
      </g>
    </svg>
  );
}
