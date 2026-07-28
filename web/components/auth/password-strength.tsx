"use client";

import { cn } from "@/lib/utils";
import { getPasswordStrength, type PasswordStrength } from "@/lib/validations/auth";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  weak: { label: "Weak", color: "bg-red-500", bars: 1 },
  medium: { label: "Medium", color: "bg-amber-500", bars: 2 },
  strong: { label: "Strong", color: "bg-emerald-500", bars: 3 },
};

/**
 * Visual password strength indicator with color-coded bars.
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const config = strengthConfig[strength];

  return (
    <div className="mt-2">
      {/* Bars */}
      <div className="flex gap-1.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              bar <= config.bars ? config.color : "bg-divider"
            )}
          />
        ))}
      </div>
      {/* Label */}
      <p
        className={cn(
          "text-[12px] mt-1 font-medium transition-colors duration-300",
          strength === "weak" && "text-red-500",
          strength === "medium" && "text-amber-500",
          strength === "strong" && "text-emerald-500"
        )}
      >
        {config.label} password
      </p>
    </div>
  );
}
