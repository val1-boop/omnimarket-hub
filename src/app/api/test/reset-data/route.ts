import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/server/api-response";
import { seedDatabase } from "@/server/seed";

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

// POST /api/test/reset-data
// Regresa productos, clientes y pedidos al conjunto de prueba conocido (no toca usuarios ni sesiones).
export async function POST() {
  const startedAt = performance.now();
  try {
    const counts = await seedDatabase(prisma);
    return jsonResponse({ ok: true, message: "Datos de prueba restablecidos", counts }, startedAt);
  } catch (error) {
    console.error("[api/test/reset-data]", error);
    return errorResponse("No se pudieron restablecer los datos", startedAt, 500);
  }
}
