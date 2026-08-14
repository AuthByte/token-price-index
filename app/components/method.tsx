import { formatPerMillion, formatUsdHr } from "@/lib/format";
import type { BasketStats, ComputeIndex } from "@/lib/types";

export function Method({
  all,
  compute,
  matchedModels,
  unmatchedModels,
}: {
  all: BasketStats;
  compute: ComputeIndex | null;
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
            split by token type. Each house index is the same formula, cut to
            one lab’s paid mix. Free endpoints are left out of the headline so
            the number is what people pay, not a participation trophy for $0
            rows. Including them, the market prints $
            {formatPerMillion(all.blendedPerMillion)} / M.
          </p>
          <p>
            The Compute Index is a different tape. GPU clouds do not publish
            how many chips they actually rent, so we cannot usage-weight them
            the way we weight tokens. GPI is the median of each cloud’s
            cheapest firm H100. Index 100 is $1.00 per GPU-hour.
            {compute
              ? ` Today that median is $${formatUsdHr(compute.headline.usdHr)} across ${compute.headline.providersPriced} desks.`
              : ""}{" "}
            H200 and B200 sit beside it on the same scale. Spot and community
            quotes are dropped.
          </p>
          <p>
            Image, video, speech, and rerank traffic with no text tokens is
            dropped. Batch variants stay in, at the cheaper sticker they
            actually bill. Token prices come from OpenRouter’s public catalog.
            GPU stickers come from GPU Rental Prices, used under CC BY 4.0.
            Tokenizers differ by provider, so a “token” here is whatever that
            lab counted, not a universal atom.
          </p>
          <p>
            The year chart takes OpenRouter’s weekly named series, the same
            lines on their rankings page, and prices that mix at today’s
            catalog. It is not a historical sticker tape. Hover a week to see
            that day’s TPI. The colored stack under it is author market share
            for the same weeks, including the long-tail Others bucket the
            price line has to skip. The headline TPI above uses the full paid
            basket, so it sits higher than the chart’s last dot.
          </p>
        </div>
        <div className="space-y-6">
          <div className="border border-rule bg-paper-2/40 p-6 font-mono text-[13px] leading-7">
            <p className="tracking-[0.16em] uppercase text-ink-soft">Tokens</p>
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
          </div>
          <div className="border border-rule bg-paper-2/40 p-6 font-mono text-[13px] leading-7">
            <p className="tracking-[0.16em] uppercase text-ink-soft">Compute</p>
            <p className="display mt-3 text-xl italic leading-snug text-ink">
              GPI = 100 × median(firm H100ᵢ)
            </p>
            <p className="mt-5 text-ink-soft">
              One quote per cloud: the cheapest on-demand or secure H100 they
              list. Median, not mean, so AWS at twelve dollars cannot yank the
              meter off a $2 neocloud. A coding-only token mix would be a third
              sister, but OpenRouter keeps that dataset behind a key.
            </p>
            <p className="mt-5 text-ink-soft">
              Sources: OpenRouter (openrouter.ai/rankings) and GPU Rental
              Prices (gpurentalprices.com). Not affiliated with either. Not
              investment advice, just meters on token rent and chip rent.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
