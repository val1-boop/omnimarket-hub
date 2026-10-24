import Image from "next/image";
import { auth, signOut } from "@/auth";

// Página privada provisional: en la Fase 4 se convierte en el dashboard real.
export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user?.image && (
            <Image src={user.image} alt="" width={48} height={48} className="rounded-full" />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hola, {user?.name ?? "usuario"}</h1>
            <p className="text-sm text-slate-600">{user?.email}</p>
          </div>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}