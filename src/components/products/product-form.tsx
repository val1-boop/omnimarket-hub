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
import { SavingSkeleton } from "@/components/ui/skeleton";
import { ProductPhotoField } from "@/components/products/product-photo-field";
import { calculateMargin, pesosToCents } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import { resizeImage } from "@/lib/resize-image";
import { runAction } from "@/lib/run-action";
import { PRODUCT_CATEGORIES, productSchema, type ProductInput } from "@/lib/validation/product";
import { createProduct, deleteProduct, removeProductImage, updateProduct, uploadProductImage } from "@/server/actions/products";

type ProductFormProps = {
  /** Si viene un producto, el formulario edita; si no, crea uno nuevo. */
  product?: ProductInput & { id: string; imageUrl: string | null };
};

function uploadPhoto(id: string, photo: Blob) {
  const formData = new FormData();
  formData.append("foto", photo, "foto");
  return runAction(() => uploadProductImage(id, formData), "No pudimos subir la foto. Revisa tu conexión.");
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Los valores iniciales también van en cada campo (defaultValue) para que la página
  // llegue ya llena desde el servidor, sin verse vacía un instante mientras carga.
  const defaults = product ?? { name: "", category: undefined, price: undefined, cost: undefined, stock: 0 };
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults,
  });

  // Vista previa de cuánto le ganas, mientras escribes.
  const [price, cost, name, category] = useWatch({ control, name: ["price", "cost", "name", "category"] });
  // Al crear, la foto elegida espera aquí y se sube en cuanto se guarda el producto.
  const [pendingPhoto, setPendingPhoto] = useState<Blob | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const priceCents = Number.isFinite(price) ? pesosToCents(price) : 0;
  const costCents = Number.isFinite(cost) ? pesosToCents(cost) : 0;

  const save = useMutation({
    mutationFn: async (values: ProductInput) => {
      if (product) {
        return runAction(() => updateProduct(product.id, values), "No pudimos guardar el producto. Revisa tu conexión.");
      }
      const created = await runAction(() => createProduct(values), "No pudimos guardar el producto. Revisa tu conexión.");
      if (pendingPhoto) {
        try {
          await uploadPhoto(created.id, pendingPhoto);
        } catch {
          toast.error("El producto se guardó, pero la foto no. Ábrelo para volver a subirla.");
        }
      }
      return created;
    },
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

  // Al editar, la foto se guarda (o se quita) en cuanto la eliges, sin esperar a "Guardar cambios".
  const photo = useMutation({
    mutationFn: async (file: File | null) => {
      if (!product) return null;
      if (!file) return runAction(() => removeProductImage(product.id), "No pudimos quitar la foto. Revisa tu conexión.");
      return uploadPhoto(product.id, await resizeImage(file));
    },
    onSuccess: (_data, file) => {
      toast.success(file ? "Guardamos la foto." : "Quitamos la foto.");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const pickPhoto = async (file: File) => {
    if (product) return photo.mutate(file);
    setPreparingPhoto(true);
    try {
      setPendingPhoto(await resizeImage(file));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPreparingPhoto(false);
    }
  };

  const busy = save.isPending || remove.isPending || photo.isPending || preparingPhoto;

  return (
    <form
      onSubmit={handleSubmit((values) => save.mutate(values))}
      noValidate
      aria-busy={busy || undefined}
      className="grid gap-6 lg:grid-cols-3"
    >
      <Card className="lg:col-span-2">
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <ProductPhotoField
            name={name ?? ""}
            category={category ?? ""}
            imageUrl={product?.imageUrl ?? null}
            pending={pendingPhoto}
            busy={photo.isPending || preparingPhoto}
            onPick={pickPhoto}
            onRemove={() => (product ? photo.mutate(null) : setPendingPhoto(null))}
          />
          <div className="sm:col-span-2">
            <Field label="Nombre del producto" htmlFor="name" error={errors.name?.message}>
              <Input id="name" placeholder="Ej. Termo de acero 750 ml" aria-invalid={Boolean(errors.name)} defaultValue={defaults.name} {...register("name")} />
            </Field>
          </div>
          <Field label="Categoría" htmlFor="category" error={errors.category?.message}>
            <Select id="category" aria-invalid={Boolean(errors.category)} defaultValue={defaults.category} {...register("category")}>
              <option value="">Elige una…</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Piezas en inventario" htmlFor="stock" error={errors.stock?.message}>
            <Input id="stock" type="number" min={0} step={1} aria-invalid={Boolean(errors.stock)} defaultValue={defaults.stock} {...register("stock", { valueAsNumber: true })} />
          </Field>
          <Field label="Precio de venta (MXN)" htmlFor="price" error={errors.price?.message} hint="Lo que paga tu cliente">
            <Input id="price" type="number" min={0} step="0.01" placeholder="0.00" aria-invalid={Boolean(errors.price)} defaultValue={defaults.price} {...register("price", { valueAsNumber: true })} />
          </Field>
          <Field label="Lo que te cuesta (MXN)" htmlFor="cost" error={errors.cost?.message} hint="Lo que pagas tú por él">
            <Input id="cost" type="number" min={0} step="0.01" placeholder="0.00" aria-invalid={Boolean(errors.cost)} defaultValue={defaults.cost} {...register("cost", { valueAsNumber: true })} />
          </Field>
        </CardContent>
      </Card>

      <Card className="h-fit bg-lilac-50">
        <CardContent className="space-y-4">
          <p className="font-display text-base font-bold text-ink-900">Lo que ganas</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Por pieza</span>
            <span className="font-display text-2xl font-extrabold text-ink-900">
              {formatCurrency(Math.max(priceCents - costCents, 0))}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Margen</span>
            <span className="text-sm font-semibold text-ink-900">
              {formatPercent(Math.max(calculateMargin(priceCents, costCents), 0), 0)}
            </span>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {save.isPending ? <SavingSkeleton className="w-28 bg-white/40" /> : product ? "Guardar cambios" : "Agregar producto"}
          </Button>
          <Link href="/productos" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
            Cancelar
          </Link>
          {product && (
            <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-50" disabled={busy} onClick={() => setConfirmOpen(true)}>
              {remove.isPending ? (
                <SavingSkeleton className="w-28 bg-rose-200" label="Borrando…" />
              ) : (
                <>
                  <Trash2 aria-hidden="true" />
                  Borrar producto
                </>
              )}
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