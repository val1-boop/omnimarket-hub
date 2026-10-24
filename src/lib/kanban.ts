import type { OrderStatus } from "@prisma/client";

// Cuántas tarjetas se muestran por columna (las más recientes).
export const KANBAN_COLUMN_LIMIT = 25;

export type KanbanCard = {
  id: string;
  number: number;
  customerName: string;
  totalCents: number;
  itemCount: number;
  createdAt: Date;
};

export type KanbanColumn = {
  status: OrderStatus;
  /** Total real de pedidos en este paso (aunque solo se muestren algunos). */
  total: number;
  cards: KanbanCard[];
};

// El camino normal de un pedido. Entregado y Cancelado ya no avanzan.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export function getNextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

/** Encuentra en qué columna está una tarjeta. */
export function findCardStatus(board: KanbanColumn[], cardId: string): OrderStatus | null {
  return board.find((column) => column.cards.some((card) => card.id === cardId))?.status ?? null;
}

/**
 * Devuelve un tablero NUEVO con la tarjeta movida hasta arriba de la columna destino.
 * Si la tarjeta no existe o ya está en esa columna, regresa el mismo tablero.
 */
export function moveCard(board: KanbanColumn[], cardId: string, toStatus: OrderStatus): KanbanColumn[] {
  const fromStatus = findCardStatus(board, cardId);
  if (!fromStatus || fromStatus === toStatus) return board;

  const card = board.find((column) => column.status === fromStatus)!.cards.find((item) => item.id === cardId)!;

  return board.map((column) => {
    if (column.status === fromStatus) {
      return { ...column, total: column.total - 1, cards: column.cards.filter((item) => item.id !== cardId) };
    }
    if (column.status === toStatus) {
      return { ...column, total: column.total + 1, cards: [card, ...column.cards] };
    }
    return column;
  });
}