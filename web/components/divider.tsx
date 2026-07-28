import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
}

/**
 * A simple horizontal divider line matching Figma's divider component.
 */
export function Divider({ className }: DividerProps) {
  return (
    <hr
      className={cn("w-full border-0 border-t border-divider", className)}
      role="separator"
    />
  );
}
