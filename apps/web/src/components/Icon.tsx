/** Ícone padrão do design system HAM (Material Symbols Outlined, via Google Fonts).
 * Nunca use SVG avulso ou emoji para ícones de UI — use este componente.
 * Nomes em https://fonts.google.com/icons (ex.: "search", "arrow_forward", "progress_activity"). */
export function Icon({
  name,
  className = '',
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined select-none align-middle ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
      aria-hidden
    >
      {name}
    </span>
  );
}
