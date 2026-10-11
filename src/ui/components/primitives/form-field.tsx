import { cn } from "@/shared/lib/cn";
import { Label } from "./label";

export type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Envuelve un input/textarea con label, hint y mensaje de error.
 * NO valida nada por su cuenta: recibe el error desde afuera (por ejemplo,
 * desde Zod o desde una respuesta del servidor).
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}