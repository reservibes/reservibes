import { cn } from "@/shared/lib/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Placeholder con shimmer animado mientras carga el contenido real.
 * Usa una animación CSS definida en globals.css (reservibes-shimmer).
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("reservibes-skeleton rounded-md", className)}
      {...props}
    />
  );
}