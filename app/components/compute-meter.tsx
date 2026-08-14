import { formatIndex, formatUsdHr } from "@/lib/format";
import type { ComputeIndex } from "@/lib/types";

const LABELS: Record<string, string> = {
  aws: "AWS",
  azure: "Azure",
  coreweave: "CoreWeave",
  crusoe: "Crusoe",
  datacrunch: "DataCrunch",
  digitalocean: "DigitalOcean",
  gcp: "Google Cloud",
  gmicloud: "GMI Cloud",
  hyperstack: "Hyperstack",
  jarvislabs: "Jarvis Labs",
  lambda: "Lambda",
  latitude: "Latitude",
  massedcompute: "Massed Compute",
  nebius: "Nebius",
  ovh: "OVHcloud",
  primeintellect: "Prime Intellect",
  runpod: "RunPod",
  scaleway: "Scaleway",
  spheron: "Spheron",
  tensordock: "TensorDock",
  thundercompute: "Thunder Compute",
  together: "Together",
  voltagepark: "Voltage Park",
};

function labelFor(provider: string): string {
  return LABELS[provider] ?? provider.replace(/-/g, " ");
}

export function ComputeMeter({ compute }: { compute: ComputeIndex }) {
  const { headline } = compute;
  const siblings = compute.series.filter((row) => row.gpu !== headline.gpu);
  const quotes = headline.quotes;
  const cheap = quotes[0];
  const dear = quotes[quotes.length - 1];

  return (
    <section className="border-t border-rule pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-moss">
            GPI · firm H100
          </p>
          <h2 className="display mt-1 text-3xl italic sm:text-4xl">The Compute Index</h2>
        </div>
        <p className="max-w-md text-sm text-ink-soft sm:text-right">
          Nobody publishes a clean GPU volume leader, so this is a median across
          clouds, not a bet on CoreWeave or AWS. One hundred is a dollar an hour.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)] lg:items-end">
        <div>
          <p className="display font-light italic leading-none text-ink [font-size:clamp(4.5rem,14vw,9rem)]">
            {formatIndex(headline.index)}
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            ${formatUsdHr(headline.usdHr)} per GPU-hour, the median of each
            cloud’s cheapest firm {headline.label}. Spot, community, and
            serverless quotes stay out, the same way free tokens stay out of TPI.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-rule pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          {siblings.map((row) => (
            <div key={row.gpu}>
              <dt className="text-xs tracking-[0.18em] uppercase text-ink-soft">{row.label}</dt>
              <dd className="display mt-1 text-3xl italic leading-none sm:text-4xl">
                {formatIndex(row.index)}
              </dd>
              <p className="mt-2 font-mono text-[11px] text-ink-soft">
                ${formatUsdHr(row.usdHr)} / hr · {row.providersPriced} clouds
              </p>
            </div>
          ))}
          <div>
            <dt className="text-xs tracking-[0.18em] uppercase text-ink-soft">Desks</dt>
            <dd className="display mt-1 text-3xl italic leading-none sm:text-4xl">
              {headline.providersPriced}
            </dd>
            <p className="mt-2 font-mono text-[11px] text-ink-soft">firm H100 quotes</p>
          </div>
          {cheap && dear ? (
            <div>
              <dt className="text-xs tracking-[0.18em] uppercase text-ink-soft">Tape</dt>
              <dd className="display mt-1 text-3xl italic leading-none sm:text-4xl">
                ${formatUsdHr(cheap.usdHr)}
              </dd>
              <p className="mt-2 font-mono text-[11px] text-ink-soft">
                {labelFor(cheap.provider)} → {labelFor(dear.provider)} ${formatUsdHr(dear.usdHr)}
              </p>
            </div>
          ) : null}
        </dl>
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((quote) => (
          <li
            key={quote.provider}
            className="flex items-baseline justify-between gap-3 border-b border-rule pb-2"
          >
            <span>{labelFor(quote.provider)}</span>
            <span className="font-mono text-sm text-ink-soft">
              ${formatUsdHr(quote.usdHr)}
              <span className="ml-2 text-[11px]">{quote.gpu}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-ink-soft">
        Source: {compute.source}. Firm means on-demand or secure. Each cloud
        contributes one quote, its cheapest H100 in that bucket, so a provider
        listing both PCIe and SXM cannot vote twice.
      </p>
    </section>
  );
}
