import { Gauge, Layers, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signIn } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Acceso denegado. Intenta con otra cuenta.",
  Configuration: "Error de configuración del servidor de autenticación.",
};

const HIGHLIGHTS = [
  { icon: Gauge, text: "Métricas de ventas en tiempo real" },
  { icon: Layers, text: "Kanban y edición de pedidos en lote" },
  { icon: ShieldCheck, text: "Acceso seguro con OAuth 2.0" },
];

// Solo permitimos redirigir a rutas internas (evita redirecciones a sitios externos).
function safeRedirect(callbackUrl?: string) {
  if (!callbackUrl) return "/dashboard";
  try {
    const url = new URL(callbackUrl, "http://localhost");
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") && path !== "/login" ? path : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeRedirect(callbackUrl);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <section className="hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <Logo href="/login" inverted />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-200">Te damos la bienvenida</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-tight">
            Todo tu negocio.
            <br />
            En un solo lugar.
          </h1>
          <p className="mt-3 font-script text-3xl text-sand-200">Decisiones con datos reales</p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <Icon className="h-5 w-5 text-sand-200" strokeWidth={1.5} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} OmniMarket Operations Hub</p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center bg-sand-50 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo href="/login" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-700">Acceso</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-navy-900">Inicia sesión</h2>
          <p className="mt-2 text-sm text-slate-600">Usa tu cuenta de Google o GitHub para entrar al Operations Hub.</p>

          {error && (
            <p role="alert" className="mt-6 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
              {ERROR_MESSAGES[error] ?? "No se pudo iniciar sesión. Inténtalo de nuevo."}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
                </svg>
                Continuar con Google
              </Button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo });
              }}
            >
              <Button type="submit" className="w-full">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
                </svg>
                Continuar con GitHub
              </Button>
            </form>
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Al continuar aceptas los{" "}
            <Link href="/terminos" className="underline hover:text-navy-900">
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="underline hover:text-navy-900">
              política de privacidad
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}