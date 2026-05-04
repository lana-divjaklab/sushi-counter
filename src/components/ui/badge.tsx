import type * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "border-coral/20 bg-coral/10 text-coral",
  matcha: "border-matcha/20 bg-matcha/10 text-matcha-dark",
  tamago: "border-tamago/30 bg-tamago/10 text-amber-700",
  charcoal: "border-stone-300 bg-stone-100 text-stone-600",
} as const;

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof badgeVariants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
