import { PrismaClient } from "@prisma/client";

// En desarrollo Next.js recarga los módulos en cada cambio; guardamos el
// cliente en globalThis para no abrir una conexión nueva cada vez.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}