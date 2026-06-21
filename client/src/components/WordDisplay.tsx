/**
 * Renders a masked word as a row of letter slots. `null` entries are still
 * hidden (shown as a blank underline); revealed letters show through with a
 * subtle one-shot reveal animation.
 */
export default function WordDisplay({ masked }: { masked: (string | null)[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {masked.map((letter, i) => (
        // Key includes the letter so a slot remounts when it's revealed,
        // replaying the reveal animation once (empty slots don't animate).
        <span
          key={`${i}:${letter ?? ''}`}
          className="flex h-12 w-9 items-center justify-center border-b-2 border-slate-500 font-mono text-2xl font-bold"
          style={letter ? { animation: 'reveal 200ms ease-out' } : undefined}
        >
          {letter ?? ' '}
        </span>
      ))}
    </div>
  );
}
