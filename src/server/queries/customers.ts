import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CUSTOMERS_PAGE_SIZE = 20;

export type CustomerRow = {
  id: string;
  name: string;
  city: string;
  email: string | null;
  orderCount: number;
  /** Lo que ha comprado, sin contar pedidos cancelados. */
  spentCents: number;
  lastOrderAt: Date | null;
};

// Clientes de la tienda con cuántos pedidos tienen y cuánto han comprado.
// Primero los que más han comprado. La búsqueda es por nombre, ciudad o correo.
export async function getCustomersPage(storeId: string, query: string, page: number) {
  const search = query.trim();
  // % y _ se buscan como letras normales, no como comodines.
  const like = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const filter = search
    ? Prisma.sql`AND (c.name ILIKE ${like} OR c.city ILIKE ${like} OR COALESCE(c.email, '') ILIKE ${like})`
    : Prisma.empty;

  const [[{ total }], rows] = await Promise.all([
    prisma.$queryRaw<[{ total: number }]>`
      SELECT COUNT(*)::int AS total FROM "Customer" c WHERE c."storeId" = ${storeId} ${filter}`,
    prisma.$queryRaw<CustomerRow[]>`
      SELECT c.id, c.name, c.city, c.email,
             COUNT(o.id)::int AS "orderCount",
             -- float8 guarda enteros exactos hasta 9 mil billones: alcanza para cualquier total en centavos.
             COALESCE(SUM(o."totalCents") FILTER (WHERE o.status <> 'CANCELLED'), 0)::float8 AS "spentCents",
             MAX(o."createdAt") AS "lastOrderAt"
      FROM "Customer" c
      LEFT JOIN "Order" o ON o."customerId" = c.id AND o."storeId" = ${storeId}
      WHERE c."storeId" = ${storeId} ${filter}
      GROUP BY c.id
      ORDER BY "spentCents" DESC, c.name ASC
      LIMIT ${CUSTOMERS_PAGE_SIZE} OFFSET ${(page - 1) * CUSTOMERS_PAGE_SIZE}`,
  ]);

  return { total, pageCount: Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE)), rows };
}
