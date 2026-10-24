import Link from "next/link";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getKanbanBoard } from "@/server/queries/kanban";
import { requireStoreContext } from "@/server/store";

export default async function KanbanPage() {
  const { store } = await requireStoreContext();
  const board = await getKanbanBoard(store.id);

  return (
    <>
      <PageHeader
        eyebrow="Tus envíos"
        title="Tablero"
        description="Arrastra cada pedido a la columna del paso en el que va, o usa el botón “Pasar a…” de la tarjeta."
      />
      {board.every((column) => column.total === 0) && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-sand-50 p-5 sm:flex-row sm:items-center sm:justify-between" data-testid="kanban-empty">
          <p className="text-sm text-navy-900">
            Todavía no tienes pedidos en el tablero. Cuando registres uno, aparecerá en “Por preparar”.
          </p>
          <Link href="/pedidos/nuevo" className={buttonVariants({ size: "sm" })}>
            Registrar mi primer pedido
          </Link>
        </div>
      )}
      <KanbanBoard initialBoard={board} />
    </>
  );
}