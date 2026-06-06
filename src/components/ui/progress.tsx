import * as React from "react";

export interface ProgressProps {
  value?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value = 0, className = "" }) => {
  return (
    <div className={`relative w-full h-2 overflow-hidden rounded-full bg-surface-container-low border border-outline-variant/40 ${className}`}>
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};
