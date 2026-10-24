import { KANBAN_COLUMN_LIMIT, type KanbanColumn } from "@/lib/kanban";
import { ORDER_STATUSES } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export async function getKanbanBoard(): Promise<KanbanColumn[]> {
  const [counts, ...columns] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ...ORDER_STATUSES.map((status) =>
      prisma.order.findMany({
        where: { status },
        // Lo que se movió o actualizó al último queda hasta arriba.
        orderBy: [{ updatedAt: "desc" }, { number: "desc" }],
        take: KANBAN_COLUMN_LIMIT,
        select: {
          id: true,
          number: true,
          totalCents: true,
          createdAt: true,
          customer: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
    ),
  ]);

  const totals = new Map(counts.map((row) => [row.status, row._count._all]));

  return ORDER_STATUSES.map((status, index) => ({
    status,
    total: totals.get(status) ?? 0,
    cards: columns[index].map((order) => ({
      id: order.id,
      number: order.number,
      customerName: order.customer.name,
      totalCents: order.totalCents,
      itemCount: order._count.items,
      createdAt: order.createdAt,
    })),
  }));
}