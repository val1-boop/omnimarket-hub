"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

type SortSelectProps = {
  id: string;
  value: string;
  /** Cada opción con su texto y la dirección de la lista ya ordenada así. */
  options: { value: string; label: string; href: string }[];
};

// Selector "Ordenar por": cambia la dirección (?orden=…) y la lista se vuelve a pedir ordenada.
export function SortSelect({ id, value, options }: SortSelectProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-sm text-slate-500">
        Ordenar por
      </label>
      <Select
        id={id}
        name="orden"
        value={value}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value);
          if (option) router.push(option.href, { scroll: false });
        }}
        className="h-9 w-auto min-w-44 rounded-full"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
