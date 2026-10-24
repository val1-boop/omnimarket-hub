import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PageHeader } from "@/components/page-header";
import { getKanbanBoard } from "@/server/queries/kanban";

export default async function KanbanPage() {
  const board = await getKanbanBoard();

  return (
    <>
      <PageHeader
        eyebrow="Tus envíos"
        title="Tablero"
        description="Arrastra cada pedido a la columna del paso en el que va, o usa el botón “Pasar a…” de la tarjeta."
      />
      <KanbanBoard initialBoard={board} />
    </>
  );
}