import type { OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/order-status";

export const ORDERS_PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Si algo viene mal escrito en la dirección, se usa el valor por defecto en lugar de fallar.
const orderFiltersSchema = z.object({
  q: z.string().trim().max(60).catch(""),
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type OrderFilters = { q: string; status?: OrderStatus; page: number };

/** Lee los filtros de la dirección: /pedidos?q=ana&status=PENDING&page=2 */
export function parseOrderFilters(params: SearchParams): OrderFilters {
  return orderFiltersSchema.parse({
    q: first(params.q),
    status: first(params.status) || undefined,
    page: first(params.page),
  });
}

/** "OM-00042", "om42" o "42" → 42. Cualquier otro texto → null. */
export function parseOrderNumber(text: string): number | null {
  const match = text.trim().match(/^(?:om-?)?0*(\d{1,9})$/i);
  return match ? Number(match[1]) : null;
}

/** Convierte los filtros en la condición de búsqueda de la base de datos. */
export function buildOrderWhere(filters: Pick<OrderFilters, "q" | "status">): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (filters.status) where.status = filters.status;

  const query = filters.q.trim();
  if (query) {
    // Un número de pedido busca ese pedido; cualquier otro texto busca por nombre del cliente.
    const orderNumber = parseOrderNumber(query);
    where.OR =
      orderNumber !== null
        ? [{ number: orderNumber }]
        : [{ customer: { name: { contains: query, mode: "insensitive" } } }];
  }
  return where;
}

/** Quita acentos y mayúsculas para comparar textos: "Electrónica" → "electronica". */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

type FilterableProduct = { name: string; sku: string; category: string };

/** Filtra productos por categoría y por texto (nombre o SKU), sin importar acentos. */
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  filters: { category?: string | null; query?: string },
): T[] {
  const query = normalizeText(filters.query ?? "");
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (!query) return true;
    return normalizeText(product.name).includes(query) || normalizeText(product.sku).includes(query);
  });
}