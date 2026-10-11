import { cn } from "@/shared/lib/cn";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-fg mb-1.5",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-accent ml-1">*</span>}
    </label>
  );
}