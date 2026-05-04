import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-2 text-sm text-charcoal placeholder:text-stone-400 outline-none transition focus-visible:border-coral focus-visible:ring-2 focus-visible:ring-coral/20",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
