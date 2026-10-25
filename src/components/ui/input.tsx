import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const fieldClassName =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink-900 placeholder:text-slate-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-lilac-200 aria-invalid:border-rose-500 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldClassName, "pr-8", className)} {...props} />;
}