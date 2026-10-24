import { auth } from "@/auth";

// Las acciones del servidor también revisan la sesión: no basta con esconder los botones.
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export const SESSION_EXPIRED_MESSAGE = "Tu sesión se cerró. Vuelve a entrar para continuar.";