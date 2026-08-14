function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function readUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function parseRankingRow(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const date = readString(value.date);
  const modelPermaslug = readString(value.model_permaslug);
  const variantPermaslug = readString(value.variant_permaslug);
  const promptTokens = readNumber(value.total_prompt_tokens);
  const completionTokens = readNumber(value.total_completion_tokens);

  if (
    date === null ||
    modelPermaslug === null ||
    variantPermaslug === null ||
    promptTokens === null ||
    completionTokens === null
  ) {
    return null;
  }

  const variantRaw = value.variant;
  const variant = typeof variantRaw === "string" ? variantRaw : null;

  return {
    date,
    modelPermaslug,
    variant,
    variantPermaslug,
    promptTokens,
    completionTokens,
    mediaPrompt: readNumber(value.num_media_prompt) ?? 0,
    imageOutputs: readNumber(value.image_output_requests) ?? 0,
    videoSeconds: readNumber(value.video_output_seconds) ?? 0,
    rerankDocuments: readNumber(value.rerank_documents) ?? 0,
    transcriptCharacters: readNumber(value.stt_transcript_characters) ?? 0,
  };
}

export function parseModelRecord(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const name = readString(value.name);
  if (id === null || name === null) {
    return null;
  }

  const pricing = isRecord(value.pricing) ? value.pricing : null;
  if (pricing === null) {
    return null;
  }

  const promptPrice = readNumber(pricing.prompt);
  const completionPrice = readNumber(pricing.completion);
  if (promptPrice === null || completionPrice === null) {
    return null;
  }

  const canonicalSlug = readString(value.canonical_slug);

  return {
    id,
    canonicalSlug,
    name,
    promptPrice,
    completionPrice,
  };
}

export function parseOpenRouterList(payload: unknown): unknown[] {
  if (!isRecord(payload)) {
    return [];
  }
  return readUnknownArray(payload.data);
}

export function parseShareWeeks(payload: unknown) {
  if (!isRecord(payload)) {
    return [];
  }

  const nested = isRecord(payload.data) ? payload.data : payload;
  const rows = readUnknownArray(nested.data);
  const weeks: Array<{ date: string; volumes: Record<string, number> }> = [];

  for (const row of rows) {
    if (!isRecord(row)) {
      continue;
    }
    const date = readString(row.x);
    if (date === null || !isRecord(row.ys)) {
      continue;
    }
    const volumes: Record<string, number> = {};
    for (const [slug, raw] of Object.entries(row.ys)) {
      const tokens = readNumber(raw);
      if (tokens !== null && tokens > 0) {
        volumes[slug] = tokens;
      }
    }
    if (Object.keys(volumes).length > 0) {
      weeks.push({ date, volumes });
    }
  }

  return weeks;
}

export function parseChartWeeks(payload: unknown) {
  if (!isRecord(payload)) {
    return [];
  }

  const nested = isRecord(payload.data) ? payload.data : payload;
  const rows = readUnknownArray(nested.data);
  const weeks: Array<{ date: string; volumes: Record<string, number> }> = [];

  for (const row of rows) {
    if (!isRecord(row)) {
      continue;
    }
    const date = readString(row.x);
    if (date === null || !isRecord(row.ys)) {
      continue;
    }
    const volumes: Record<string, number> = {};
    for (const [slug, raw] of Object.entries(row.ys)) {
      if (slug === "Others") {
        continue;
      }
      const tokens = readNumber(raw);
      if (tokens !== null && tokens > 0) {
        volumes[slug] = tokens;
      }
    }
    if (Object.keys(volumes).length > 0) {
      weeks.push({ date, volumes });
    }
  }

  return weeks;
}
