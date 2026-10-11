"use client";

import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full px-3 py-2.5 rounded-md border bg-surface text-fg text-base",
          "placeholder:text-fg-subtle",
          "transition-colors resize-y min-h-[88px]",
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

Textarea.displayName = "Textarea";