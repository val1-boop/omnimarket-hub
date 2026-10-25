"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SavingSkeleton } from "@/components/ui/skeleton";
import { runAction } from "@/lib/run-action";
import { customerSchema, type CustomerInput, type CustomerValues } from "@/lib/validation/customer";
import { createCustomer, deleteCustomer, updateCustomer } from "@/server/actions/customers";

type CustomerFormProps = {
  /** Si viene un cliente, el formulario edita; si no, crea uno nuevo. */
  customer?: { id: string; name: string; city: string; email: string | null; orderCount: number };
};

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Igual que en productos: los valores van también en cada campo para que la página llegue ya llena.
  const defaults: CustomerInput = { name: customer?.name ?? "", city: customer?.city ?? "", email: customer?.email ?? "" };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput, unknown, CustomerValues>({ resolver: zodResolver(customerSchema), defaultValues: defaults });

  const save = useMutation({
    mutationFn: (values: CustomerValues) =>
      runAction(
        () => (customer ? updateCustomer(customer.id, values) : createCustomer(values)),
        "No pudimos guardar al cliente. Revisa tu conexión.",
      ),
    onSuccess: ({ name }) => {
      toast.success(customer ? `Guardamos los cambios de ${name}.` : `¡Listo! Agregamos a ${name}.`);
      if (customer) router.refresh();
      else router.push("/clientes");
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => runAction(() => deleteCustomer(id), "No pudimos borrar al cliente. Revisa tu conexión."),
    onSuccess: ({ name }) => {
      toast.success(`Quitamos a ${name} de tus clientes.`);
      router.push("/clientes");
    },
    onError: (error) => toast.error(error.message),
  });

  const busy = save.isPending || remove.isPending;
  const canDelete = customer && customer.orderCount === 0;

  return (
    <Card>
      <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate aria-busy={busy || undefined}>
        <CardContent className="space-y-5">
          <Field label="Nombre" htmlFor="customerName" error={errors.name?.message}>
            <Input id="customerName" placeholder="Ej. Laura Méndez" aria-invalid={Boolean(errors.name)} defaultValue={defaults.name} {...register("name")} />
          </Field>
          <Field label="Ciudad" htmlFor="customerCity" error={errors.city?.message}>
            <Input id="customerCity" placeholder="Ej. Cuernavaca" aria-invalid={Boolean(errors.city)} defaultValue={defaults.city} {...register("city")} />
          </Field>
          <Field label="Correo (opcional)" htmlFor="customerEmail" error={errors.email?.message}>
            <Input id="customerEmail" type="email" inputMode="email" autoComplete="off" placeholder="nombre@correo.com" aria-invalid={Boolean(errors.email)} defaultValue={defaults.email ?? ""} {...register("email")} />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {save.isPending ? <SavingSkeleton className="w-28 bg-white/40" /> : customer ? "Guardar cambios" : "Agregar cliente"}
          </Button>
          {!customer && (
            <Link href="/clientes" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
              Cancelar
            </Link>
          )}
          {customer &&
            (canDelete ? (
              <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-50" disabled={busy} onClick={() => setConfirmOpen(true)}>
                {remove.isPending ? (
                  <SavingSkeleton className="w-28 bg-rose-200" label="Borrando…" />
                ) : (
                  <>
                    <Trash2 aria-hidden="true" />
                    Borrar cliente
                  </>
                )}
              </Button>
            ) : (
              <p className="text-center text-xs text-slate-500">Tiene pedidos, por eso no se puede borrar.</p>
            ))}
        </CardContent>
      </form>

      {customer && (
        <ConfirmDialog
          open={confirmOpen}
          title={`¿Borrar a ${customer.name}?`}
          description="Desaparece de tu lista de clientes para siempre."
          confirmLabel="Sí, borrar"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            remove.mutate(customer.id);
          }}
        />
      )}
    </Card>
  );
}
