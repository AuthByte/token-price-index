import { cacheLife } from "next/cache";
import { computeGpuIndex } from "./compute-gpu";
import { computeHistory, computeIndex } from "./compute-index";
import { fetchGpuSnapshot } from "./gpu-prices";
import { fetchChartWeeks, fetchModels, fetchRankings } from "./openrouter";
import type { IndexSnapshot } from "./types";

export async function getIndexSnapshot(): Promise<IndexSnapshot> {
  "use cache";
  cacheLife("hours");

  const [rankings, models, weeks, gpu] = await Promise.all([
    fetchRankings(),
    fetchModels(),
    fetchChartWeeks(),
    fetchGpuSnapshot().catch(() => null),
  ]);

  const snapshot = computeIndex({
    rankings,
    models,
    fetchedAt: new Date().toISOString(),
  });

  const promptShare =
    snapshot.paid.tokens > 0
      ? snapshot.paid.promptTokens / snapshot.paid.tokens
      : 0.97;

  return {
    ...snapshot,
    history: computeHistory({
      weeks,
      models,
      promptShare,
    }),
    compute: gpu ? computeGpuIndex(gpu) : null,
  };
}
