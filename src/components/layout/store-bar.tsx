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
      {/* En celular cabe en una sola fila: texto corto a la izquierda y el botón a la derecha. */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-sm md:px-8 md:py-2.5">
        <p className="flex min-w-0 items-center gap-2 text-ink-900">
          {store.isDemo ? (
            <FlaskConical className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          ) : (
            <Store className="h-4 w-4 shrink-0 text-lilac-700" aria-hidden="true" />
          )}
          {store.isDemo ? (
            <span className="min-w-0">
              {/* Celular: versión corta. Computadora: la explicación completa. */}
              <span className="sm:hidden">
                <strong>Demostración</strong> · datos de ejemplo
              </span>
              <span className="max-sm:hidden">
                <strong>Tienda de demostración:</strong> datos de ejemplo que comparten todos los que entran. No son
                ventas reales y se pueden restablecer en cualquier momento.
              </span>
            </span>
          ) : (
            <span className="min-w-0">
              <strong>Mi tienda</strong>
              <span className="sm:hidden"> · solo tú la ves</span>
              <span className="max-sm:hidden">: solo tú ves lo que registras aquí.</span>
            </span>
          )}
        </p>
        <div className="shrink-0">
          <StoreSwitchButton
            to={store.isDemo ? "mia" : "demo"}
            label={store.isDemo ? "Volver a mi tienda" : "Ver la tienda de demostración"}
            shortLabel={store.isDemo ? "Mi tienda" : "Ver demostración"}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
