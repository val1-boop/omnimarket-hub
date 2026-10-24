import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProductCatalog } from "@/components/products/product-catalog";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function ProductosPage() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, category: true, priceCents: true, costCents: true, stock: true },
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
      <ProductCatalog products={products} />
    </>
  );
}