import { centsToCsvNumber, mexicoCityDateTime, toCsv } from "@/lib/csv";
import { buildOrderOrderBy, buildOrderWhere, parseOrderFilters } from "@/lib/filters";
import { formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { getStoreContext } from "@/server/store";

const HEADERS = [
  "Pedido",
  "Fecha",
  "Hora",
  "Cliente",
  "Ciudad",
  "Correo",
  "Paso",
  "Productos",
  "Piezas",
  "Total (MXN)",
  "Costo (MXN)",
  "Ganancia (MXN)",
];

// Descarga los pedidos de la tienda activa en CSV, con la misma búsqueda, paso y orden
// que se ven en la tabla (pero todos, no solo una página).
export async function GET(request: Request) {
  const context = await getStoreContext();
  if (!context) return new Response("Tu sesión se cerró. Vuelve a entrar para descargar tus pedidos.", { status: 401 });
  const { store } = context;

  const filters = parseOrderFilters(Object.fromEntries(new URL(request.url).searchParams));
  const orders = await prisma.order.findMany({
    where: { ...buildOrderWhere(filters), storeId: store.id },
    orderBy: buildOrderOrderBy(filters.sort),
    select: {
      number: true,
      status: true,
      createdAt: true,
      totalCents: true,
      costCents: true,
      customer: { select: { name: true, city: true, email: true } },
      items: { select: { quantity: true, product: { select: { name: true } } }, orderBy: { product: { name: "asc" } } },
    },
  });

  const rows = orders.map((order) => {
    const { date, time } = mexicoCityDateTime(order.createdAt);
    return [
      formatOrderNumber(order.number),
      date,
      time,
      order.customer.name,
      order.customer.city,
      order.customer.email ?? "",
      ORDER_STATUS_LABELS[order.status],
      order.items.map((item) => `${item.product.name} x${item.quantity}`).join("; "),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      centsToCsvNumber(order.totalCents),
      centsToCsvNumber(order.costCents),
      centsToCsvNumber(order.totalCents - order.costCents),
    ];
  });

  const today = mexicoCityDateTime(new Date()).date;
  const fileName = `pedidos-${store.isDemo ? "demostracion" : "mi-tienda"}-${today}.csv`;
  return new Response(toCsv(HEADERS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
