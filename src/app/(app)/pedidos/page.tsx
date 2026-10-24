import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PedidosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tus ventas"
        title="Pedidos"
        description="Todos tus pedidos en una lista. Podrás crear nuevos y cambiar varios a la vez."
      />
      <Card>
        <CardHeader>
          <CardTitle>Estamos armando esta sección</CardTitle>
          <CardDescription>Muy pronto vas a ver aquí la lista completa de tus pedidos.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}