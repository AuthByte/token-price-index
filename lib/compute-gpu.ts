import type {
  ComputeIndex,
  ComputeQuote,
  ComputeSeries,
  GpuOffer,
  GpuSnapshot,
} from "./types";

/** Index 100 equals $1.00 per GPU-hour. */
export const COMPUTE_INDEX_SCALE = 100;
export const HEADLINE_GPU = "h100";

const FIRM_KINDS = new Set(["on-demand", "secure"]);

const FAMILIES: Array<{
  id: string;
  label: string;
  match: (gpu: string) => boolean;
}> = [
  { id: "h100", label: "H100", match: (gpu) => gpu.startsWith("h100") },
  { id: "h200", label: "H200", match: (gpu) => gpu.startsWith("h200") },
  { id: "b200", label: "B200", match: (gpu) => gpu.startsWith("b200") },
];

export function isFirmKind(kind: string): boolean {
  return FIRM_KINDS.has(kind);
}

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? 0;
  }
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function familyOf(gpu: string) {
  const id = gpu.toLowerCase();
  return FAMILIES.find((family) => family.match(id)) ?? null;
}

function cheapestByProvider(offers: GpuOffer[]): ComputeQuote[] {
  const best = new Map<string, ComputeQuote>();
  for (const offer of offers) {
    if (!isFirmKind(offer.kind) || !(offer.usdHr > 0)) {
      continue;
    }
    const current = best.get(offer.provider);
    if (!current || offer.usdHr < current.usdHr) {
      best.set(offer.provider, {
        provider: offer.provider,
        usdHr: offer.usdHr,
        gpu: offer.gpu,
        kind: offer.kind,
      });
    }
  }
  return [...best.values()].sort((a, b) => a.usdHr - b.usdHr);
}

function toSeries(
  id: string,
  label: string,
  quotes: ComputeQuote[],
): ComputeSeries | null {
  if (quotes.length === 0) {
    return null;
  }
  const usdHr = median(quotes.map((quote) => quote.usdHr));
  return {
    gpu: id,
    label,
    usdHr,
    index: usdHr * COMPUTE_INDEX_SCALE,
    providersPriced: quotes.length,
    quotes,
  };
}

export function computeGpuIndex(snapshot: GpuSnapshot): ComputeIndex | null {
  const series: ComputeSeries[] = [];

  for (const family of FAMILIES) {
    const offers = snapshot.offers.filter((offer) => familyOf(offer.gpu)?.id === family.id);
    const computed = toSeries(family.id, family.label, cheapestByProvider(offers));
    if (computed) {
      series.push(computed);
    }
  }

  const headline = series.find((row) => row.gpu === HEADLINE_GPU) ?? series[0];
  if (!headline) {
    return null;
  }

  return {
    asOf: snapshot.date,
    fetchedAt: snapshot.generatedAt,
    source: "GPU Rental Prices (gpurentalprices.com)",
    headline,
    series,
  };
}
