import type {
  BasketStats,
  IndexBasket,
  ChartWeek,
  Constituent,
  HistoryPoint,
  LabShare,
  ModelRecord,
  ProviderShare,
  RankingRow,
} from "./types";

/** Index 100 equals $1.00 per million tokens. */
export const INDEX_DOLLARS_PER_MILLION = 1;
export const INDEX_SCALE = 100;
const TOKENS_PER_MILLION = 1_000_000;

export function providerFromSlug(slug: string): string {
  const slash = slug.indexOf("/");
  return slash === -1 ? slug : slug.slice(0, slash);
}

function slugKeys(slug: string): string[] {
  const keys = [slug];
  const colon = slug.lastIndexOf(":");
  if (colon > 0) {
    keys.push(slug.slice(0, colon));
  }
  for (const key of [...keys]) {
    const stripped = key.replace(/-\d{8}$/, "");
    if (stripped !== key) {
      keys.push(stripped);
    }
  }
  return keys;
}

function lookupKeys(row: RankingRow): string[] {
  return [...slugKeys(row.variantPermaslug), ...slugKeys(row.modelPermaslug)];
}

export function buildModelIndex(models: ModelRecord[]): Map<string, ModelRecord> {
  const map = new Map<string, ModelRecord>();
  for (const model of models) {
    map.set(model.id, model);
    if (model.canonicalSlug) {
      map.set(model.canonicalSlug, model);
    }
  }
  return map;
}

function findModel(
  row: RankingRow,
  models: Map<string, ModelRecord>,
): ModelRecord | null {
  for (const key of lookupKeys(row)) {
    const match = models.get(key);
    if (match) {
      return match;
    }
  }
  return null;
}

function findModelBySlug(
  slug: string,
  models: Map<string, ModelRecord>,
): ModelRecord | null {
  for (const key of slugKeys(slug)) {
    const match = models.get(key);
    if (match) {
      return match;
    }
  }
  return null;
}

function isNonTextRow(row: RankingRow): boolean {
  const tokens = row.promptTokens + row.completionTokens;
  if (tokens <= 0) {
    return true;
  }
  const otherWork =
    row.mediaPrompt +
    row.imageOutputs +
    row.videoSeconds +
    row.rerankDocuments +
    row.transcriptCharacters;
  return otherWork > 0 && tokens < otherWork;
}

function isFree(row: RankingRow, model: ModelRecord): boolean {
  return (
    row.variant === "free" ||
    (model.promptPrice === 0 && model.completionPrice === 0)
  );
}

type Acc = {
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  spendUsd: number;
  promptSpendUsd: number;
  completionSpendUsd: number;
};

function emptyAcc(): Acc {
  return {
    tokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    spendUsd: 0,
    promptSpendUsd: 0,
    completionSpendUsd: 0,
  };
}

function toBasket(acc: Acc): BasketStats {
  const blendedPerMillion =
    acc.tokens > 0 ? (acc.spendUsd / acc.tokens) * TOKENS_PER_MILLION : 0;
  const promptPerMillion =
    acc.promptTokens > 0
      ? (acc.promptSpendUsd / acc.promptTokens) * TOKENS_PER_MILLION
      : 0;
  const completionPerMillion =
    acc.completionTokens > 0
      ? (acc.completionSpendUsd / acc.completionTokens) * TOKENS_PER_MILLION
      : 0;

  return {
    tokens: acc.tokens,
    promptTokens: acc.promptTokens,
    completionTokens: acc.completionTokens,
    spendUsd: acc.spendUsd,
    blendedPerMillion,
    promptPerMillion,
    completionPerMillion,
    index: blendedPerMillion * INDEX_SCALE,
    promptIndex: promptPerMillion * INDEX_SCALE,
    completionIndex: completionPerMillion * INDEX_SCALE,
  };
}

function addRow(acc: Acc, constituent: Constituent) {
  acc.tokens += constituent.tokens;
  acc.promptTokens += constituent.promptTokens;
  acc.completionTokens += constituent.completionTokens;
  acc.spendUsd += constituent.spendUsd;
  acc.promptSpendUsd +=
    (constituent.promptPricePerMillion / TOKENS_PER_MILLION) *
    constituent.promptTokens;
  acc.completionSpendUsd +=
    (constituent.completionPricePerMillion / TOKENS_PER_MILLION) *
    constituent.completionTokens;
}

