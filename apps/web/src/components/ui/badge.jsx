import { cn } from "../../lib/utils.js";

const variants = {
  default: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  paid: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  cancelled: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
};

export function Badge({ children, variant = "default", className }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize", variants[variant] ?? variants.default, className)}>
      {children}
    </span>
  );
}
