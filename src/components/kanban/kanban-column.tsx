"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { KanbanColumn as KanbanColumnData } from "@/lib/kanban";
import { formatNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  column: KanbanColumnData;
  step: number;
  children: ReactNode;
};

export function KanbanColumn({ column, step, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const label = ORDER_STATUS_LABELS[column.status];
  const hidden = column.total - column.cards.length;

  return (
    <section
      ref={setNodeRef}
      data-testid={`kanban-column-${column.status}`}
      aria-label={`${label}: ${column.total} pedidos`}
      className={cn(
        "flex min-w-56 flex-1 flex-col rounded-2xl bg-slate-50 p-3 transition-colors",
        isOver && "bg-sand-100 ring-2 ring-sand-500",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-navy-900">
          {step}. {label}
        </h2>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ORDER_STATUS_STYLES[column.status])}>
          {formatNumber(column.total)}
        </span>
      </header>

      <div className="flex min-h-24 flex-1 flex-col gap-3">
        {column.cards.length > 0 ? (
          children
        ) : (
          <p className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Suelta aquí un pedido
          </p>
        )}
      </div>

      {hidden > 0 && (
        <Link
          href={`/pedidos?status=${column.status}`}
          className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-navy-900 hover:text-sand-700"
        >
          Ver los {formatNumber(column.total)} en Pedidos
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}