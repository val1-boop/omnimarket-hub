import { FlaskConical, Store } from "lucide-react";
import { StoreSwitchButton } from "@/components/layout/store-switch-button";
import { cn } from "@/lib/utils";

export type ActiveStore = { name: string; isDemo: boolean };

// Franja debajo del encabezado: dice en qué tienda estás y permite cambiarte.
export function StoreBar({ store }: { store: ActiveStore }) {
  return (
    <div
      role="region"
      aria-label="Tienda activa"
      data-testid="store-bar"
      className={cn("border-b", store.isDemo ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-lilac-50")}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="flex items-start gap-2 text-ink-900 sm:items-center">
          {store.isDemo ? (
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 sm:mt-0" aria-hidden="true" />
          ) : (
            <Store className="mt-0.5 h-4 w-4 shrink-0 text-lilac-700 sm:mt-0" aria-hidden="true" />
          )}
          {store.isDemo ? (
            <span>
              <strong>Tienda de demostración:</strong> datos de ejemplo que comparten todos los que entran. No son
              ventas reales y se pueden restablecer en cualquier momento.
            </span>
          ) : (
            <span>
              <strong>Mi tienda:</strong> solo tú ves lo que registras aquí.
            </span>
          )}
        </p>
        <div className="shrink-0">
          <StoreSwitchButton
            to={store.isDemo ? "mia" : "demo"}
            label={store.isDemo ? "Volver a mi tienda" : "Ver la tienda de demostración"}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
