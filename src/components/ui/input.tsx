import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white placeholder:text-stone-500 outline-none transition focus-visible:border-orange-400",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
