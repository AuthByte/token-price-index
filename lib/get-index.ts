import { cacheLife } from "next/cache";
import { computeHistory, computeIndex } from "./compute-index";
import { fetchChartWeeks, fetchModels, fetchRankings } from "./openrouter";
import type { IndexSnapshot } from "./types";

export async function getIndexSnapshot(): Promise<IndexSnapshot> {
  "use cache";
  cacheLife("hours");

  const [rankings, models, weeks] = await Promise.all([
    fetchRankings(),
    fetchModels(),
    fetchChartWeeks(),
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
  };
}
