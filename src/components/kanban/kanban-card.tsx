"use client";

import { useDraggable } from "@dnd-kit/core";
import type { OrderStatus } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { SavingSkeleton } from "@/components/ui/skeleton";
import type { KanbanCard as KanbanCardData } from "@/lib/kanban";
import { formatCurrency, formatDate, formatNumber, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";

type CardViewProps = {
  card: KanbanCardData;
  nextStatus: OrderStatus | null;
  /** true mientras se guarda el movimiento: en lugar del botón se ve un esqueleto. */
  saving?: boolean;
  onAdvance?: () => void;
  className?: string;
};

// Lo que se ve dentro de la tarjeta (se usa también mientras se arrastra).
export function KanbanCardView({ card, nextStatus, saving = false, onAdvance, className }: CardViewProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-3 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-navy-900">{formatOrderNumber(card.number)}</span>
        <span className="text-xs text-slate-500">{formatDate(card.createdAt)}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-navy-900">{card.customerName}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-display text-base font-extrabold text-navy-900">{formatCurrency(card.totalCents)}</span>
        <span className="text-xs text-slate-500">
          {card.itemCount === 1 ? "1 producto" : `${formatNumber(card.itemCount)} productos`}
        </span>
      </div>
      {saving ? (
        <div className="mt-3 flex h-[30px] items-center justify-center rounded-md bg-slate-100">
          <SavingSkeleton className="w-24" />
        </div>
      ) : nextStatus && (
        <button
          type="button"
          onClick={onAdvance}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-md bg-sand-50 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-900 transition-colors hover:bg-sand-100"
        >
          Pasar a {ORDER_STATUS_LABELS[nextStatus]}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

type DraggableCardProps = {
  card: KanbanCardData;
  nextStatus: OrderStatus | null;
  saving: boolean;
  onAdvance: () => void;
};

export function DraggableCard({ card, nextStatus, saving, onAdvance }: DraggableCardProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: card.id });

  return (
    <article
      ref={setNodeRef}
      {...listeners}
      data-testid={`kanban-card-${formatOrderNumber(card.number)}`}
      aria-busy={saving || undefined}
      className={cn("cursor-grab touch-manipulation active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <KanbanCardView card={card} nextStatus={nextStatus} saving={saving} onAdvance={onAdvance} />
    </article>
  );
}