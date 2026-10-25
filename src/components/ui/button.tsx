import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[color,background-color,border-color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ink-900 text-white hover:bg-ink-800",
        accent: "bg-lilac-600 text-white hover:bg-lilac-700",
        // Verde lima: solo para la acción principal de una pantalla.
        lime: "bg-lima-300 text-ink-900 hover:bg-lima-400",
        outline: "border border-slate-300 bg-white text-ink-900 hover:border-ink-900",
        ghost: "text-ink-900 hover:bg-lilac-100",
        destructive: "bg-rose-600 text-white hover:bg-rose-700",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}