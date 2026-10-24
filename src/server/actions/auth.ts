"use server";

import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { STORE_COOKIE } from "@/lib/stores";

export async function signOutAction() {
  // Quien entre después en esta computadora empieza en su propia tienda.
  (await cookies()).delete(STORE_COOKIE);
  await signOut({ redirectTo: "/login" });
}
