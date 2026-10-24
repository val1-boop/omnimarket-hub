import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export default function NuevoProductoPage() {
  return (
    <>
      <BackLink href="/productos">Volver a productos</BackLink>
      <PageHeader
        eyebrow="Tu catálogo"
        title="Agregar producto"
        description="Llena los datos y mira a la derecha cuánto le vas a ganar a cada pieza."
      />
      <ProductForm />
    </>
  );
}