export function computeIndex({
  rankings,
  models,
  fetchedAt,
}: {
  rankings: RankingRow[];
  models: ModelRecord[];
  fetchedAt: string;
}): IndexBasket {
  const catalog = buildModelIndex(models);
  const rows: Omit<Constituent, "weight">[] = [];
  let unmatchedModels = 0;
  let asOf = "";

  for (const row of rankings) {
    if (isNonTextRow(row)) {
      continue;
    }
    const model = findModel(row, catalog);
    if (!model) {
      unmatchedModels += 1;
      continue;
    }

    if (row.date > asOf) {
      asOf = row.date;
    }

    const tokens = row.promptTokens + row.completionTokens;
    const spendUsd =
      row.promptTokens * model.promptPrice +
      row.completionTokens * model.completionPrice;
    const blendedPerMillion =
      tokens > 0 ? (spendUsd / tokens) * TOKENS_PER_MILLION : 0;

    rows.push({
      slug: row.variantPermaslug,
      name: model.name.replace(/^[^:]+:\s*/, ""),
      provider: providerFromSlug(row.modelPermaslug),
      variant: row.variant,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      tokens,
      promptPricePerMillion: model.promptPrice * TOKENS_PER_MILLION,
      completionPricePerMillion: model.completionPrice * TOKENS_PER_MILLION,
      blendedPerMillion,
      spendUsd,
      free: isFree(row, model),
    });
  }

  const paidAcc = emptyAcc();
  const allAcc = emptyAcc();
  for (const row of rows) {
    addRow(allAcc, { ...row, weight: 0 });
    if (!row.free) {
      addRow(paidAcc, { ...row, weight: 0 });
    }
  }

  const paid = toBasket(paidAcc);
  const all = toBasket(allAcc);
  const weightBase = paid.tokens > 0 ? paid.tokens : 1;

  const constituents: Constituent[] = rows
    .map((row) => ({
      ...row,
      weight: row.free ? 0 : row.tokens / weightBase,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const providerMap = new Map<string, { tokens: number; spendUsd: number }>();
  for (const row of constituents) {
    if (row.free) {
      continue;
    }
    const current = providerMap.get(row.provider) ?? { tokens: 0, spendUsd: 0 };
    current.tokens += row.tokens;
    current.spendUsd += row.spendUsd;
    providerMap.set(row.provider, current);
  }

  const providers: ProviderShare[] = [...providerMap.entries()]
    .map(([provider, value]) => {
      const blendedPerMillion =
        value.tokens > 0
          ? (value.spendUsd / value.tokens) * TOKENS_PER_MILLION
          : 0;
      return {
        provider,
        tokens: value.tokens,
        spendUsd: value.spendUsd,
        weight: paid.tokens > 0 ? value.tokens / paid.tokens : 0,
        spendWeight: paid.spendUsd > 0 ? value.spendUsd / paid.spendUsd : 0,
        blendedPerMillion,
        index: blendedPerMillion * INDEX_SCALE,
      };
    })
    .sort((a, b) => b.tokens - a.tokens);

  return {
    asOf: asOf.replace(" 00:00:00", ""),
    fetchedAt,
    source: "OpenRouter (openrouter.ai/rankings)",
    matchedModels: constituents.length,
    unmatchedModels,
    paid,
    all,
    providers,
    constituents,
  };
}

export function computeHistory({
  weeks,
  models,
  promptShare,
}: {
  weeks: ChartWeek[];
  models: ModelRecord[];
  promptShare: number;
}): HistoryPoint[] {
  const catalog = buildModelIndex(models);
  const share = promptShare > 0 && promptShare < 1 ? promptShare : 0.97;
  const points: HistoryPoint[] = [];

  for (const week of weeks) {
    let spendUsd = 0;
    let tokens = 0;
    let modelsPriced = 0;

    for (const [slug, volume] of Object.entries(week.volumes)) {
      const model = findModelBySlug(slug, catalog);
      if (!model) {
        continue;
      }
      if (slug.includes(":free") || (model.promptPrice === 0 && model.completionPrice === 0)) {
        continue;
      }
      const pricePerToken =
        share * model.promptPrice + (1 - share) * model.completionPrice;
      spendUsd += volume * pricePerToken;
      tokens += volume;
      modelsPriced += 1;
    }

    if (tokens <= 0) {
      continue;
    }

    const blendedPerMillion = (spendUsd / tokens) * TOKENS_PER_MILLION;
    points.push({
      date: week.date,
      blendedPerMillion,
      index: blendedPerMillion * INDEX_SCALE,
      tokens,
      modelsPriced,
      shares: [],
    });
  }

  return points;
}

export function dollarsToIndex(perMillion: number): number {
  return (perMillion / INDEX_DOLLARS_PER_MILLION) * INDEX_SCALE;
}

const MAX_NAMED_SHARE_LABS = 7;

export function pickShareOrder(weeks: ChartWeek[]): string[] {
  const totals = new Map<string, number>();
  for (const week of weeks) {
    for (const [provider, tokens] of Object.entries(week.volumes)) {
      if (provider === "others" || provider === "Others") {
        continue;
      }
      totals.set(provider, (totals.get(provider) ?? 0) + tokens);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_NAMED_SHARE_LABS)
    .map(([provider]) => provider)
    .concat("others");
}

export function sharesFromModelWeeks(weeks: ChartWeek[]): ChartWeek[] {
  return weeks.map((week) => {
    const volumes: Record<string, number> = {};
    for (const [slug, tokens] of Object.entries(week.volumes)) {
      const provider = providerFromSlug(slug);
      volumes[provider] = (volumes[provider] ?? 0) + tokens;
    }
    return { date: week.date, volumes };
  });
}

export function attachWeeklyShares(
  history: HistoryPoint[],
  shareWeeks: ChartWeek[],
): HistoryPoint[] {
  if (history.length === 0 || shareWeeks.length === 0) {
    return history;
  }

  const byDate = new Map(shareWeeks.map((week) => [week.date, week.volumes]));
  const order = pickShareOrder(shareWeeks);

  return history.map((point) => {
    const volumes = byDate.get(point.date);
    const empty = order.map((provider) => ({ provider, weight: 0 }));
    if (!volumes) {
      return { ...point, shares: empty };
    }

    const total = Object.values(volumes).reduce((sum, tokens) => sum + tokens, 0);
    if (total <= 0) {
      return { ...point, shares: empty };
    }

    const shares: LabShare[] = order.map((provider) => ({
      provider,
      weight: provider === "others" ? 0 : (volumes[provider] ?? 0) / total,
    }));
    const namedWeight = shares.reduce(
      (sum, row) => sum + (row.provider === "others" ? 0 : row.weight),
      0,
    );
    const others = shares.find((row) => row.provider === "others");
    if (others) {
      others.weight = Math.max(0, 1 - namedWeight);
    }

    return { ...point, shares };
  });
}
