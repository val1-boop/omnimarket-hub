import { NextResponse } from "next/server";

/**
 * Respuesta JSON de los endpoints de prueba. Incluye cuánto tardó el servidor
 * (en el cuerpo y en el encabezado Server-Timing, visible en la pestaña Network).
 */
export function jsonResponse(body: Record<string, unknown>, startedAt: number, status = 200) {
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
  return NextResponse.json(
    { ...body, meta: { generatedAt: new Date().toISOString(), durationMs } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Server-Timing": `app;dur=${durationMs}`,
      },
    },
  );
}

export function errorResponse(message: string, startedAt: number, status: number, details?: unknown) {
  return jsonResponse({ error: message, ...(details ? { details } : {}) }, startedAt, status);
}
