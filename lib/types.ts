export type RankingRow = {
  date: string;
  modelPermaslug: string;
  variant: string | null;
  variantPermaslug: string;
  promptTokens: number;
  completionTokens: number;
  mediaPrompt: number;
  imageOutputs: number;
  videoSeconds: number;
  rerankDocuments: number;
  transcriptCharacters: number;
};

export type ModelRecord = {
  id: string;
  canonicalSlug: string | null;
  name: string;
  promptPrice: number;
  completionPrice: number;
};

export type Constituent = {
  slug: string;
  name: string;
  provider: string;
  variant: string | null;
  promptTokens: number;
  completionTokens: number;
  tokens: number;
  promptPricePerMillion: number;
  completionPricePerMillion: number;
  blendedPerMillion: number;
  spendUsd: number;
  weight: number;
  free: boolean;
};

export type IndexBasket = {
  asOf: string;
  fetchedAt: string;
  source: string;
  matchedModels: number;
  unmatchedModels: number;
  paid: BasketStats;
  all: BasketStats;
  providers: ProviderShare[];
  constituents: Constituent[];
};

export type IndexSnapshot = IndexBasket & {
  history: HistoryPoint[];
  compute: ComputeIndex | null;
};

export type BasketStats = {
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  spendUsd: number;
  blendedPerMillion: number;
  promptPerMillion: number;
  completionPerMillion: number;
  index: number;
  promptIndex: number;
  completionIndex: number;
};

export type ProviderShare = {
  provider: string;
  tokens: number;
  spendUsd: number;
  weight: number;
  spendWeight: number;
  blendedPerMillion: number;
  index: number;
};

export type GpuOffer = {
  provider: string;
  gpu: string;
  vramGb: number;
  usdHr: number;
  kind: string;
};

export type GpuSnapshot = {
  date: string;
  generatedAt: string;
  offers: GpuOffer[];
};

export type ComputeQuote = {
  provider: string;
  usdHr: number;
  gpu: string;
  kind: string;
};

export type ComputeSeries = {
  gpu: string;
  label: string;
  usdHr: number;
  index: number;
  providersPriced: number;
  quotes: ComputeQuote[];
};

export type ComputeIndex = {
  asOf: string;
  fetchedAt: string;
  source: string;
  headline: ComputeSeries;
  series: ComputeSeries[];
};

export type ChartWeek = {
  date: string;
  volumes: Record<string, number>;
};

export type HistoryPoint = {
  date: string;
  index: number;
  blendedPerMillion: number;
  tokens: number;
  modelsPriced: number;
};
