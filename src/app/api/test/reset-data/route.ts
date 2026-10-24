import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResetCooldownSeconds, isCrossSiteRequest } from "@/lib/reset-guard";
import { errorResponse, jsonResponse } from "@/server/api-response";
import { claimResetSlot, releaseResetSlot } from "@/server/reset-cooldown";
import { seedDatabase } from "@/server/seed";

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

// POST /api/test/reset-data
// Regresa productos, clientes y pedidos al conjunto de prueba conocido (no toca usuarios ni sesiones).
// Protecciones: no acepta peticiones de otras páginas web y hay que esperar unos segundos entre reinicios.
export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  if (isCrossSiteRequest(request.headers)) {
    return errorResponse("No se pueden restablecer los datos desde otra página web", startedAt, 403);
  }

  let claimed = false;
  try {
    const cooldownSeconds = getResetCooldownSeconds();
    const slot = await claimResetSlot(prisma, cooldownSeconds);
    if (!slot.ok) {
      const response = errorResponse(
        `Los datos se acaban de restablecer. Espera ${slot.retryAfterSeconds} s y vuelve a intentarlo`,
        startedAt,
        429,
      );
      response.headers.set("Retry-After", String(slot.retryAfterSeconds));
      return response;
    }

    claimed = true;
    const counts = await seedDatabase(prisma);
    return jsonResponse(
      {
        ok: true,
        message: "Datos de prueba restablecidos",
        counts,
        untouched: "Usuarios, cuentas y sesiones no se tocan",
        cooldownSeconds,
      },
      startedAt,
    );
  } catch (error) {
    console.error("[api/test/reset-data]", error);
    // Si el reinicio falló no se cambió nada: se libera el turno para poder intentarlo de nuevo sin esperar.
    if (claimed) {
      await releaseResetSlot(prisma).catch((releaseError) =>
        console.error("[api/test/reset-data] no se pudo liberar el turno", releaseError),
      );
    }
    return errorResponse("No se pudieron restablecer los datos. No se cambió nada; puedes intentarlo de nuevo", startedAt, 500);
  }
}
