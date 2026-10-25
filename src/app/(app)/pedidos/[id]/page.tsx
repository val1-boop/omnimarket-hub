import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { OrderStatusControl } from "@/components/orders/order-status-control";
import { ProductVisual } from "@/components/products/product-visual";
import { StatusBadge } from "@/components/orders/status-badge";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { calculateMargin } from "@/lib/finance";
import { formatCurrency, formatDate, formatNumber, formatOrderNumber, formatPercent } from "@/lib/format";
import { holdsStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import { requireStoreContext } from "@/server/store";

type PedidoPageProps = { params: Promise<{ id: string }> };

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { id } = await params;
  const { store } = await requireStoreContext();
  // Solo se encuentra si el pedido es de la tienda con la que estás trabajando.
  const order = await prisma.order.findFirst({
    where: { id, storeId: store.id },
    include: {
      customer: { select: { id: true, name: true, city: true, email: true } },
      items: {
        include: { product: { select: { id: true, name: true, sku: true, category: true, imageUpdatedAt: true } } },
        orderBy: { product: { name: "asc" } },
      },
    },
  });
  if (!order) notFound();

  const profitCents = order.totalCents - order.costCents;
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <BackLink href="/pedidos">Volver a pedidos</BackLink>
      <PageHeader
        eyebrow={`Pedido del ${formatDate(order.createdAt)}`}
        title={formatOrderNumber(order.number)}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardContent>
            <CardTitle>Lo que se lleva</CardTitle>
            <ul className="mt-4 divide-y divide-slate-100" data-testid="order-lines">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start gap-4 py-4" data-testid="order-line">
                  <ProductVisual
                    name={item.product.name}
                    category={item.product.category}
                    imageUrl={productImageUrl(item.product)}
                    className="h-14 w-14 shrink-0 rounded-xl"
                    iconClassName="h-6 w-6"
                    sizes="56px"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/productos/${item.product.id}`}
                      className="font-medium text-ink-900 underline-offset-4 hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.product.category} · <span className="font-mono">{item.product.sku}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatNumber(item.quantity)} × {formatCurrency(item.unitPriceCents)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display font-extrabold text-ink-900">
                    {formatCurrency(item.unitPriceCents * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600">
                Total · {pieces === 1 ? "1 pieza" : `${formatNumber(pieces)} piezas`}
              </span>
              <span className="font-display text-2xl font-extrabold text-ink-900" data-testid="order-detail-total">
                {formatCurrency(order.totalCents)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Los precios son los del día de la venta: si después cambias un precio, este pedido no cambia.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <CardTitle>Cliente</CardTitle>
              <Link
                href={`/clientes/${order.customer.id}`}
                className="mt-3 block font-medium text-ink-900 underline-offset-4 hover:underline"
              >
                {order.customer.name}
              </Link>
              <p className="text-sm text-slate-500">{order.customer.city}</p>
              {order.customer.email && <p className="text-sm text-slate-500">{order.customer.email}</p>}
            </CardContent>
          </Card>

          <Card className="bg-lilac-50">
            <CardContent className="space-y-2 text-sm">
              <CardTitle>Lo que te deja</CardTitle>
              <Row label="Cobraste" value={formatCurrency(order.totalCents)} />
              <Row label="Te costó" value={formatCurrency(order.costCents)} />
              <Row label="Ganancia" value={formatCurrency(profitCents)} strong />
              <Row label="Margen" value={formatPercent(calculateMargin(order.totalCents, order.costCents))} />
              {order.status === "CANCELLED" && (
                <p className="pt-2 text-xs text-slate-500">Está cancelado: no cuenta en tus ventas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <CardTitle>Cambiar de paso</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                {holdsStock(order.status)
                  ? "Si lo cancelas, sus piezas regresan a tu inventario."
                  : "Si lo reactivas, sus piezas se vuelven a apartar del inventario."}
              </p>
              <OrderStatusControl id={order.id} status={order.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <span className={strong ? "font-display text-lg font-extrabold text-ink-900" : "font-medium text-ink-900"}>
        {value}
      </span>
    </div>
  );
}
