import type { NextRequest } from "next/server";
import { parseOrderNumber } from "@/lib/filters";
import { kanbanStatusQuerySchema, searchParamsToObject } from "@/lib/validation/test-api";
import { errorResponse, jsonResponse } from "@/server/api-response";
import { getKanbanOrderStatus, getKanbanSummary } from "@/server/queries/test-api";

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

// GET /api/test/kanban-status?order=OM-00042   → estado de ese pedido
// GET /api/test/kanban-status?id=ord_0042      → lo mismo, por id
// GET /api/test/kanban-status                  → resumen de todas las columnas
export async function GET(request: NextRequest) {
  const startedAt = performance.now();

  const parsed = kanbanStatusQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
  if (!parsed.success) {
    return errorResponse("Parámetros inválidos", startedAt, 400, parsed.error.issues.map((issue) => issue.message));
  }
  const { order, id } = parsed.data;

  try {
    if (!order && !id) return jsonResponse(await getKanbanSummary(), startedAt);

    let where: { number: number } | { id: string };
    if (id) {
      where = { id };
    } else {
      const number = parseOrderNumber(order!);
      if (number === null) return errorResponse("order debe ser un número de pedido, por ejemplo OM-00042", startedAt, 400);
      where = { number };
    }

    const result = await getKanbanOrderStatus(where);
    if (!result) return errorResponse("No existe ese pedido", startedAt, 404);
    return jsonResponse({ order: result }, startedAt);
  } catch (error) {
    console.error("[api/test/kanban-status]", error);
    return errorResponse("No se pudo consultar el tablero", startedAt, 500);
  }
}
