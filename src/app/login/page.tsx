import { ChartColumn, Layers, SquareKanban } from "lucide-react";
import Link from "next/link";
import { signIn } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "No pudimos dejarte entrar con esa cuenta. Prueba con otra.",
  OAuthAccountNotLinked:
    "Ya tienes una cuenta con ese correo, pero la abriste con el otro botón (Google o GitHub). Entra con el mismo que usaste la primera vez.",
  OAuthCallbackError: "Google o GitHub no terminaron de iniciar tu sesión. Inténtalo otra vez.",
};

const HIGHLIGHTS = [
  { icon: ChartColumn, text: "Ve cuánto vendes y cuánto te queda de ganancia" },
  { icon: SquareKanban, text: "Mueve tus pedidos arrastrándolos de un paso al siguiente" },
  { icon: Layers, text: "Cambia varios pedidos a la vez, sin ir uno por uno" },
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
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        {/* Brillos decorativos de fondo */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-lilac-600/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <Logo href="/login" inverted />
        </div>
        <div className="relative">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
            Cada pedido,
            <br />
            de la caja
            <br />
            <span className="bg-gradient-to-r from-lilac-300 to-fuchsia-300 bg-clip-text text-transparent">a la puerta.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-300">Sin perderle la pista a ninguno.</p>
          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200 ring-1 ring-white/10">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lima-300 text-ink-900">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} OmniMarket · Proyecto escolar</p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center bg-gradient-to-br from-lilac-100 via-lilac-50 to-white p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo href="/login" />
          </div>
          <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-lilac-700 ring-1 ring-lilac-200">
            ¡Qué gusto verte!
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900">Entra a tu tienda</h2>
          <p className="mt-2 text-sm text-slate-600">
            Usa tu cuenta de Google o de GitHub. No necesitas crear una contraseña nueva.
          </p>

          {error && (
            <p role="alert" className="mt-6 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
              {ERROR_MESSAGES[error] ?? "Algo salió mal al entrar. Inténtalo otra vez en un momento."}
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
            Para entrar usamos tu nombre, correo y foto de Google o GitHub. Te explicamos todo en el{" "}
            <Link href="/privacidad" className="underline hover:text-ink-900">
              aviso de privacidad
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}