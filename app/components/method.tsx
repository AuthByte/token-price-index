import { formatPerMillion } from "@/lib/format";
import type { BasketStats } from "@/lib/types";

export function Method({
  all,
  matchedModels,
  unmatchedModels,
}: {
  all: BasketStats;
  matchedModels: number;
  unmatchedModels: number;
}) {
  return (
    <section className="border-t border-rule pt-10" id="method">
      <h2 className="display text-3xl italic sm:text-4xl">How the sausage is weighted</h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4 text-[1.05rem] leading-relaxed text-ink-soft">
          <p>
            OpenRouter publishes which models burn the most tokens. This page
            multiplies those volumes by each model’s current input and output
            prices, then averages. Models people actually run count more.
            A $15/M Claude that almost nobody uses barely moves the index. A
            $0.14/M flash model that eats a sixth of traffic does.
          </p>
          <p>
            Index 100 is $1.00 per million tokens. Today’s TPI is just that
            blended price, times 100. Input and output are the same idea,
            split by token type. Free endpoints are left out of the headline so
            the number is what people pay, not a participation trophy for $0
            rows. Including them, the market prints $
            {formatPerMillion(all.blendedPerMillion)} / M.
          </p>
          <p>
            Image, video, speech, and rerank traffic with no text tokens is
            dropped. Batch variants stay in, at the cheaper sticker they
            actually bill. Prices come from OpenRouter’s public model catalog.
            Tokenizers differ by provider, so a “token” here is whatever that
            lab counted, not a universal atom.
          </p>
        </div>
        <div className="border border-rule bg-paper-2/40 p-6 font-mono text-[13px] leading-7">
          <p className="tracking-[0.16em] uppercase text-ink-soft">Formula</p>
          <p className="display mt-3 text-xl italic leading-snug text-ink">
            TPI = 100 × Σ (tokensᵢ × priceᵢ) / Σ tokensᵢ
          </p>
          <p className="mt-5 text-ink-soft">
            priceᵢ is the model’s own mix: prompt tokens at the prompt rate,
            completion tokens at the completion rate, then divided by that
            model’s total tokens. Weights refresh from OpenRouter about once an
            hour. {matchedModels} priced text models made the basket.
            {unmatchedModels > 0
              ? ` ${unmatchedModels} ranking rows had no matching price, mostly non-text endpoints.`
              : ""}
          </p>
          <p className="mt-5 text-ink-soft">
            Source: OpenRouter (openrouter.ai/rankings). Not affiliated with
            OpenRouter. Not investment advice, just a meter on token rent.
          </p>
        </div>
      </div>
    </section>
  );
}
