"use client";

import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full h-11 px-3 rounded-md border bg-surface text-fg text-base",
          "placeholder:text-fg-subtle",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          invalid
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-border hover:border-border-strong",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";