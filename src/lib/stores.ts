// Tiendas: cada usuario tiene "Mi tienda" (privada, empieza vacía) y puede cambiarse
// a la "Tienda de demostración" (datos de ejemplo compartidos, se pueden restablecer).

/** Id fijo de la tienda de demostración (lo crea la migración y lo usa reset-data). */
export const DEMO_STORE_ID = "tienda-demo";
export const DEMO_STORE_NAME = "Tienda de demostración";
export const OWN_STORE_NAME = "Mi tienda";

/** Cookie que recuerda qué tienda está viendo la persona. Solo guarda "mia" o "demo". */
export const STORE_COOKIE = "omnimarket-tienda";

export type StoreChoice = "mia" | "demo";

/** Cualquier valor raro o vacío se toma como "mia": nunca se elige un id de tienda desde el navegador. */
export function parseStoreChoice(value: string | undefined | null): StoreChoice {
  return value === "demo" ? "demo" : "mia";
}
