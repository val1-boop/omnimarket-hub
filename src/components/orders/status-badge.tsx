import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={ORDER_STATUS_STYLES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}