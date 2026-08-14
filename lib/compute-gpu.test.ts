import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeGpuIndex, median } from "./compute-gpu.ts";
import type { GpuOffer } from "./types.ts";

function offer(partial: Partial<GpuOffer> & Pick<GpuOffer, "provider" | "gpu" | "usdHr">): GpuOffer {
  return {
    vramGb: 80,
    kind: "on-demand",
    ...partial,
  };
}

describe("median", () => {
  it("averages the middle pair on an even list", () => {
    assert.equal(median([1, 3, 4, 2]), 2.5);
  });
});

describe("computeGpuIndex", () => {
  it("takes each cloud's cheapest firm H100 and reports the median", () => {
    const snapshot = computeGpuIndex({
      date: "2026-08-14",
      generatedAt: "2026-08-14T06:47:10.666Z",
      offers: [
        offer({ provider: "lambda", gpu: "h100-pcie", usdHr: 3.29 }),
        offer({ provider: "lambda", gpu: "h100-sxm", usdHr: 3.79 }),
        offer({ provider: "runpod", gpu: "h100-pcie", usdHr: 2.89, kind: "secure" }),
        offer({ provider: "runpod", gpu: "h100-pcie", usdHr: 1.99, kind: "community" }),
        offer({ provider: "aws", gpu: "h100-sxm", usdHr: 12.29 }),
        offer({ provider: "coreweave", gpu: "h200", usdHr: 6.3 }),
        offer({ provider: "gmicloud", gpu: "h200", usdHr: 2.6 }),
      ],
    });

    assert.ok(snapshot);
    assert.equal(snapshot.headline.gpu, "h100");
    assert.equal(snapshot.headline.providersPriced, 3);
    // cheapest per cloud: runpod 2.89, lambda 3.29, aws 12.29 → median 3.29
    assert.equal(snapshot.headline.usdHr, 3.29);
    assert.equal(snapshot.headline.index, 329);
    assert.equal(snapshot.headline.quotes[0]?.provider, "runpod");
    assert.equal(snapshot.headline.quotes[0]?.usdHr, 2.89);

    const h200 = snapshot.series.find((row) => row.gpu === "h200");
    assert.ok(h200);
    assert.equal(h200.usdHr, 4.45);
    assert.equal(h200.providersPriced, 2);
  });

  it("ignores spot and serverless quotes so they cannot flatten the meter", () => {
    const snapshot = computeGpuIndex({
      date: "2026-08-14",
      generatedAt: "2026-08-14T06:47:10.666Z",
      offers: [
        offer({ provider: "vast", gpu: "h100", usdHr: 0.8, kind: "spot" }),
        offer({ provider: "modal", gpu: "h100", usdHr: 0.5, kind: "serverless" }),
        offer({ provider: "lambda", gpu: "h100", usdHr: 3.29 }),
      ],
    });

    assert.ok(snapshot);
    assert.equal(snapshot.headline.providersPriced, 1);
    assert.equal(snapshot.headline.usdHr, 3.29);
  });
});
