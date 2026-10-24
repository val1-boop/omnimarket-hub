import type { NextRequest } from "next/server";
import { analyticsQuerySchema, searchParamsToObject } from "@/lib/validation/test-api";
import { errorResponse, jsonResponse } from "@/server/api-response";
import { getAnalyticsPage } from "@/server/queries/test-api";

// Siempre datos al momento (sin caché) y en la misma región que la base de datos (Washington D.C.).
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

// GET /api/test/analytics?page=1&limit=50
export async function GET(request: NextRequest) {
  const startedAt = performance.now();

  const parsed = analyticsQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
  if (!parsed.success) {
    return errorResponse("Parámetros inválidos", startedAt, 400, parsed.error.issues.map((issue) => issue.message));
  }

  try {
    const result = await getAnalyticsPage(parsed.data);
    return jsonResponse(result, startedAt);
  } catch (error) {
    console.error("[api/test/analytics]", error);
    return errorResponse("No se pudieron calcular las métricas", startedAt, 500);
  }
}
