import { cacheLife } from "next/cache";
import { computeIndex } from "./compute-index";
import { fetchModels, fetchRankings } from "./openrouter";
import type { IndexSnapshot } from "./types";

export async function getIndexSnapshot(): Promise<IndexSnapshot> {
  "use cache";
  cacheLife("hours");

  const [rankings, models] = await Promise.all([
    fetchRankings(),
    fetchModels(),
  ]);

  return computeIndex({
    rankings,
    models,
    fetchedAt: new Date().toISOString(),
  });
}
