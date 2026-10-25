import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/server/store";

export default async function NuevoPedidoPage() {
  const { store } = await requireStoreContext();
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true, priceCents: true, costCents: true, stock: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <BackLink href="/pedidos">Volver a pedidos</BackLink>
      <PageHeader
        eyebrow="Venta nueva"
        title="Nuevo pedido"
        description="Elige al cliente, agrega lo que se lleva y listo. El total se calcula solo."
      />
      {products.length === 0 ? (
        // Sin productos no se puede armar un pedido: primero hay que registrar alguno.
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center" data-testid="order-needs-products">
          <p className="font-display text-base font-bold text-ink-900">
            Primero agrega un producto
          </p>
          <p className="mt-1 text-sm text-slate-500">Un pedido necesita al menos un producto de tu catálogo.</p>
          <Link href="/productos/nuevo" className={buttonVariants({ className: "mt-6" })}>
            Agregar mi primer producto
          </Link>
        </div>
      ) : (
        <OrderForm customers={customers} products={products} />
      )}
    </>
  );
}