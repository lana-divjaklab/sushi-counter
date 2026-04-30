import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-400",
        secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
        ghost: "text-stone-200 hover:bg-white/10",
        destructive: "bg-rose-500 text-white hover:bg-rose-400",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3",
        lg: "h-14 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button };
