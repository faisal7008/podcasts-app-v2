"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** React Hook Form register return */
  registration?: Record<string, unknown>;
}

/**
 * Password input with show/hide toggle using Lucide eye icons.
 * Styled to match the existing Figma design system.
 */
export function PasswordInput({
  label,
  error,
  registration,
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block text-body font-bold text-text-dark mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={cn(
            "w-full rounded-[var(--radius-sm)] border bg-bg px-4 py-3 text-body text-text-primary",
            "placeholder:text-text-muted",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-surface-dark/30 focus:border-surface-dark",
            "dark:focus:ring-white/20 dark:focus:border-white/50",
            error
              ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
              : "border-border",
            className
          )}
          {...registration}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition-colors p-1"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff size={18} strokeWidth={2} />
          ) : (
            <Eye size={18} strokeWidth={2} />
          )}
        </button>
      </div>
      {error && (
        <p className="text-[13px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
