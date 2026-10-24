// Cálculos de dinero de la tienda. Todo se maneja en centavos (números enteros)
// para que nunca haya errores de redondeo como 0.1 + 0.2 = 0.30000000000000004.

export type OrderLine = {
  quantity: number;
  unitPriceCents: number;
  unitCostCents: number;
};

/** Pesos → centavos: 1899.9 → 189990 */
export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
}

/** Centavos → pesos: 189990 → 1899.9 */
export function centsToPesos(cents: number): number {
  return cents / 100;
}

/** Margen: qué parte del precio es ganancia. Precio $100 y costo $60 → 0.4 (40 %). */
export function calculateMargin(priceCents: number, costCents: number): number {
  if (priceCents <= 0) return 0;
  return (priceCents - costCents) / priceCents;
}

/** Ganancia en centavos de vender `quantity` piezas. */
export function calculateProfit(priceCents: number, costCents: number, quantity = 1): number {
  return (priceCents - costCents) * quantity;
}

/** Suma el total, el costo y la ganancia de las líneas de un pedido. */
export function calculateOrderTotals(lines: OrderLine[]) {
  const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const costCents = lines.reduce((sum, line) => sum + line.unitCostCents * line.quantity, 0);
  return { totalCents, costCents, profitCents: totalCents - costCents };
}

/** Ticket promedio: lo que gasta en promedio cada pedido (redondeado al centavo). */
export function calculateAverageTicket(orderTotalsCents: number[]): number {
  if (orderTotalsCents.length === 0) return 0;
  const sum = orderTotalsCents.reduce((total, value) => total + value, 0);
  return Math.round(sum / orderTotalsCents.length);
}