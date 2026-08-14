import type {
  BasketStats,
  Constituent,
  IndexSnapshot,
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

function lookupKeys(row: RankingRow): string[] {
  const keys = [row.variantPermaslug, row.modelPermaslug];
  const colon = row.variantPermaslug.lastIndexOf(":");
  if (colon > 0) {
    keys.push(row.variantPermaslug.slice(0, colon));
  }
  for (const key of [...keys]) {
    const stripped = key.replace(/-\d{8}$/, "");
    if (stripped !== key) {
      keys.push(stripped);
    }
  }
  return keys;
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
}): IndexSnapshot {
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
    .map(([provider, value]) => ({
      provider,
      tokens: value.tokens,
      spendUsd: value.spendUsd,
      weight: paid.tokens > 0 ? value.tokens / paid.tokens : 0,
    }))
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

export function dollarsToIndex(perMillion: number): number {
  return (perMillion / INDEX_DOLLARS_PER_MILLION) * INDEX_SCALE;
}
