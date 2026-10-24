import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";

// Las páginas privadas dependen de la sesión y de la base de datos: se generan en cada visita
// (así `npm run build` no intenta consultar la base de datos).
export const dynamic = "force-dynamic";

// Layout de todas las páginas privadas: encabezado + contenido + pie de página.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  // Segunda barrera de seguridad (la primera es el middleware).
  if (!session?.user) redirect("/login");

  return <AppShell user={session.user}>{children}</AppShell>;
}