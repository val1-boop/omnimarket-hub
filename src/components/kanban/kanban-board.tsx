"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { OrderStatus } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DraggableCard, KanbanCardView } from "@/components/kanban/kanban-card";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { formatOrderNumber } from "@/lib/format";
import { findCardStatus, getNextStatus, moveCard, type KanbanColumn as KanbanColumnData } from "@/lib/kanban";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { runAction } from "@/lib/run-action";
import { moveOrder } from "@/server/actions/orders";

type MoveVariables = { id: string; number: number; status: OrderStatus };

export function KanbanBoard({ initialBoard }: { initialBoard: KanbanColumnData[] }) {
  const router = useRouter();
  const [board, setBoard] = useState(initialBoard);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Cuando llegan datos nuevos del servidor, el tablero se actualiza con ellos.
  const [previousInitial, setPreviousInitial] = useState(initialBoard);
  if (initialBoard !== previousInitial) {
    setPreviousInitial(initialBoard);
    setBoard(initialBoard);
  }

  // Con mouse el arrastre empieza al moverlo 6 px (así los clics en botones siguen funcionando).
  // En celular hay que dejar el dedo presionado un momento, para no estorbar al deslizar la pantalla.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const move = useMutation({
    mutationFn: ({ id, status }: MoveVariables) =>
      runAction(() => moveOrder({ id, status }), "No pudimos mover el pedido. Revisa tu conexión."),
    // Cambio optimista: la tarjeta se mueve al instante.
    onMutate: ({ id, status }) => {
      const previous = board;
      setBoard((current) => moveCard(current, id, status));
      return { previous };
    },
    // Si falla, la tarjeta regresa a su columna.
    onError: (error, { number }, context) => {
      if (context) setBoard(context.previous);
      toast.error(`${error.message} ${formatOrderNumber(number)} regresó a donde estaba.`);
    },
    onSuccess: (_data, { number, status }) => {
      toast.success(`${formatOrderNumber(number)} ahora está en “${ORDER_STATUS_LABELS[status]}”.`);
      router.refresh();
    },
  });

  const allCards = board.flatMap((column) => column.cards);
  const activeCard = allCards.find((card) => card.id === activeId) ?? null;

  const requestMove = (id: string, status: OrderStatus) => {
    const from = findCardStatus(board, id);
    const card = allCards.find((item) => item.id === id);
    if (!from || !card || from === status) return;
    move.mutate({ id, number: card.number, status });
  };

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (over) requestMove(String(active.id), over.id as OrderStatus);
  };

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4" data-testid="kanban-board">
        {board.map((column, index) => (
          <KanbanColumn key={column.status} column={column} step={index + 1}>
            {column.cards.map((card) => {
              const nextStatus = getNextStatus(column.status);
              return (
                <DraggableCard
                  key={card.id}
                  card={card}
                  nextStatus={nextStatus}
                  onAdvance={() => nextStatus && requestMove(card.id, nextStatus)}
                />
              );
            })}
          </KanbanColumn>
        ))}
      </div>

      {/* Copia de la tarjeta que sigue al cursor mientras se arrastra */}
      <DragOverlay>
        {activeCard && (
          <KanbanCardView
            card={activeCard}
            nextStatus={null}
            className="rotate-2 cursor-grabbing shadow-xl ring-2 ring-sand-500"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}