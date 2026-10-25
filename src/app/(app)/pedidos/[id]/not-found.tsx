import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { buttonVariants } from "@/components/ui/button";

// Se muestra si el pedido no existe en esta tienda (por ejemplo, porque lo borraron).
export default function PedidoNoEncontrado() {
  return (
    <>
      <BackLink href="/pedidos">Volver a pedidos</BackLink>
      <div className="mx-auto max-w-md rounded-2xl bg-lilac-50 p-10 text-center">
        <p className="text-gradient font-display text-3xl font-extrabold">¡Ups!</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink-900">Este pedido no existe</h1>
        <p className="mt-3 text-sm text-slate-600">
          Puede que lo hayan borrado o que sea de otra tienda. Revisa tu lista de pedidos.
        </p>
        <Link href="/pedidos" className={buttonVariants({ className: "mt-8" })}>
          Ver mis pedidos
        </Link>
      </div>
    </>
  );
}
