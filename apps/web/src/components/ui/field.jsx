import { cn } from "../../lib/utils.js";

export function Field({ label, hint, error, className, children }) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200", className)}>
      <span>{label}</span>
      {children}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
      {!error && hint && <span className="text-xs font-normal text-neutral-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white dark:disabled:bg-neutral-900";
