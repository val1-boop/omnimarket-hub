import { OrderStatus, type PrismaClient } from "@prisma/client";

// Conjunto de datos de prueba DETERMINISTA: cada ejecución genera exactamente
// los mismos productos, clientes y pedidos. Lo usan `npm run db:seed` y el
// endpoint POST /api/test/reset-data para que los tests E2E sean repetibles.

const ORDER_COUNT = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

// Generador pseudoaleatorio con semilla fija (mulberry32).
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (value: number, length: number) => String(value).padStart(length, "0");

// [nombre, categoría, precio en centavos, costo en centavos, stock]
const PRODUCTS: [string, string, number, number, number][] = [
  ["Audífonos Inalámbricos Pro", "Electrónica", 189900, 112000, 45],
  ["Smartwatch Fit 2", "Electrónica", 249900, 151000, 30],
  ["Bocina Bluetooth Mini", "Electrónica", 79900, 41000, 80],
  ["Cargador Rápido 65W", "Electrónica", 54900, 23000, 120],
  ["Teclado Mecánico RGB", "Computación", 129900, 72000, 40],
  ["Mouse Ergonómico", "Computación", 49900, 21000, 95],
  ["Monitor 27\" QHD", "Computación", 649900, 455000, 15],
  ["Hub USB-C 7 en 1", "Computación", 69900, 31000, 70],
  ["Sudadera Básica", "Ropa", 59900, 24000, 110],
  ["Tenis Running Air", "Ropa", 159900, 82000, 50],
  ["Gorra Deportiva", "Ropa", 29900, 9000, 150],
  ["Chamarra Impermeable", "Ropa", 189900, 98000, 25],
  ["Cafetera de Goteo", "Hogar", 99900, 56000, 35],
  ["Juego de Sartenes", "Hogar", 149900, 84000, 20],
  ["Lámpara LED de Escritorio", "Hogar", 44900, 18000, 90],
  ["Organizador de Cocina", "Hogar", 34900, 12000, 100],
  ["Botella Térmica 1L", "Deportes", 39900, 14000, 130],
  ["Tapete de Yoga", "Deportes", 49900, 19000, 75],
  ["Mancuernas 5kg (par)", "Deportes", 89900, 47000, 40],
  ["Cuerda para Saltar", "Deportes", 19900, 6000, 160],
  ["Crema Hidratante", "Belleza", 29900, 11000, 140],
  ["Kit de Brochas", "Belleza", 44900, 16000, 60],
  ["Perfume Citrus 100ml", "Belleza", 119900, 52000, 30],
  ["Secadora de Cabello", "Belleza", 89900, 46000, 28],
];

const FIRST_NAMES = ["Ana", "Luis", "María", "Carlos", "Sofía", "Jorge", "Valeria", "Diego", "Camila", "Andrés"];
const LAST_NAMES = ["García", "Martínez", "López", "Hernández", "González", "Pérez", "Rodríguez", "Sánchez"];
const CITIES = ["CDMX", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "Mérida"];

// Los pedidos antiguos ya se entregaron; los recientes siguen en proceso.
function pickStatus(daysAgo: number, random: () => number): OrderStatus {
  const roll = random();
  if (roll < 0.05) return OrderStatus.CANCELLED;
  if (daysAgo > 30) return OrderStatus.DELIVERED;
  if (daysAgo > 14) return roll < 0.7 ? OrderStatus.DELIVERED : OrderStatus.SHIPPED;
  if (daysAgo > 7) return roll < 0.5 ? OrderStatus.SHIPPED : OrderStatus.PROCESSING;
  return roll < 0.6 ? OrderStatus.PENDING : OrderStatus.PROCESSING;
}

export function buildSeedData(now = new Date()) {
  const random = createRandom(20261024);

  const products = PRODUCTS.map(([name, category, priceCents, costCents, stock], index) => ({
    id: `prod_${pad(index + 1, 3)}`,
    sku: `OM-${category.slice(0, 3).toUpperCase()}-${pad(index + 1, 3)}`,
    name,
    category,
    priceCents,
    costCents,
    stock,
  }));

  const customers = Array.from({ length: 40 }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
    return {
      id: `cust_${pad(index + 1, 3)}`,
      name: `${first} ${last}`,
      email: `cliente${pad(index + 1, 3)}@omnimarket.test`,
      city: CITIES[index % CITIES.length],
    };
  });

  const orders = [];
  const orderItems = [];
  const positions = new Map<OrderStatus, number>();

  for (let index = 0; index < ORDER_COUNT; index++) {
    // Del pedido más antiguo (hace ~90 días) al más reciente.
    const daysAgo = Math.floor(((ORDER_COUNT - index) / ORDER_COUNT) * 90);
    const createdAt = new Date(now.getTime() - daysAgo * DAY_MS - Math.floor(random() * DAY_MS));
    const status = pickStatus(daysAgo, random);
    const orderId = `ord_${pad(index + 1, 4)}`;

    let totalCents = 0;
    let costCents = 0;
    const itemCount = 1 + Math.floor(random() * 3);
    for (let line = 0; line < itemCount; line++) {
      const product = products[Math.floor(random() * products.length)];
      const quantity = 1 + Math.floor(random() * 3);
      totalCents += product.priceCents * quantity;
      costCents += product.costCents * quantity;
      orderItems.push({
        id: `item_${pad(orderItems.length + 1, 5)}`,
        orderId,
        productId: product.id,
        quantity,
        unitPriceCents: product.priceCents,
        unitCostCents: product.costCents,
      });
    }

    const position = positions.get(status) ?? 0;
    positions.set(status, position + 1);

    orders.push({
      id: orderId,
      status,
      position,
      totalCents,
      costCents,
      customerId: customers[Math.floor(random() * customers.length)].id,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return { products, customers, orders, orderItems };
}

// Borra los datos de e-commerce (NO toca usuarios ni sesiones) y carga el set de prueba.
export async function seedDatabase(prisma: PrismaClient) {
  const data = buildSeedData();

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "OrderItem", "Order", "Customer", "Product" RESTART IDENTITY CASCADE',
    ),
    prisma.product.createMany({ data: data.products }),
    prisma.customer.createMany({ data: data.customers }),
    prisma.order.createMany({ data: data.orders }),
    prisma.orderItem.createMany({ data: data.orderItems }),
  ]);

  return {
    products: data.products.length,
    customers: data.customers.length,
    orders: data.orders.length,
    orderItems: data.orderItems.length,
  };
}