import type { ActionResult } from "@/lib/action-result";

// Ejecuta una acción del servidor y convierte cualquier falla en un mensaje entendible.
// Si se cae el internet, el navegador da errores en inglés ("Failed to fetch"); aquí los cambiamos.
export async function runAction<T>(action: () => Promise<ActionResult<T>>, fallbackMessage: string): Promise<T> {
  let result: ActionResult<T>;
  try {
    result = await action();
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!result.ok) throw new Error(result.message);
  return result.data;
}