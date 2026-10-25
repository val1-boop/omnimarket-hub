import type { Metadata } from "next";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = { title: "Aviso de privacidad · OmniMarket" };

const RESPONSIBLE = {
  name: "Valeria Lagunas Carbajal",
  email: "lagunasv799@gmail.com",
  city: "Cuernavaca, Morelos, México",
};
const UPDATED_AT = "24 de octubre de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

export default async function PrivacidadPage() {
  // Si ya iniciaste sesión, la flecha te regresa al inicio; si no, al login.
  const session = await auth();
  const back = session?.user
    ? { href: "/dashboard", label: "Volver al inicio" }
    : { href: "/login", label: "Volver a iniciar sesión" };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Logo href={back.href} />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
        <BackLink href={back.href}>{back.label}</BackLink>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lilac-700">Tus datos</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink-900">Aviso de privacidad</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {UPDATED_AT}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <p>
            OmniMarket es un proyecto escolar hecho para una materia. Su único uso es que el profesor revise cómo
            funciona. Aquí te contamos, sin letras chiquitas, qué datos tuyos usamos cuando entras y qué hacemos con
            ellos.
          </p>

          <Section title="¿Quién es responsable de tus datos?">
            <p>
              <strong className="text-ink-900">{RESPONSIBLE.name}</strong>, con domicilio en {RESPONSIBLE.city}.
              Para cualquier duda sobre tus datos escribe a{" "}
              <a className="font-medium text-ink-900 underline" href={`mailto:${RESPONSIBLE.email}`}>
                {RESPONSIBLE.email}
              </a>
              .
            </p>
          </Section>

          <Section title="¿Qué datos usamos?">
            <p>Cuando entras con tu cuenta de Google o de GitHub, ellos nos comparten y guardamos:</p>
            <ul>
              <li>Tu nombre.</li>
              <li>Tu correo electrónico.</li>
              <li>La dirección de tu foto de perfil.</li>
              <li>El número con el que Google o GitHub identifican tu cuenta.</li>
              <li>
                Los permisos de acceso que Google o GitHub entregan al iniciar sesión. Solo sirven para confirmar que
                eres tú; no los usamos para entrar a tu cuenta ni para ver otra información tuya.
              </li>
            </ul>
            <p>
              No te pedimos ni guardamos contraseñas. No usamos datos sensibles (como salud, religión u origen) ni
              datos de pago.
            </p>
            <p>
              Además se guarda lo que tú registras en <strong className="text-ink-900">“Mi tienda”</strong>:
              productos, pedidos y los clientes que das de alta (solo nombre y ciudad). Solo tú lo ves. Como es un
              proyecto escolar, te pedimos no registrar datos de personas reales.
            </p>
            <p>
              La <strong className="text-ink-900">Tienda de demostración</strong> tiene productos, clientes y pedidos
              inventados para la materia; no son personas reales. La comparten todos los que entran.
            </p>
          </Section>

          <Section title="¿Para qué los usamos?">
            <ul>
              <li>Para dejarte entrar y saber que eres tú.</li>
              <li>Para mostrar tu nombre, correo y foto dentro de la app.</li>
              <li>Para guardar lo que registras en tu tienda y mostrártelo solo a ti.</li>
            </ul>
            <p>No los usamos para nada más: no los vendemos, no los usamos para publicidad y no te mandamos correos.</p>
          </Section>

          <Section title="¿Quién más los tiene?">
            <p>No le pasamos tus datos a nadie. Para funcionar, la app usa estos servicios que los guardan o procesan por nosotros:</p>
            <ul>
              <li>
                <strong className="text-ink-900">Supabase</strong>: la base de datos donde se guardan, en servidores
                ubicados en Estados Unidos.
              </li>
              <li>
                <strong className="text-ink-900">Vercel</strong>: los servidores donde corre la app, también en
                Estados Unidos. Como cualquier sitio web, registran datos técnicos de las visitas, como la dirección
                IP, para poder funcionar.
              </li>
              <li>
                <strong className="text-ink-900">Google y GitHub</strong>: solo en el momento en que inicias sesión
                con ellos.
              </li>
            </ul>
          </Section>

          <Section title="Cookies">
            <p>
              Usamos únicamente las cookies necesarias para que la app funcione: una mantiene tu sesión abierta de
              forma segura (dura hasta 30 días o hasta que toques “Cerrar sesión”) y otra recuerda si estás viendo
              “Mi tienda” o la Tienda de demostración (dura hasta un año y se borra al cerrar sesión). No usamos
              cookies de publicidad ni de seguimiento.
            </p>
            <p>
              Si eliges modo claro u oscuro, esa preferencia se guarda solo en tu navegador (no se manda a
              nuestro servidor) y puedes cambiarla cuando quieras con el botón del sol o la luna.
            </p>
          </Section>

          <Section title="¿Cuánto tiempo los guardamos?">
            <p>Mientras dure la materia. Al terminar el proyecto se borran, o antes si tú lo pides.</p>
          </Section>

          <Section title="Tus derechos">
            <p>
              Puedes pedir en cualquier momento <strong className="text-ink-900">ver</strong> qué datos tuyos tenemos,
              <strong className="text-ink-900"> corregirlos</strong>, <strong className="text-ink-900">borrarlos</strong>{" "}
              u <strong className="text-ink-900">oponerte</strong> a que los usemos (a esto la ley le llama derechos
              ARCO). También puedes retirar tu permiso.
            </p>
            <p>
              Solo escribe a{" "}
              <a className="font-medium text-ink-900 underline" href={`mailto:${RESPONSIBLE.email}`}>
                {RESPONSIBLE.email}
              </a>{" "}
              con tu nombre, el correo con el que entraste y lo que quieres hacer. Te respondemos en un máximo de 20
              días hábiles.
            </p>
            <p>Además, puedes quitarle el acceso a OmniMarket desde tu propia cuenta:</p>
            <ul>
              <li>
                Google:{" "}
                <a className="underline" href="https://myaccount.google.com/connections">
                  myaccount.google.com/connections
                </a>
              </li>
              <li>
                GitHub:{" "}
                <a className="underline" href="https://github.com/settings/applications">
                  github.com/settings/applications
                </a>
              </li>
            </ul>
          </Section>

          <Section title="Cambios a este aviso">
            <p>Si algo cambia, lo actualizamos en esta misma página y cambiamos la fecha de arriba.</p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
