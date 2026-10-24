import { describe, expect, it } from "vitest";
import {
  DEFAULT_RESET_COOLDOWN_SECONDS,
  getResetCooldownSeconds,
  getRetryAfterSeconds,
  isCrossSiteRequest,
} from "@/lib/reset-guard";

describe("protección de reset-data", () => {
  it("pide esperar entre reinicios en producción y no en desarrollo", () => {
    expect(getResetCooldownSeconds({ NODE_ENV: "production" })).toBe(DEFAULT_RESET_COOLDOWN_SECONDS);
    expect(getResetCooldownSeconds({ NODE_ENV: "development" })).toBe(0);
    expect(getResetCooldownSeconds({ NODE_ENV: "production", RESET_COOLDOWN_SECONDS: "0" })).toBe(0);
    expect(getResetCooldownSeconds({ NODE_ENV: "development", RESET_COOLDOWN_SECONDS: "30" })).toBe(30);
    // Un valor raro no apaga la protección.
    expect(getResetCooldownSeconds({ NODE_ENV: "production", RESET_COOLDOWN_SECONDS: "-5" })).toBe(15);
  });

  it("calcula cuántos segundos faltan para el siguiente reinicio", () => {
    const last = new Date("2026-10-24T12:00:00.000Z");
    expect(getRetryAfterSeconds(null, last, 15)).toBe(0);
    expect(getRetryAfterSeconds(last, new Date("2026-10-24T12:00:04.200Z"), 15)).toBe(11);
    expect(getRetryAfterSeconds(last, new Date("2026-10-24T12:00:15.000Z"), 15)).toBe(0);
    expect(getRetryAfterSeconds(last, new Date("2026-10-24T12:01:00.000Z"), 15)).toBe(0);
  });

  it("deja pasar curl, Postman y la misma app, pero no a otras páginas web", () => {
    const host = "omnimarket-hub-brown.vercel.app";
    expect(isCrossSiteRequest(new Headers({ host }))).toBe(false);
    expect(isCrossSiteRequest(new Headers({ host, origin: `https://${host}` }))).toBe(false);
    expect(isCrossSiteRequest(new Headers({ host, origin: "https://sitio-ajeno.com" }))).toBe(true);
    expect(isCrossSiteRequest(new Headers({ host, origin: "null" }))).toBe(true);
    expect(isCrossSiteRequest(new Headers({ host, "sec-fetch-site": "cross-site" }))).toBe(true);
    expect(isCrossSiteRequest(new Headers({ host: "localhost:3000", "x-forwarded-host": host, origin: `https://${host}` }))).toBe(false);
  });
});
