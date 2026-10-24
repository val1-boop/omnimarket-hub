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
  variant?: "default" | "outline";
  size?: "default" | "sm";
};

// Cambia de tienda y recarga la página completa: todo (encabezado, números, tablas) se vuelve a
// pedir al servidor ya con la tienda nueva, sin mezclar nada de la anterior.
export function StoreSwitchButton({ to, label, variant = "outline", size = "default" }: StoreSwitchButtonProps) {
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
    <Button type="button" variant={variant} size={size} onClick={onClick} disabled={pending}>
      {pending ? <SavingSkeleton className="w-28 bg-slate-300" label="Cambiando de tienda…" /> : label}
    </Button>
  );
}
