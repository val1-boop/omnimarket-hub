import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEMO_STORE_ID, DEMO_STORE_NAME, OWN_STORE_NAME, parseStoreChoice, STORE_COOKIE } from "@/lib/stores";
import { getSessionUser } from "@/server/auth-guard";

export type StoreContext = {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  store: { id: string; name: string; isDemo: boolean };
};

/**
 * Regresa la tienda propia del usuario y la crea si es la primera vez que entra.
 * Hay una sola por usuario (ownerId es único): si dos peticiones llegan al mismo tiempo,
 * una la crea y la otra la lee, así nunca se duplica.
 */
export async function ensureOwnStore(userId: string) {
  const existing = await prisma.store.findUnique({ where: { ownerId: userId } });
  if (existing) return existing;
  try {
    return await prisma.store.create({ data: { ownerId: userId, name: OWN_STORE_NAME } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.store.findUniqueOrThrow({ where: { ownerId: userId } });
    }
    throw error;
  }
}

/** La tienda de demostración. Si falta (base recién creada), se crea vacía. */
export async function ensureDemoStore() {
  return prisma.store.upsert({
    where: { id: DEMO_STORE_ID },
    update: {},
    create: { id: DEMO_STORE_ID, name: DEMO_STORE_NAME, isDemo: true },
  });
}

/**
 * Usuario de la sesión y la tienda con la que está trabajando. Todo se decide en el servidor:
 * la cookie solo dice "mia" o "demo", y "mia" siempre es la tienda cuyo dueño es el usuario de la sesión.
 * Se guarda en caché durante la petición para no repetir consultas.
 */
export const getStoreContext = cache(async (): Promise<StoreContext | null> => {
  const user = await getSessionUser();
  if (!user?.id) return null;

  const choice = parseStoreChoice((await cookies()).get(STORE_COOKIE)?.value);
  const store = choice === "demo" ? await ensureDemoStore() : await ensureOwnStore(user.id);
  return { user: { ...user, id: user.id }, store: { id: store.id, name: store.name, isDemo: store.isDemo } };
});

/** Para páginas privadas: si no hay sesión, manda al login. */
export async function requireStoreContext(): Promise<StoreContext> {
  const context = await getStoreContext();
  if (!context) redirect("/login");
  return context;
}
