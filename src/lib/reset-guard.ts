// Reglas para que POST /api/test/reset-data no se pueda usar de forma indebida
// (borrar los datos una y otra vez, o desde una página web ajena).

/** Espera entre reinicios en producción, si no se configura otra con RESET_COOLDOWN_SECONDS. */
export const DEFAULT_RESET_COOLDOWN_SECONDS = 15;

/** Segundos que hay que esperar entre un reinicio y otro. */
export function getResetCooldownSeconds(env: Record<string, string | undefined> = process.env): number {
  const configured = env.RESET_COOLDOWN_SECONDS;
  if (configured !== undefined && /^\d+$/.test(configured)) return Number(configured);
  return env.NODE_ENV === "production" ? DEFAULT_RESET_COOLDOWN_SECONDS : 0;
}

/** Cuántos segundos faltan para poder reiniciar otra vez (0 = ya se puede). */
export function getRetryAfterSeconds(lastResetAt: Date | null, now: Date, cooldownSeconds: number): number {
  if (!lastResetAt) return 0;
  const remainingMs = lastResetAt.getTime() + cooldownSeconds * 1000 - now.getTime();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

/**
 * true si la petición la manda otra página web (por ejemplo un formulario oculto en un sitio ajeno).
 * curl, Postman, PowerShell y Playwright no mandan el encabezado Origin, así que sí pueden usarlo.
 */
export function isCrossSiteRequest(headers: Headers): boolean {
  if (headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
