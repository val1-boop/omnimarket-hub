import { BackLink } from "@/components/back-link";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/page-header";
import { requireStoreContext } from "@/server/store";

export default async function NuevoClientePage() {
  await requireStoreContext();
  return (
    <>
      <BackLink href="/clientes">Volver a clientes</BackLink>
      <PageHeader eyebrow="Cliente nuevo" title="Agregar cliente" description="Solo necesitas su nombre y su ciudad." />
      <div className="max-w-xl">
        <CustomerForm />
      </div>
    </>
  );
}
