import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function KanbanPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tus envíos"
        title="Tablero"
        description="Cada columna es un paso del camino. Arrastra un pedido a la siguiente cuando avance."
      />
      <Card>
        <CardHeader>
          <CardTitle>Estamos armando esta sección</CardTitle>
          <CardDescription>Muy pronto vas a poder mover tus pedidos de una columna a otra.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}