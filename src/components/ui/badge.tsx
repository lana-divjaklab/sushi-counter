import type * as React from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-200",
        className,
      )}
      {...props}
    />
  );
}
