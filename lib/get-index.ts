import { cacheLife } from "next/cache";
import { attachWeeklyShares, computeHistory, computeIndex, sharesFromModelWeeks } from "./compute-index";
import { computeGpuIndex } from "./compute-gpu";
import { fetchGpuSnapshot } from "./gpu-prices";
import { fetchChartWeeks, fetchMarketShare, fetchModels, fetchRankings } from "./openrouter";
import type { IndexSnapshot } from "./types";

export async function getIndexSnapshot(): Promise<IndexSnapshot> {
  "use cache";
  cacheLife("hours");

  const [rankings, models, weeks, gpu, market] = await Promise.all([
    fetchRankings(),
    fetchModels(),
    fetchChartWeeks(),
    fetchGpuSnapshot().catch(() => null),
    fetchMarketShare().catch(() => []),
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

  const history = computeHistory({
    weeks,
    models,
    promptShare,
  });

  const shareWeeks = market.length > 0 ? market : sharesFromModelWeeks(weeks);

  return {
    ...snapshot,
    history: attachWeeklyShares(history, shareWeeks),
    compute: gpu ? computeGpuIndex(gpu) : null,
  };
}
