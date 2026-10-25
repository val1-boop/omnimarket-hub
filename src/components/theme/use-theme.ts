"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

// Lee el modo actual del atributo data-theme de <html> y se entera cuando cambia.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function useTheme() {
  // En el servidor no se sabe el modo: se asume claro y se corrige al cargar.
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);

  const setTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Navegación privada o almacenamiento bloqueado: el modo cambia, pero no se recuerda.
    }
  };

  return { theme, setTheme };
}
