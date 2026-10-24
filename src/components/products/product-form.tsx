"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { calculateMargin, pesosToCents } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import { runAction } from "@/lib/run-action";
import { PRODUCT_CATEGORIES, productSchema, type ProductInput } from "@/lib/validation/product";
import { createProduct, deleteProduct, updateProduct } from "@/server/actions/products";

type ProductFormProps = {
  /** Si viene un producto, el formulario edita; si no, crea uno nuevo. */
  product?: ProductInput & { id: string };
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? { name: "", category: undefined, price: undefined, cost: undefined, stock: 0 },
  });

  // Vista previa de cuánto le ganas, mientras escribes.
  const [price, cost] = useWatch({ control, name: ["price", "cost"] });
  const priceCents = Number.isFinite(price) ? pesosToCents(price) : 0;
  const costCents = Number.isFinite(cost) ? pesosToCents(cost) : 0;

  const save = useMutation({
    mutationFn: (values: ProductInput) =>
      runAction(
        () => (product ? updateProduct(product.id, values) : createProduct(values)),
        "No pudimos guardar el producto. Revisa tu conexión.",
      ),
    onSuccess: ({ name }) => {
      toast.success(product ? `Guardamos los cambios de “${name}”.` : `¡Listo! Agregamos “${name}” a tu catálogo.`);
      router.push("/productos");
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => runAction(() => deleteProduct(id), "No pudimos borrar el producto. Revisa tu conexión."),
    onSuccess: ({ name }) => {
      toast.success(`Quitamos “${name}” de tu catálogo.`);
      router.push("/productos");
    },
    onError: (error) => toast.error(error.message),
  });

  const busy = save.isPending || remove.isPending;

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nombre del producto" htmlFor="name" error={errors.name?.message}>
              <Input id="name" placeholder="Ej. Termo de acero 750 ml" aria-invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
          </div>
          <Field label="Categoría" htmlFor="category" error={errors.category?.message}>
            <Select id="category" aria-invalid={Boolean(errors.category)} {...register("category")}>
              <option value="">Elige una…</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Piezas en inventario" htmlFor="stock" error={errors.stock?.message}>
            <Input id="stock" type="number" min={0} step={1} aria-invalid={Boolean(errors.stock)} {...register("stock", { valueAsNumber: true })} />
          </Field>
          <Field label="Precio de venta (MXN)" htmlFor="price" error={errors.price?.message} hint="Lo que paga tu cliente">
            <Input id="price" type="number" min={0} step="0.01" placeholder="0.00" aria-invalid={Boolean(errors.price)} {...register("price", { valueAsNumber: true })} />
          </Field>
          <Field label="Lo que te cuesta (MXN)" htmlFor="cost" error={errors.cost?.message} hint="Lo que pagas tú por él">
            <Input id="cost" type="number" min={0} step="0.01" placeholder="0.00" aria-invalid={Boolean(errors.cost)} {...register("cost", { valueAsNumber: true })} />
          </Field>
        </CardContent>
      </Card>

      <Card className="h-fit bg-sand-50">
        <CardContent className="space-y-4">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">Lo que ganas</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Por pieza</span>
            <span className="font-display text-2xl font-extrabold text-navy-900">
              {formatCurrency(Math.max(priceCents - costCents, 0))}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Margen</span>
            <span className="text-sm font-semibold text-navy-900">
              {formatPercent(Math.max(calculateMargin(priceCents, costCents), 0), 0)}
            </span>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {save.isPending ? "Guardando…" : product ? "Guardar cambios" : "Agregar producto"}
          </Button>
          <Link href="/productos" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
            Cancelar
          </Link>
          {product && (
            <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-50" disabled={busy} onClick={() => setConfirmOpen(true)}>
              <Trash2 aria-hidden="true" />
              Borrar producto
            </Button>
          )}
        </CardContent>
      </Card>

      {product && (
        <ConfirmDialog
          open={confirmOpen}
          title={`¿Borrar “${product.name}”?`}
          description="Desaparece de tu catálogo para siempre. Si ya está en algún pedido no se podrá borrar."
          confirmLabel="Sí, borrar"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            remove.mutate(product.id);
          }}
        />
      )}
    </form>
  );
}