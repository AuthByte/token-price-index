import { parseChartWeeks, parseModelRecord, parseOpenRouterList, parseRankingRow } from "./parse";
import type { ChartWeek, ModelRecord, RankingRow } from "./types";

const RANKINGS_URL = "https://openrouter.ai/api/frontend/v1/rankings/models";
const CHART_URL = "https://openrouter.ai/api/frontend/v1/rankings/model-rankings-chart";
const MODELS_URL = "https://openrouter.ai/api/v1/models";
const USER_AGENT =
  "TokenPriceIndex/1.0 (https://github.com/AuthByte/token-price-index)";

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

export async function fetchRankings(): Promise<RankingRow[]> {
  const payload = await fetchJson(RANKINGS_URL);
  const rows: RankingRow[] = [];
  for (const item of parseOpenRouterList(payload)) {
    const row = parseRankingRow(item);
    if (row) {
      rows.push(row);
    }
  }
  if (rows.length === 0) {
    throw new Error("OpenRouter rankings returned no usable rows");
  }
  return rows;
}

export async function fetchModels(): Promise<ModelRecord[]> {
  const payload = await fetchJson(MODELS_URL);
  const models: ModelRecord[] = [];
  for (const item of parseOpenRouterList(payload)) {
    const model = parseModelRecord(item);
    if (model) {
      models.push(model);
    }
  }
  if (models.length === 0) {
    throw new Error("OpenRouter models returned no usable pricing");
  }
  return models;
}

export async function fetchChartWeeks(): Promise<ChartWeek[]> {
  const payload = await fetchJson(CHART_URL);
  const weeks = parseChartWeeks(payload);
  if (weeks.length === 0) {
    throw new Error("OpenRouter rankings chart returned no usable weeks");
  }
  return weeks;
}
