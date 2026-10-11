import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind, resolviendo conflictos.
 * Uso: cn("px-4 py-2", condition && "bg-accent", "px-6") → "py-2 bg-accent px-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}