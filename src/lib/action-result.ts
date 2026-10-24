// Respuesta de las acciones del servidor: o salió bien, o trae un mensaje para la persona.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };