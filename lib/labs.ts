export const LAB_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  "arcee-ai": "Arcee",
  deepseek: "DeepSeek",
  google: "Google",
  meta: "Meta",
  "meta-llama": "Meta",
  minimax: "MiniMax",
  mistralai: "Mistral",
  moonshotai: "Moonshot",
  nvidia: "NVIDIA",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  others: "Others",
  poolside: "Poolside",
  qwen: "Qwen",
  stepfun: "StepFun",
  tencent: "Tencent",
  tngtech: "TNG",
  "x-ai": "xAI",
  xiaomi: "Xiaomi",
  "z-ai": "Z.ai",
};

/** Gazette inks, not a dashboard rainbow. */
export const LAB_COLORS: Record<string, string> = {
  deepseek: "#b85c2a",
  tencent: "#2c5e45",
  openai: "#1a1610",
  anthropic: "#8a3e16",
  google: "#6b7c3a",
  xiaomi: "#3d5a66",
  "z-ai": "#7a3b3b",
  moonshotai: "#c4a35a",
  nvidia: "#3d5c4a",
  qwen: "#5c4a3d",
  "x-ai": "#2a3a4a",
  mistralai: "#4a3d5c",
  "meta-llama": "#3a4a2a",
  minimax: "#5c3d2a",
  stepfun: "#2a4a4a",
  others: "#d4c7ae",
};

const FALLBACK_COLORS = ["#7a5340", "#4d5c45", "#5a4a3a", "#3f4f5a", "#6a3f3f"];

export function labelForLab(provider: string): string {
  return LAB_LABELS[provider] ?? provider.replace(/-/g, " ");
}

export function colorForLab(provider: string): string {
  const known = LAB_COLORS[provider];
  if (known) {
    return known;
  }
  let hash = 0;
  for (let index = 0; index < provider.length; index += 1) {
    hash = (hash + provider.charCodeAt(index) * (index + 1)) % FALLBACK_COLORS.length;
  }
  return FALLBACK_COLORS[hash] ?? "#5c5348";
}
