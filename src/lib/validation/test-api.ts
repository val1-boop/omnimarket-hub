import { z } from "zod";

// Parámetros de GET /api/test/analytics?page=1&limit=50
export const analyticsQuerySchema = z.object({
  page: z.coerce
    .number({ error: "page debe ser un número" })
    .int("page debe ser un número entero")
    .min(1, "page empieza en 1")
    .default(1),
  limit: z.coerce
    .number({ error: "limit debe ser un número" })
    .int("limit debe ser un número entero")
    .min(1, "limit mínimo es 1")
    .max(100, "limit máximo es 100")
    .default(50),
});

// Parámetros de GET /api/test/kanban-status?order=OM-00042  (o ?id=ord_0042)
export const kanbanStatusQuerySchema = z.object({
  order: z.string().trim().min(1).max(20).optional(),
  id: z.string().trim().min(1).max(40).optional(),
});

/** Convierte URLSearchParams en objeto, ignorando parámetros vacíos. */
export function searchParamsToObject(params: URLSearchParams) {
  return Object.fromEntries([...params.entries()].filter(([, value]) => value !== ""));
}
