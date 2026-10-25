"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { SavingSkeleton } from "@/components/ui/skeleton";
import { calculateOrderTotals } from "@/lib/finance";
import { formatCurrency, formatOrderNumber } from "@/lib/format";
import { runAction } from "@/lib/run-action";
import { NEW_CUSTOMER, orderSchema, type OrderInput } from "@/lib/validation/order";
import { createOrder } from "@/server/actions/orders";

type OrderFormProps = {
  customers: { id: string; name: string; city: string }[];
  products: { id: string; name: string; priceCents: number; costCents: number; stock: number }[];
};

export function OrderForm({ customers, products }: OrderFormProps) {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    // Si la tienda todavía no tiene clientes, el formulario empieza en "Cliente nuevo".
    defaultValues: {
      customerId: customers.length === 0 ? NEW_CUSTOMER : "",
      newCustomer: { name: "", city: "" },
      items: [{ productId: "", quantity: 1 }],
    },
  });
  const customerId = useWatch({ control, name: "customerId" });
  const isNewCustomer = customerId === NEW_CUSTOMER;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });

  // Total en vivo mientras se llena el pedido.
  const lines = (items ?? []).flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
    return product ? [{ quantity, unitPriceCents: product.priceCents, unitCostCents: product.costCents }] : [];
  });
  const { totalCents } = calculateOrderTotals(lines);

  const create = useMutation({
    mutationFn: (values: OrderInput) =>
      runAction(() => createOrder(values), "No pudimos crear el pedido. Revisa tu conexión."),
    onSuccess: ({ number }) => {
      toast.success(`¡Listo! Creamos el pedido ${formatOrderNumber(number)}.`);
      router.push("/pedidos");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => create.mutate(values))}
      noValidate
      aria-busy={create.isPending || undefined}
      className="grid gap-6 lg:grid-cols-3"
    >
      <Card className="lg:col-span-2">
        <CardContent className="space-y-6">
          <Field label="¿Para quién es?" htmlFor="customerId" error={errors.customerId?.message}>
            <Select
              id="customerId"
              aria-invalid={Boolean(errors.customerId)}
              defaultValue={customers.length === 0 ? NEW_CUSTOMER : ""}
              {...register("customerId")}
            >
              <option value="">Elige un cliente…</option>
              <option value={NEW_CUSTOMER}>+ Cliente nuevo</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.city}
                </option>
              ))}
            </Select>
          </Field>

          {isNewCustomer && (
            <div className="grid gap-4 rounded-xl bg-lilac-50 p-4 sm:grid-cols-2" data-testid="new-customer">
              <Field label="Nombre del cliente" htmlFor="newCustomerName" error={errors.newCustomer?.name?.message}>
                <Input
                  id="newCustomerName"
                  placeholder="Ej. Laura Méndez"
                  aria-invalid={Boolean(errors.newCustomer?.name)}
                  {...register("newCustomer.name")}
                />
              </Field>
              <Field label="Ciudad" htmlFor="newCustomerCity" error={errors.newCustomer?.city?.message}>
                <Input
                  id="newCustomerCity"
                  placeholder="Ej. Cuernavaca"
                  aria-invalid={Boolean(errors.newCustomer?.city)}
                  {...register("newCustomer.city")}
                />
              </Field>
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-ink-900">¿Qué se lleva?</legend>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_6rem_auto] items-start gap-3">
                <div>
                  <Select
                    aria-label={`Producto ${index + 1}`}
                    aria-invalid={Boolean(errors.items?.[index]?.productId)}
                    defaultValue={field.productId}
                    {...register(`items.${index}.productId`)}
                  >
                    <option value="">Elige un producto…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                        {product.name} · {formatCurrency(product.priceCents)}
                        {product.stock <= 0 ? " · agotado" : ""}
                      </option>
                    ))}
                  </Select>
                  <StockHint product={products.find((p) => p.id === items?.[index]?.productId)} quantity={items?.[index]?.quantity} />
                  {errors.items?.[index]?.productId && (
                    <p role="alert" className="mt-1 text-xs text-rose-600">
                      {errors.items[index].productId.message}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    aria-label={`Cantidad del producto ${index + 1}`}
                    aria-invalid={Boolean(errors.items?.[index]?.quantity)}
                    defaultValue={field.quantity}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p role="alert" className="mt-1 text-xs text-rose-600">
                      {errors.items[index].quantity.message}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label={`Quitar el producto ${index + 1}`}
                  title="Quitar"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {errors.items?.root?.message && (
              <p role="alert" className="text-xs text-rose-600">
                {errors.items.root.message}
              </p>
            )}
            {errors.items?.message && (
              <p role="alert" className="text-xs text-rose-600">
                {errors.items.message}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => append({ productId: "", quantity: 1 })}
              disabled={fields.length >= 20}
            >
              <Plus aria-hidden="true" />
              Agregar otro producto
            </Button>
          </fieldset>
        </CardContent>
      </Card>

      <Card className="h-fit bg-lilac-50">
        <CardContent className="space-y-4">
          <p className="font-display text-base font-bold text-ink-900">Resumen</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Total a cobrar</span>
            <span className="font-display text-2xl font-extrabold text-ink-900" data-testid="order-total">
              {formatCurrency(totalCents)}
            </span>
          </div>
          <p className="text-xs text-slate-500">El pedido entra al tablero en el paso “Por preparar”.</p>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? <SavingSkeleton className="w-28 bg-white/40" label="Creando pedido…" /> : "Crear pedido"}
          </Button>
          <Link href="/pedidos" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
            Cancelar
          </Link>
        </CardContent>
      </Card>
    </form>
  );
}
// Debajo del producto elegido: cuántas piezas hay, y un aviso si se piden más de las que hay.
function StockHint({ product, quantity }: { product?: { stock: number }; quantity?: number }) {
  if (!product) return null;
  const tooMany = Number.isFinite(quantity) && (quantity ?? 0) > product.stock;
  return (
    <p className={tooMany ? "mt-1 text-xs font-medium text-rose-600" : "mt-1 text-xs text-slate-500"} data-testid="stock-hint">
      {tooMany
        ? `Solo ${product.stock === 1 ? "queda 1 pieza" : `quedan ${product.stock} piezas`}`
        : `${product.stock === 1 ? "Queda 1 pieza" : `Quedan ${product.stock} piezas`} en inventario`}
    </p>
  );
}
