"use client";

import type { OrderStatus } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { SavingSkeleton } from "@/components/ui/skeleton";
import { formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-status";
import { runAction } from "@/lib/run-action";
import { moveOrder } from "@/server/actions/orders";

// Cambia el paso de un pedido desde su página de detalle (lo mismo que moverlo en el tablero).
export function OrderStatusControl({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [next, setNext] = useState<OrderStatus>(status);
  const save = useMutation({
    mutationFn: () => runAction(() => moveOrder({ id, status: next }), "No pudimos guardar el cambio. Revisa tu conexión."),
    onSuccess: ({ number }) => {
      toast.success(`${formatOrderNumber(number)} ahora está en “${ORDER_STATUS_LABELS[next]}”.`);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <Select
        id="order-status"
        name="status"
        aria-label="Paso del pedido"
        value={next}
        onChange={(event) => setNext(event.target.value as OrderStatus)}
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={save.isPending || next === status} className="shrink-0">
        {save.isPending ? <SavingSkeleton className="w-14 bg-white/40" /> : "Guardar"}
      </Button>
    </form>
  );
}
