import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProductCatalog } from "@/components/products/product-catalog";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import { requireStoreContext } from "@/server/store";

export default async function ProductosPage() {
  const { store } = await requireStoreContext();
  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    select: { id: true, sku: true, name: true, category: true, priceCents: true, costCents: true, stock: true, imageUpdatedAt: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        eyebrow="Tu catálogo"
        title="Productos"
        description="Lo que vendes, a cuánto lo vendes y cuánto te deja cada uno."
        actions={
          <Link href="/productos/nuevo" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Agregar producto
          </Link>
        }
      />
      <ProductCatalog products={products.map(({ imageUpdatedAt, ...product }) => ({ ...product, imageUrl: productImageUrl({ id: product.id, imageUpdatedAt }) }))} />
    </>
  );
}