import { describe, expect, it } from "vitest";
import {
  buildOrderOrderBy,
  buildOrderWhere,
  filterProducts,
  normalizeText,
  ORDER_SORTS,
  parseOrderFilters,
  parseOrderNumber,
} from "@/lib/filters";

const products = [
  { name: "Audífonos Inalámbricos Pro", sku: "OM-ELE-001", category: "Electrónica" },
  { name: "Tenis Running Air", sku: "OM-ROP-010", category: "Ropa" },
  { name: "Gorra Deportiva", sku: "OM-ROP-011", category: "Ropa" },
];

describe("lógica de filtrado", () => {
  it("lee los filtros de la dirección y usa valores por defecto si vienen mal", () => {
    expect(parseOrderFilters({ q: " ana ", status: "PENDING", page: "2", orden: "mayor" })).toEqual({
      q: "ana",
      status: "PENDING",
      page: 2,
      sort: "mayor",
    });
    expect(parseOrderFilters({ status: "NO-EXISTE", page: "-5", orden: "lo-que-sea" })).toEqual({
      q: "",
      status: undefined,
      page: 1,
      sort: "recientes",
    });
  });

  it("ordena por fecha, total o cliente y siempre desempata con el número de pedido", () => {
    expect(buildOrderOrderBy("recientes")).toEqual([{ createdAt: "desc" }, { number: "desc" }]);
    expect(buildOrderOrderBy("mayor")).toEqual([{ totalCents: "desc" }, { number: "desc" }]);
    expect(buildOrderOrderBy("cliente")[0]).toEqual({ customer: { name: "asc" } });
    // Así una página nunca repite ni se salta pedidos con la misma fecha o el mismo total.
    for (const sort of ORDER_SORTS) expect(JSON.stringify(buildOrderOrderBy(sort).at(-1))).toContain("number");
  });

  it("reconoce números de pedido escritos de varias formas", () => {
    expect(parseOrderNumber("OM-00042")).toBe(42);
    expect(parseOrderNumber("om42")).toBe(42);
    expect(parseOrderNumber("42")).toBe(42);
    expect(parseOrderNumber("Ana")).toBeNull();
  });

  it("arma la búsqueda por número de pedido o por nombre del cliente", () => {
    expect(buildOrderWhere({ q: "OM-00042", status: "SHIPPED" })).toEqual({
      status: "SHIPPED",
      OR: [{ number: 42 }],
    });
    expect(buildOrderWhere({ q: "ana" })).toEqual({
      OR: [{ customer: { name: { contains: "ana", mode: "insensitive" } } }],
    });
    expect(buildOrderWhere({ q: "" })).toEqual({});
  });

  it("filtra productos por categoría y por texto sin importar acentos ni mayúsculas", () => {
    expect(normalizeText("Electrónica")).toBe("electronica");
    expect(filterProducts(products, { category: "Ropa" }).map((p) => p.sku)).toEqual(["OM-ROP-010", "OM-ROP-011"]);
    expect(filterProducts(products, { query: "AUDIFONOS" }).map((p) => p.sku)).toEqual(["OM-ELE-001"]);
    expect(filterProducts(products, { category: "Ropa", query: "rop-011" }).map((p) => p.sku)).toEqual(["OM-ROP-011"]);
    expect(filterProducts(products, { query: "zzz" })).toEqual([]);
  });
});
