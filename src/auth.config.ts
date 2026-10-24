import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Configuración compatible con el middleware (Edge): aquí NO se usa Prisma.
// Las credenciales se leen solas de AUTH_GOOGLE_ID/SECRET y AUTH_GITHUB_ID/SECRET.

// Páginas de login: si ya hay sesión se redirige al dashboard.
const AUTH_PATHS = ["/login"];
// Páginas legales: siempre públicas (Google las exige para publicar la app OAuth).
const PUBLIC_PATHS = ["/privacidad", "/terminos"];

export const authConfig = {
  providers: [
    // Permite entrar con Google o GitHub usando el mismo correo sin error de cuenta no vinculada.
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);

      if (PUBLIC_PATHS.includes(nextUrl.pathname)) return true;

      if (AUTH_PATHS.includes(nextUrl.pathname)) {
        // Si ya tiene sesión, no tiene sentido mostrarle el login.
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // false → Auth.js redirige a /login?callbackUrl=<ruta solicitada>
      return isLoggedIn;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;