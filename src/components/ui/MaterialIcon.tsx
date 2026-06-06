interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export default function MaterialIcon({ name, className = '', filled = false }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  );
}
