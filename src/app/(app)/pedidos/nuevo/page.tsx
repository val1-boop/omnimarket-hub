import { BackLink } from "@/components/back-link";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function NuevoPedidoPage() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      select: { id: true, name: true, priceCents: true, costCents: true },
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
      <OrderForm customers={customers} products={products} />
    </>
  );
}