import { formatIndex, formatPerMillion, formatUsd, formatTokens } from "@/lib/format";
import type { BasketStats } from "@/lib/types";

export function Hero({
  asOf,
  paid,
}: {
  asOf: string;
  paid: BasketStats;
}) {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] lg:items-end">
      <div>
        <p className="display text-[0.95rem] tracking-[0.22em] uppercase text-copper-deep">
          TPI · paid tokens
        </p>
        <p className="display mt-3 font-light italic leading-none text-ink [font-size:clamp(5.5rem,18vw,11.5rem)]">
          {formatIndex(paid.index)}
        </p>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
          ${formatPerMillion(paid.blendedPerMillion)} per million tokens, weighted
          by how much the world actually used on OpenRouter. One hundred on this
          scale is a dollar a million.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-rule pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
        <Stat label="Input" value={formatIndex(paid.promptIndex)} hint={`$${formatPerMillion(paid.promptPerMillion)} / M`} />
        <Stat label="Output" value={formatIndex(paid.completionIndex)} hint={`$${formatPerMillion(paid.completionPerMillion)} / M`} />
        <Stat label="Paid volume" value={formatTokens(paid.tokens)} hint="prompt + completion" />
        <Stat label="Implied spend" value={formatUsd(paid.spendUsd)} hint={`as of ${asOf}`} />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <dt className="text-xs tracking-[0.18em] uppercase text-ink-soft">{label}</dt>
      <dd className="display mt-1 text-3xl italic leading-none sm:text-4xl">{value}</dd>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">{hint}</p>
    </div>
  );
}
