import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PedidosPage() {
  return (
    <>
      <PageHeader eyebrow="Operaciones" title="Pedidos" description="Consulta, crea y actualiza pedidos en lote." />
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>La tabla de pedidos y la edición en lote se construyen en la Fase 5.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}