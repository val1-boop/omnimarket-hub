import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

// Configuración completa: guarda usuarios y cuentas en la base de datos.
// La sesión viaja en un JWT cifrado (cookie), así el middleware no consulta la BD.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
});