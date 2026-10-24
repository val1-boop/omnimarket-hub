"use server";

import { cookies } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { parseStoreChoice, STORE_COOKIE } from "@/lib/stores";
import { SESSION_EXPIRED_MESSAGE, getSessionUser } from "@/server/auth-guard";

// Cambia entre "Mi tienda" y la Tienda de demostración. La cookie solo guarda "mia" o "demo":
// qué tienda es "mia" siempre lo decide el servidor con la sesión.
export async function switchStore(choice: unknown): Promise<ActionResult> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  (await cookies()).set(STORE_COOKIE, parseStoreChoice(typeof choice === "string" ? choice : null), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true, data: undefined };
}
