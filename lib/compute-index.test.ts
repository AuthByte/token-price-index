import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachWeeklyShares, computeHistory, computeIndex, pickShareOrder } from "./compute-index.ts";
import type { ModelRecord, RankingRow } from "./types.ts";

function row(partial: Partial<RankingRow> & Pick<RankingRow, "modelPermaslug" | "variantPermaslug" | "promptTokens" | "completionTokens">): RankingRow {
  return {
    date: "2026-08-13 00:00:00",
    variant: "standard",
    mediaPrompt: 0,
    imageOutputs: 0,
    videoSeconds: 0,
    rerankDocuments: 0,
    transcriptCharacters: 0,
    ...partial,
  };
}

function model(partial: ModelRecord): ModelRecord {
  return partial;
}

describe("computeIndex", () => {
  it("weights models by tokens actually used, not equally", () => {
    const snapshot = computeIndex({
      fetchedAt: "2026-08-14T00:00:00.000Z",
      models: [
        model({
          id: "cheap/flash",
          canonicalSlug: "cheap/flash-20260101",
          name: "Vendor: Flash",
          promptPrice: 0.0000001,
          completionPrice: 0.0000004,
        }),
        model({
          id: "dear/opus",
          canonicalSlug: "dear/opus-20260101",
          name: "Vendor: Opus",
          promptPrice: 0.000003,
          completionPrice: 0.000015,
        }),
      ],
      rankings: [
        row({
          modelPermaslug: "cheap/flash-20260101",
          variantPermaslug: "cheap/flash-20260101",
          promptTokens: 9_000_000,
          completionTokens: 1_000_000,
        }),
        row({
          modelPermaslug: "dear/opus-20260101",
          variantPermaslug: "dear/opus-20260101",
          promptTokens: 900_000,
          completionTokens: 100_000,
        }),
      ],
    });

    // 10M cheap tokens at $0.13/M blended + 1M dear tokens at $4.20/M
    // cheap blended = (9e6*1e-7 + 1e6*4e-7)/1e7 * 1e6 = 0.13
    // dear blended = (9e5*3e-6 + 1e5*1.5e-5)/1e6 * 1e6 = 4.20
    // spend = 10e6/1e6*0.13 + 1e6/1e6*4.20 = 1.30 + 4.20 = 5.50
    // tokens = 11e6, blended = 5.50 / 11 = 0.50
    assert.equal(snapshot.paid.tokens, 11_000_000);
    assert.ok(Math.abs(snapshot.paid.blendedPerMillion - 0.5) < 1e-9);
    assert.ok(Math.abs(snapshot.paid.index - 50) < 1e-6);
    assert.equal(snapshot.constituents[0]?.slug, "cheap/flash-20260101");
    assert.ok(Math.abs((snapshot.constituents[0]?.weight ?? 0) - 10 / 11) < 1e-9);
    assert.equal(snapshot.providers.length, 2);
    const cheapLab = snapshot.providers.find((row) => row.provider === "cheap");
    const dearLab = snapshot.providers.find((row) => row.provider === "dear");
    assert.ok(cheapLab);
    assert.ok(dearLab);
    assert.ok(Math.abs(cheapLab.index - 13) < 1e-6);
    assert.ok(Math.abs(dearLab.index - 420) < 1e-6);
    assert.ok(Math.abs(cheapLab.weight - 10 / 11) < 1e-9);
    assert.ok(Math.abs(dearLab.spendWeight - 4.2 / 5.5) < 1e-9);
  });

  it("drops free endpoints from the headline basket", () => {
    const snapshot = computeIndex({
      fetchedAt: "2026-08-14T00:00:00.000Z",
      models: [
        model({
          id: "lab/free",
          canonicalSlug: "lab/free-20260101",
          name: "Lab Free",
          promptPrice: 0,
          completionPrice: 0,
        }),
        model({
          id: "lab/paid",
          canonicalSlug: "lab/paid-20260101",
          name: "Lab Paid",
          promptPrice: 0.000001,
          completionPrice: 0.000002,
        }),
      ],
      rankings: [
        row({
          modelPermaslug: "lab/free-20260101",
          variantPermaslug: "lab/free-20260101:free",
          variant: "free",
          promptTokens: 100_000_000,
          completionTokens: 0,
        }),
        row({
          modelPermaslug: "lab/paid-20260101",
          variantPermaslug: "lab/paid-20260101",
          promptTokens: 1_000_000,
          completionTokens: 0,
        }),
      ],
    });

    assert.equal(snapshot.paid.tokens, 1_000_000);
    assert.equal(snapshot.paid.blendedPerMillion, 1);
    assert.equal(snapshot.paid.index, 100);
    assert.equal(snapshot.all.tokens, 101_000_000);
    assert.ok(snapshot.all.blendedPerMillion < 0.02);
  });

  it("skips image and ranking rows with no text tokens", () => {
    const snapshot = computeIndex({
      fetchedAt: "2026-08-14T00:00:00.000Z",
      models: [
        model({
          id: "studio/image",
          canonicalSlug: "studio/image-20260101",
          name: "Image",
          promptPrice: 0.04,
          completionPrice: 0,
        }),
      ],
      rankings: [
        row({
          modelPermaslug: "studio/image-20260101",
          variantPermaslug: "studio/image-20260101",
          promptTokens: 0,
          completionTokens: 0,
          imageOutputs: 400,
        }),
      ],
    });

    assert.equal(snapshot.matchedModels, 0);
    assert.equal(snapshot.paid.index, 0);
  });
});

