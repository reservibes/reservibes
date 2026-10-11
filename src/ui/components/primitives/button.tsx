"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  // Base: comunes a todas las variantes
  "inline-flex items-center justify-center gap-2 font-medium transition-colors select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground shadow-accent hover:bg-accent-hover active:scale-[0.98]",
        secondary:
          "bg-fg text-fg-inverted hover:bg-fg-muted active:scale-[0.98]",
        outline:
          "border-2 border-fg text-fg hover:bg-fg hover:text-fg-inverted active:scale-[0.98]",
        ghost:
          "text-fg hover:bg-surface-2 active:scale-[0.98]",
        danger:
          "bg-error text-white hover:opacity-90 active:scale-[0.98]",
        link:
          "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-5 text-base rounded-md",
        lg: "h-13 px-6 text-lg rounded-lg",
        icon: "h-11 w-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";