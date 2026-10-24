import { describe, expect, it } from "vitest";
import { DEMO_STORE_ID, parseStoreChoice } from "@/lib/stores";

describe("tienda activa", () => {
  it("solo acepta “demo”; cualquier otro valor es la tienda propia", () => {
    expect(parseStoreChoice("demo")).toBe("demo");
    expect(parseStoreChoice("mia")).toBe("mia");
    expect(parseStoreChoice(undefined)).toBe("mia");
    expect(parseStoreChoice("")).toBe("mia");
    // Aunque alguien ponga en la cookie el id de otra tienda, no se usa: sigue siendo la propia.
    expect(parseStoreChoice(DEMO_STORE_ID)).toBe("mia");
    expect(parseStoreChoice("clx0otratienda000")).toBe("mia");
  });
});
