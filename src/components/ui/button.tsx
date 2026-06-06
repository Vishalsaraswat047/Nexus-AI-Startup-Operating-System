import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "solid", size = "md", children, ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";
    
    let variantStyles = "";
    if (variant === "solid") {
      variantStyles = "bg-primary text-on-primary hover:bg-primary/90 shadow-sm";
    } else if (variant === "outline") {
      variantStyles = "border border-border bg-card text-on-surface hover:bg-muted";
    } else if (variant === "ghost") {
      variantStyles = "text-on-surface hover:bg-[#1C1C1E]/50";
    }

    let sizeStyles = "";
    if (size === "sm") {
      sizeStyles = "h-8 px-3 text-xs";
    } else if (size === "md") {
      sizeStyles = "h-11 px-6 text-sm";
    } else if (size === "lg") {
      sizeStyles = "h-14 px-8 text-base";
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
