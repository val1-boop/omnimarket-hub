"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LiveSearchProps = {
  /** Página que se busca, por ejemplo "/pedidos". */
  path: string;
  /** Lo que ya está buscado (viene de la dirección). */
  defaultValue: string;
  /** Otros filtros que se conservan al buscar (paso, orden). */
  keep?: Record<string, string>;
  placeholder: string;
  label: string;
};

// Cuánto se espera después de la última tecla antes de buscar (para no buscar letra por letra).
const DELAY_MS = 350;

// Buscador que busca mientras escribes. La búsqueda queda en la dirección (?q=…), así se puede
// recargar o compartir. Sigue siendo un formulario: con Enter o "Buscar" busca de inmediato,
// y funciona aunque el JavaScript no haya terminado de cargar.
export function LiveSearch({ path, defaultValue, keep = {}, placeholder, label }: LiveSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSearched = useRef(defaultValue.trim());

  // Si la búsqueda cambia desde fuera (por ejemplo, al tocar "Pedidos" en el menú), el campo se
  // pone igual. Las búsquedas que hace este mismo campo no lo reinician mientras escribes.
  const [previousDefault, setPreviousDefault] = useState(defaultValue);
  if (defaultValue !== previousDefault) {
    setPreviousDefault(defaultValue);
    if (defaultValue.trim() !== lastSearched.current) {
      lastSearched.current = defaultValue.trim();
      setValue(defaultValue);
    }
  }

  const search = (text: string) => {
    clearTimeout(timer.current);
    const query = text.trim();
    if (query === lastSearched.current) return;
    lastSearched.current = query;
    const params = new URLSearchParams(keep);
    if (query) params.set("q", query);
    const qs = params.toString();
    // replace: cada letra no deja una entrada en "Atrás"; al cambiar la búsqueda se vuelve a la página 1.
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <form
      action={path}
      role="search"
      className="mb-4 flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        search(value);
      }}
    >
      {Object.entries(keep).map(([name, keptValue]) => (
        <input key={name} type="hidden" name={name} value={keptValue} />
      ))}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input
          name="q"
          type="search"
          value={value}
          onChange={(event) => {
            const text = event.target.value;
            setValue(text);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => search(text), DELAY_MS);
          }}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Buscar</Button>
        {value && (
          <Button
            variant="ghost"
            className="text-slate-500"
            onClick={() => {
              setValue("");
              search("");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>
    </form>
  );
}
