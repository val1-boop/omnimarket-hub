import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";
import { centsToPesos } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { PRODUCT_CATEGORIES } from "@/lib/validation/product";

type EditarProductoPageProps = { params: Promise<{ id: string }> };

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const category = PRODUCT_CATEGORIES.find((item) => item === product.category) ?? PRODUCT_CATEGORIES[0];

  return (
    <>
      <BackLink href="/productos">Volver a productos</BackLink>
      <PageHeader eyebrow={product.sku} title="Editar producto" description={product.name} />
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          category,
          price: centsToPesos(product.priceCents),
          cost: centsToPesos(product.costCents),
          stock: product.stock,
        }}
      />
    </>
  );
}