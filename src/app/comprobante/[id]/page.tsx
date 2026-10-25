import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/orders/status-badge";
import { PrintButton } from "@/components/receipt/print-button";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate, formatNumber, formatOrderNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/server/store";

type ComprobantePageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Comprobante de pedido · OmniMarket" };

// Comprobante del pedido para imprimir o guardar en PDF. Va fuera del marco de la app
// (sin menú ni pie de página) para que la hoja salga limpia.
export default async function ComprobantePage({ params }: ComprobantePageProps) {
  const { id } = await params;
  const { store } = await requireStoreContext();
  // Solo se encuentra si el pedido es de la tienda con la que estás trabajando.
  const order = await prisma.order.findFirst({
    where: { id, storeId: store.id },
    include: {
      customer: { select: { name: true, city: true, email: true } },
      items: { include: { product: { select: { name: true, sku: true } } }, orderBy: { product: { name: "asc" } } },
    },
  });
  if (!order) notFound();

  const number = formatOrderNumber(order.number);
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      {/* Barra de acciones: no sale en la hoja impresa */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/pedidos/${order.id}`} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          Volver al pedido
        </Link>
        <PrintButton />
      </div>

      <article
        className="keep-light rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none"
        aria-label={`Comprobante del pedido ${number}`}
        data-testid="receipt"
      >
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <Logo />
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lilac-700">Comprobante de pedido</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink-900">{number}</p>
            <p className="text-sm text-slate-600">{formatDate(order.createdAt)}</p>
            <div className="mt-2 sm:flex sm:justify-end">
              <StatusBadge status={order.status} />
            </div>
          </div>
        </header>

        <section className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">Cliente</p>
            <p className="mt-1 font-medium text-ink-900">{order.customer.name}</p>
            <p className="text-sm text-slate-600">{order.customer.city}</p>
            {order.customer.email && <p className="text-sm text-slate-600">{order.customer.email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold text-slate-500">Tienda</p>
            <p className="mt-1 font-medium text-ink-900">{store.name}</p>
          </div>
        </section>

        <table className="mt-6 w-full text-left text-sm" data-testid="receipt-lines">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th scope="col" className="pb-2 font-semibold">Producto</th>
              <th scope="col" className="pb-2 text-right font-semibold">Cantidad</th>
              <th scope="col" className="pb-2 text-right font-semibold">Precio</th>
              <th scope="col" className="pb-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-3">
                  <p className="font-medium text-ink-900">{item.product.name}</p>
                  <p className="font-mono text-xs text-slate-500">{item.product.sku}</p>
                </td>
                <td className="py-3 text-right text-slate-700">{formatNumber(item.quantity)}</td>
                <td className="py-3 text-right text-slate-700">{formatCurrency(item.unitPriceCents)}</td>
                <td className="py-3 text-right font-medium text-ink-900">{formatCurrency(item.unitPriceCents * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink-900 pt-4">
          <span className="text-sm text-slate-600">Total · {pieces === 1 ? "1 pieza" : `${formatNumber(pieces)} piezas`}</span>
          <span className="font-display text-2xl font-extrabold text-ink-900" data-testid="receipt-total">
            {formatCurrency(order.totalCents)}
          </span>
        </div>

        <footer className="mt-10 space-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>Precios en pesos mexicanos (MXN), los del día de la venta.</p>
          <p>Este comprobante es solo un resumen del pedido: no es una factura ni un comprobante fiscal (CFDI).</p>
          {store.isDemo && <p>Pedido de la tienda de demostración: los datos son de ejemplo.</p>}
        </footer>
      </article>
    </main>
  );
}
