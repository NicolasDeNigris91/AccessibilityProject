import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, mono, className = "", id, ...rest },
  ref
) {
  const autoId = id ?? `in-${Math.random().toString(36).slice(2, 8)}`;
  const hintId = hint ? `${autoId}-hint` : undefined;
  const errorId = error ? `${autoId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={autoId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={autoId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error) || undefined}
        className={`rounded border ${error ? "border-severity-critical" : "border-line"} bg-surface px-3 py-2 text-ink placeholder:text-muted ${mono ? "font-mono" : ""} ${className}`}
        {...rest}
      />
      {hint && !error && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-xs text-severity-critical">
          {error}
        </span>
      )}
    </div>
  );
});
