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
