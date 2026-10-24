import type { PrismaClient } from "@prisma/client";
import { getRetryAfterSeconds } from "@/lib/reset-guard";

type ResetSlot = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Aparta el turno para restablecer los datos. Si el último reinicio fue hace menos de
 * `cooldownSeconds`, no aparta nada y regresa cuántos segundos faltan.
 * Es una sola sentencia SQL: si llegan dos peticiones al mismo tiempo, solo una gana.
 */
export async function claimResetSlot(prisma: PrismaClient, cooldownSeconds: number): Promise<ResetSlot> {
  const claimed = await prisma.$executeRaw`
    INSERT INTO "DataReset" ("id", "lastResetAt") VALUES (1, now() AT TIME ZONE 'UTC')
    ON CONFLICT ("id") DO UPDATE SET "lastResetAt" = EXCLUDED."lastResetAt"
    WHERE "DataReset"."lastResetAt" <= EXCLUDED."lastResetAt" - ${cooldownSeconds}::int * interval '1 second'`;
  if (claimed > 0) return { ok: true };

  const last = await prisma.dataReset.findUnique({ where: { id: 1 } });
  const retryAfterSeconds = getRetryAfterSeconds(last?.lastResetAt ?? null, new Date(), cooldownSeconds);
  return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
}
