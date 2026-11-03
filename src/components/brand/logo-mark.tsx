/**
 * Vector redraw of the shopfront emblem: green ring, white field and the
 * red script "Ht" monogram. Replace the paths with the original artwork
 * once the owner supplies a source file.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? "Hamilton Textiles"}>
      <circle cx="50" cy="50" r="49" fill="#1e7a46" />
      <circle cx="50" cy="50" r="41" fill="#ffffff" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#1e7a46" strokeWidth="1" />
      <g fill="none" stroke="#c4262e" strokeLinecap="round" strokeLinejoin="round">
        {/* H — two forward-leaning stems */}
        <path d="M37 26 C36 40 33 56 28 73" strokeWidth="6.5" />
        <path d="M55 24 C54 40 51 57 47 73" strokeWidth="6.5" />
        {/* sweeping crossbar that carries on into the t */}
        <path d="M21 52 C33 46 50 45 63 47 C70 48 76 46 80 43" strokeWidth="4" />
        {/* t */}
        <path d="M70 31 C68 44 65 57 64 66 C63 73 68 75 75 69" strokeWidth="5.5" />
        {/* the small dashes from the original mark */}
        <path d="M62 36 L67 34.5" strokeWidth="2.5" />
        <path d="M24 34 L29 33" strokeWidth="2.5" />
      </g>
    </svg>
  );
}
