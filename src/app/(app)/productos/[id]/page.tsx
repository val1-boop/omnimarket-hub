import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/orders/status-badge";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { calculateMargin, centsToPesos } from "@/lib/finance";
import { formatCurrency, formatDate, formatNumber, formatOrderNumber, formatPercent } from "@/lib/format";
import { holdsStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import { PRODUCT_CATEGORIES } from "@/lib/validation/product";
import { getProductSales } from "@/server/queries/product-sales";
import { requireStoreContext } from "@/server/store";

type EditarProductoPageProps = { params: Promise<{ id: string }> };

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
  const { id } = await params;
  const { store } = await requireStoreContext();
  // Solo se encuentra si el producto es de la tienda con la que estás trabajando.
  const product = await prisma.product.findFirst({ where: { id, storeId: store.id } });
  if (!product) notFound();

  const sales = await getProductSales(product.id, store.id);
  const category = PRODUCT_CATEGORIES.find((item) => item === product.category) ?? PRODUCT_CATEGORIES[0];

  return (
    <>
      <BackLink href="/productos">Volver a productos</BackLink>
      <PageHeader eyebrow={product.sku} title={product.name} description="Mira cómo se vende y corrige sus datos." />

      {/* Cómo se vende: con los precios del día de cada venta y sin contar pedidos cancelados */}
      <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="product-stats">
        <Stat label="Piezas vendidas" value={formatNumber(sales.pieces)} detail={sales.soldOrders === 1 ? "En 1 pedido" : `En ${formatNumber(sales.soldOrders)} pedidos`} />
        <Stat label="Vendiste" value={formatCurrency(sales.revenueCents)} detail="Sin contar cancelados" />
        <Stat
          label="Te dejó"
          value={sales.pieces > 0 ? formatCurrency(sales.profitCents) : "—"}
          detail={sales.pieces > 0 ? `Margen de ${formatPercent(calculateMargin(sales.revenueCents, sales.revenueCents - sales.profitCents))}` : "Sin ventas para calcularlo"}
        />
        <Stat label="Última venta" value={sales.lastSoldAt ? formatDate(sales.lastSoldAt) : "—"} detail={sales.lastSoldAt ? undefined : "Todavía no se vende"} />
      </dl>

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          category,
          price: centsToPesos(product.priceCents),
          cost: centsToPesos(product.costCents),
          stock: product.stock,
          imageUrl: productImageUrl(product),
        }}
      />

      <Card className="mt-6">
        <CardContent>
          <CardTitle>Pedidos con este producto</CardTitle>
          {sales.recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500" data-testid="product-no-orders">
              Todavía no aparece en ningún pedido.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100" data-testid="product-orders">
              {sales.recent.map((order) => (
                <li key={order.id}>
                  <Link href={`/pedidos/${order.id}`} className="group flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-semibold text-ink-900">{formatOrderNumber(order.number)}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {order.customerName} · {formatDate(order.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={order.status} />
                    <span
                      className={
                        holdsStock(order.status)
                          ? "w-28 shrink-0 text-right text-sm text-ink-900"
                          : "w-28 shrink-0 text-right text-sm text-slate-400 line-through"
                      }
                    >
                      {formatNumber(order.quantity)} × {formatCurrency(order.unitPriceCents)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {sales.appearsIn > sales.recent.length && (
            <p className="mt-3 text-xs text-slate-500">
              Se muestran los {formatNumber(sales.recent.length)} más recientes de {formatNumber(sales.appearsIn)} pedidos.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-display text-lg font-extrabold text-ink-900">{value}</dd>
      {detail && <dd className="text-xs text-slate-500">{detail}</dd>}
    </div>
  );
}