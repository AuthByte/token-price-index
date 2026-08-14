import { readUnknownArray } from "./parse";
import type { GpuOffer, GpuSnapshot } from "./types";

const GPU_URL = "https://gpurentalprices.com/api/latest.json";
const USER_AGENT =
  "TokenPriceIndex/1.0 (https://github.com/AuthByte/token-price-index)";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function parseOffer(value: unknown): GpuOffer | null {
  if (!isRecord(value)) {
    return null;
  }
  const provider = readString(value.provider);
  const gpu = readString(value.gpu);
  const usdHr = readNumber(value.usd_hr);
  const kind = readString(value.kind);
  if (provider === null || gpu === null || usdHr === null || kind === null) {
    return null;
  }
  return {
    provider,
    gpu,
    vramGb: readNumber(value.vram_gb) ?? 0,
    usdHr,
    kind,
  };
}

export function parseGpuSnapshot(payload: unknown): GpuSnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }
  const date = readString(payload.date);
  const generatedAt = readString(payload.generated_at);
  if (date === null || generatedAt === null) {
    return null;
  }
  const offers: GpuOffer[] = [];
  for (const item of readUnknownArray(payload.offers)) {
    const offer = parseOffer(item);
    if (offer) {
      offers.push(offer);
    }
  }
  if (offers.length === 0) {
    return null;
  }
  return { date, generatedAt, offers };
}

export async function fetchGpuSnapshot(): Promise<GpuSnapshot | null> {
  const response = await fetch(GPU_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) {
    throw new Error(`GPU rental prices request failed (${response.status})`);
  }
  return parseGpuSnapshot(await response.json());
}
