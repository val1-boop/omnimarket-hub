"use client";

import type { OrderStatus } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/input";
import { formatCurrency, formatDate, formatNumber, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-status";
import { runAction } from "@/lib/run-action";
import { bulkDeleteOrders, bulkUpdateOrderStatus } from "@/server/actions/orders";
import type { OrderRow } from "@/server/queries/orders";

const pedidos = (count: number) => (count === 1 ? "1 pedido" : `${formatNumber(count)} pedidos`);

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<OrderStatus | "">("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Cambios optimistas: se ven al instante y se deshacen si el servidor falla.
  const [statusOverrides, setStatusOverrides] = useState<Map<string, OrderStatus>>(new Map());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // Cuando llegan datos nuevos del servidor, ya no hacen falta los cambios optimistas.
  const [previousRows, setPreviousRows] = useState(rows);
  if (rows !== previousRows) {
    setPreviousRows(rows);
    setStatusOverrides(new Map());
    setHiddenIds(new Set());
    setSelected(new Set());
  }

  const visibleRows = rows
    .filter((row) => !hiddenIds.has(row.id))
    .map((row) => ({ ...row, status: statusOverrides.get(row.id) ?? row.status }));

  const updateStatus = useMutation({
    mutationFn: (variables: { ids: string[]; status: OrderStatus }) =>
      runAction(() => bulkUpdateOrderStatus(variables), "No pudimos guardar el cambio. Revisa tu conexión."),
    onMutate: ({ ids, status }) => {
      const previous = statusOverrides;
      setStatusOverrides((current) => {
        const next = new Map(current);
        ids.forEach((id) => next.set(id, status));
        return next;
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context) setStatusOverrides(context.previous);
      toast.error(`${error.message} Regresamos los pedidos como estaban.`);
    },
    onSuccess: ({ count }, { status }) => {
      toast.success(`¡Listo! ${pedidos(count)} ${count === 1 ? "quedó" : "quedaron"} en “${ORDER_STATUS_LABELS[status]}”.`);
      setSelected(new Set());
      setTargetStatus("");
      router.refresh();
    },
  });

  const deleteOrders = useMutation({
    mutationFn: (ids: string[]) =>
      runAction(() => bulkDeleteOrders({ ids }), "No pudimos borrar los pedidos. Revisa tu conexión."),
    onMutate: (ids) => {
      const previous = hiddenIds;
      setHiddenIds((current) => new Set([...current, ...ids]));
      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context) setHiddenIds(context.previous);
      toast.error(`${error.message} No se borró nada.`);
    },
    onSuccess: ({ count }) => {
      toast.success(`Borramos ${pedidos(count)}.`);
      setSelected(new Set());
      router.refresh();
    },
  });

  const selectedIds = visibleRows.filter((row) => selected.has(row.id)).map((row) => row.id);
  const allSelected = visibleRows.length > 0 && selectedIds.length === visibleRows.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleRow = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visibleRows.map((row) => row.id)));

  if (visibleRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">No hay pedidos aquí</p>
        <p className="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o con otro paso.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm" data-testid="orders-table">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todos los pedidos de esta página"
                  className="h-4 w-4 accent-navy-900"
                />
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">Pedido</th>
              <th scope="col" className="px-4 py-3 font-semibold">Cliente</th>
              <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Productos</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
              <th scope="col" className="px-4 py-3 font-semibold">Paso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((row) => {
              const isSelected = selected.has(row.id);
              const orderNumber = formatOrderNumber(row.number);
              return (
                <tr
                  key={row.id}
                  data-testid={`order-row-${orderNumber}`}
                  className={isSelected ? "bg-sand-50" : "hover:bg-slate-50"}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Seleccionar el pedido ${orderNumber}`}
                      className="h-4 w-4 accent-navy-900"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy-900">{orderNumber}</td>
                  <td className="px-4 py-3 text-navy-900">{row.customerName}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatNumber(row.itemCount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-navy-900">{formatCurrency(row.totalCents)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barra de acciones para los pedidos seleccionados */}
      {selectedIds.length > 0 && (
        <div
          role="region"
          aria-label="Acciones para los pedidos seleccionados"
          className="sticky bottom-4 z-20 mt-4 flex flex-col gap-3 rounded-xl bg-navy-900 p-4 text-white shadow-lg sm:flex-row sm:items-center"
        >
          <p className="text-sm font-semibold sm:mr-auto">
            {selectedIds.length === 1 ? "1 pedido seleccionado" : `${formatNumber(selectedIds.length)} pedidos seleccionados`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="bulk-status" className="text-xs uppercase tracking-wider text-slate-300">
              Pasar a
            </label>
            <Select
              id="bulk-status"
              value={targetStatus}
              onChange={(event) => setTargetStatus(event.target.value as OrderStatus | "")}
              className="h-9 w-44 text-navy-900"
            >
              <option value="">Elige un paso…</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <Button
              variant="accent"
              size="sm"
              disabled={!targetStatus || updateStatus.isPending}
              onClick={() => targetStatus && updateStatus.mutate({ ids: selectedIds, status: targetStatus })}
            >
              Aplicar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteOrders.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 aria-hidden="true" />
              Borrar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-navy-800"
              onClick={() => setSelected(new Set())}
              aria-label="Quitar selección"
              title="Quitar selección"
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`¿Borrar ${pedidos(selectedIds.length)}?`}
        description="Se borran para siempre, junto con sus productos. Esto no se puede deshacer."
        confirmLabel="Sí, borrar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteOrders.mutate(selectedIds);
        }}
      />
    </>
  );
}