describe("computeHistory", () => {
  it("rebuilds weekly TPI from named volumes and current prices", () => {
    const points = computeHistory({
      promptShare: 0.9,
      models: [
        model({
          id: "dear/opus",
          canonicalSlug: "dear/opus-20260101",
          name: "Opus",
          promptPrice: 0.000003,
          completionPrice: 0.000015,
        }),
        model({
          id: "cheap/flash",
          canonicalSlug: "cheap/flash-20260101",
          name: "Flash",
          promptPrice: 0.0000001,
          completionPrice: 0.0000004,
        }),
      ],
      weeks: [
        {
          date: "2025-08-18",
          volumes: { "dear/opus-20260101": 1_000_000 },
        },
        {
          date: "2026-08-10",
          volumes: { "cheap/flash-20260101": 9_000_000, "dear/opus-20260101": 1_000_000 },
        },
      ],
    });

    assert.equal(points.length, 2);
    assert.equal(points[0]?.date, "2025-08-18");
    // 0.9 * 3e-6 + 0.1 * 15e-6 = 4.2e-6 per token = $4.20 / M = index 420
    assert.ok(Math.abs((points[0]?.index ?? 0) - 420) < 1e-6);
    assert.ok((points[1]?.index ?? 0) < (points[0]?.index ?? 0));
  });

  it("skips free series so they cannot flatten the line", () => {
    const points = computeHistory({
      promptShare: 1,
      models: [
        model({
          id: "lab/free",
          canonicalSlug: "lab/free-20260101",
          name: "Free",
          promptPrice: 0,
          completionPrice: 0,
        }),
        model({
          id: "lab/paid",
          canonicalSlug: "lab/paid-20260101",
          name: "Paid",
          promptPrice: 0.000002,
          completionPrice: 0.000002,
        }),
      ],
      weeks: [
        {
          date: "2026-01-01",
          volumes: {
            "lab/free-20260101:free": 50_000_000,
            "lab/paid-20260101": 1_000_000,
          },
        },
      ],
    });

    assert.equal(points[0]?.index, 200);
    assert.equal(points[0]?.tokens, 1_000_000);
  });
});

describe("attachWeeklyShares", () => {
  it("turns lab volumes into 100 percent stacks and parks the tail in others", () => {
    const history = computeHistory({
      promptShare: 1,
      models: [
        {
          id: "deepseek/flash",
          canonicalSlug: "deepseek/flash",
          name: "Flash",
          promptPrice: 0.0000001,
          completionPrice: 0.0000001,
        },
      ],
      weeks: [
        { date: "2026-01-01", volumes: { "deepseek/flash": 1_000_000 } },
        { date: "2026-01-08", volumes: { "deepseek/flash": 1_000_000 } },
      ],
    });

    const points = attachWeeklyShares(history, [
      {
        date: "2026-01-01",
        volumes: { deepseek: 60, anthropic: 30, google: 10 },
      },
      {
        date: "2026-01-08",
        volumes: { deepseek: 80, anthropic: 10, others: 10, tiny: 5 },
      },
    ]);

    assert.deepEqual(pickShareOrder([
      { date: "2026-01-01", volumes: { deepseek: 60, anthropic: 30, google: 10 } },
      { date: "2026-01-08", volumes: { deepseek: 80, anthropic: 10, others: 10, tiny: 5 } },
    ]), ["deepseek", "anthropic", "google", "tiny", "others"]);

    const last = points[1];
    assert.ok(last);
    const deepseek = last.shares.find((row) => row.provider === "deepseek");
    const others = last.shares.find((row) => row.provider === "others");
    assert.ok(Math.abs((deepseek?.weight ?? 0) - 80 / 105) < 1e-9);
    assert.ok(Math.abs((others?.weight ?? 0) - 10 / 105) < 1e-9);
    const sum = last.shares.reduce((total, row) => total + row.weight, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
  });
});
