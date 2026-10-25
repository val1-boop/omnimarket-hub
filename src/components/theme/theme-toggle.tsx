"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/use-theme";
import { cn } from "@/lib/utils";

// Botón para cambiar entre modo claro y oscuro. El ícono muestra el modo al que te vas a cambiar.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-ink-900 transition-[color,border-color,transform] hover:border-ink-900 active:scale-95 [&_svg]:size-[18px]",
        className,
      )}
    >
      {/* Los dos íconos van en el HTML y el CSS muestra el correcto, así no parpadea al cargar. */}
      <Moon className="dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </button>
  );
}
