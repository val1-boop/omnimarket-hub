import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { CustomerForm } from "@/components/customers/customer-form";
import { StatusBadge } from "@/components/orders/status-badge";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { averageTicketFromTotals } from "@/lib/finance";
import { formatCurrency, formatDate, formatNumber, formatOrderNumber } from "@/lib/format";
import { holdsStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/server/store";

type ClientePageProps = { params: Promise<{ id: string }> };

// Se muestran sus pedidos más recientes; los números de arriba sí cuentan todos.
const HISTORY_LIMIT = 50;

export default async function ClientePage({ params }: ClientePageProps) {
  const { id } = await params;
  const { store } = await requireStoreContext();
  // Solo se encuentra si el cliente es de la tienda con la que estás trabajando.
  const customer = await prisma.customer.findFirst({ where: { id, storeId: store.id } });
  if (!customer) notFound();

  const where = { customerId: customer.id, storeId: store.id };
  const [orders, totals, orderCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      take: HISTORY_LIMIT,
      select: { id: true, number: true, status: true, totalCents: true, createdAt: true, _count: { select: { items: true } } },
    }),
    prisma.order.aggregate({ where: { ...where, status: { not: "CANCELLED" } }, _sum: { totalCents: true }, _count: { _all: true } }),
    prisma.order.count({ where }),
  ]);
  const spentCents = totals._sum.totalCents ?? 0;
  const paidCount = totals._count._all;

  return (
    <>
      <BackLink href="/clientes">Volver a clientes</BackLink>
      <PageHeader
        eyebrow={customer.city}
        title={customer.name}
        description={customer.email ?? undefined}
        actions={
          <Link href={`/pedidos/nuevo?cliente=${customer.id}`} className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Nuevo pedido para este cliente
          </Link>
        }
      />

      <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="customer-stats">
        <Stat label="Ha comprado" value={formatCurrency(spentCents)} />
        <Stat label="Pedidos" value={formatNumber(orderCount)} />
        <Stat
          label="Gasta en promedio"
          value={paidCount > 0 ? formatCurrency(averageTicketFromTotals(spentCents, paidCount)) : "—"}
        />
        <Stat label="Último pedido" value={orders[0] ? formatDate(orders[0].createdAt) : "—"} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardContent>
            <CardTitle>Sus pedidos</CardTitle>
            {orders.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500" data-testid="customer-no-orders">
                Todavía no tiene pedidos. Cuando le vendas algo, aparecerá aquí.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100" data-testid="customer-orders">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link href={`/pedidos/${order.id}`} className="group flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs font-semibold text-ink-900">{formatOrderNumber(order.number)}</span>
                        <span className="block text-xs text-slate-500">
                          {formatDate(order.createdAt)} ·{" "}
                          {order._count.items === 1 ? "1 producto" : `${formatNumber(order._count.items)} productos`}
                        </span>
                      </span>
                      <StatusBadge status={order.status} />
                      <span
                        className={
                          holdsStock(order.status)
                            ? "w-24 shrink-0 text-right font-semibold text-ink-900"
                            : "w-24 shrink-0 text-right text-slate-400 line-through"
                        }
                      >
                        {formatCurrency(order.totalCents)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {orderCount > HISTORY_LIMIT && (
              <p className="mt-3 text-xs text-slate-500">Se muestran sus {HISTORY_LIMIT} pedidos más recientes.</p>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 font-display text-base font-bold text-ink-900">Sus datos</h2>
          <CustomerForm
            customer={{ id: customer.id, name: customer.name, city: customer.city, email: customer.email, orderCount }}
          />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-display text-lg font-extrabold text-ink-900">{value}</dd>
    </div>
  );
}
