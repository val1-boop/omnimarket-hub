"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SavingSkeleton } from "@/components/ui/skeleton";
import { runAction } from "@/lib/run-action";
import type { StoreChoice } from "@/lib/stores";
import { switchStore } from "@/server/actions/store";

type StoreSwitchButtonProps = {
  to: StoreChoice;
  label: string;
  /** Texto corto para celular (el nombre completo se sigue leyendo en voz alta). */
  shortLabel?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
};

// Cambia de tienda y recarga la página completa: todo (encabezado, números, tablas) se vuelve a
// pedir al servidor ya con la tienda nueva, sin mezclar nada de la anterior.
export function StoreSwitchButton({ to, label, shortLabel, variant = "outline", size = "default", className }: StoreSwitchButtonProps) {
  const [pending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      try {
        await runAction(() => switchStore(to), "No pudimos cambiar de tienda. Revisa tu conexión.");
        window.location.reload();
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
      disabled={pending}
      aria-label={shortLabel ? label : undefined}
    >
      {pending ? (
        <SavingSkeleton className="w-28 bg-slate-300" label="Cambiando de tienda…" />
      ) : shortLabel ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="max-sm:hidden">{label}</span>
        </>
      ) : (
        label
      )}
    </Button>
  );
}
