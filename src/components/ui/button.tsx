import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-coral/50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-coral text-white shadow-lg shadow-coral/30 hover:bg-coral-light active:bg-coral",
        secondary: "bg-matcha text-white shadow-md shadow-matcha/25 hover:bg-matcha-dark",
        outline: "border-2 border-coral/30 text-charcoal bg-white hover:bg-coral/5 hover:border-coral/50",
        ghost: "text-stone-500 hover:bg-stone-100 hover:text-charcoal",
        destructive: "bg-rose-400 text-white hover:bg-rose-500",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-base rounded-[20px]",
        icon: "size-11 rounded-2xl",
        "icon-sm": "size-9 rounded-xl",
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
