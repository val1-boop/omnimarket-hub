import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/server/seed";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((counts) => {
    console.log("✅ Datos de prueba cargados:", counts);
  })
  .catch((error) => {
    console.error("❌ Error al cargar los datos de prueba:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());