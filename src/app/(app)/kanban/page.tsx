import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function KanbanPage() {
  return (
    <>
      <PageHeader eyebrow="Operaciones" title="Kanban de pedidos" description="Arrastra los pedidos para cambiar su estado." />
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>El tablero con Drag &amp; Drop se construye en la Fase 6.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}