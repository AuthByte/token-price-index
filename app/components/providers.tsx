import { formatPercent, formatUsd } from "@/lib/format";
import type { ProviderShare } from "@/lib/types";

const LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  google: "Google",
  meta: "Meta",
  "meta-llama": "Meta",
  minimax: "MiniMax",
  mistralai: "Mistral",
  moonshotai: "Moonshot",
  nvidia: "NVIDIA",
  openai: "OpenAI",
  qwen: "Qwen",
  stepfun: "StepFun",
  tencent: "Tencent",
  "x-ai": "xAI",
  xiaomi: "Xiaomi",
  "z-ai": "Z.ai",
};

function labelFor(provider: string): string {
  return LABELS[provider] ?? provider;
}

export function Providers({ providers }: { providers: ProviderShare[] }) {
  const top = providers.slice(0, 8);
  const restWeight = providers.slice(8).reduce((sum, row) => sum + row.weight, 0);

  return (
    <section className="border-t border-rule pt-10">
      <div className="flex items-end justify-between gap-6">
        <h2 className="display text-3xl italic sm:text-4xl">Who moves the number</h2>
        <p className="hidden max-w-sm text-right text-sm text-ink-soft sm:block">
          Share of paid tokens in the basket. Cheap high-volume labs pull the
          index down. Frontier houses still own the spend.
        </p>
      </div>
      <div className="mt-8 flex h-4 w-full overflow-hidden bg-paper-2">
        {top.map((row) => (
          <div
            key={row.provider}
            title={`${labelFor(row.provider)} ${formatPercent(row.weight)}`}
            className="h-full bg-copper"
            style={{
              width: `${row.weight * 100}%`,
              opacity: 0.35 + row.weight * 0.65,
            }}
          />
        ))}
        {restWeight > 0 ? (
          <div
            className="h-full bg-ink"
            style={{ width: `${restWeight * 100}%`, opacity: 0.18 }}
          />
        ) : null}
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {top.map((row) => (
          <li key={row.provider} className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
            <span>{labelFor(row.provider)}</span>
            <span className="font-mono text-sm text-ink-soft">
              {formatPercent(row.weight)}
              <span className="ml-2 text-[11px]">{formatUsd(row.spendUsd)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
