import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  /** Render as h1, h2, or h3. Defaults to h2. */
  as?: "h1" | "h2" | "h3";
}

/**
 * Section heading matching Figma's "Heading" component.
 * 29px height with bold text.
 */
export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        "text-heading text-text-dark",
        className
      )}
    >
      {children}
    </Tag>
  );
}
