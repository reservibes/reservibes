"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Panel que sube desde abajo. Es la forma natural de mostrar contenido
 * en mobile (en lugar de un modal que queda flotando en el centro).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center sm:justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sheetRef}
        className={cn(
          "w-full sm:max-w-lg bg-surface border-t sm:border border-border",
          "rounded-t-2xl sm:rounded-xl shadow-lg",
          "max-h-[90vh] flex flex-col",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Handle visual (solo mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        {title && (
          <div className="px-6 pt-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}