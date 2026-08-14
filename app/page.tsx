import { ComputeMeter } from "./components/compute-meter";
import { Constituents } from "./components/constituents";
import { Hero } from "./components/hero";
import { IndexChart } from "./components/index-chart";
import { Method } from "./components/method";
import { Houses } from "./components/providers";
import { formatAsOf, formatPerMillion } from "@/lib/format";
import { getIndexSnapshot } from "@/lib/get-index";

export default async function Home() {
  const snapshot = await getIndexSnapshot();
  const asOf = formatAsOf(snapshot.asOf);

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
        <div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-ink-soft">
            OpenRouter usage · live catalog prices
          </p>
          <h1 className="display mt-1 text-4xl italic sm:text-5xl">The Token Index</h1>
        </div>
        <p className="font-mono text-xs text-ink-soft">
          {asOf}
          <span className="mx-2 text-copper">/</span>
          100 = $1.00 / MTok
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-16 pt-12 pb-8">
        <Hero asOf={asOf} paid={snapshot.paid} />
        <IndexChart points={snapshot.history} />

        <p className="max-w-3xl text-lg leading-relaxed">
          Most of the world’s tokens now cost pocket change. DeepSeek and Hy3
          chew through volume around $0.14 a million, so the index sits well
          under 100 even while Opus and Kimi still charge several dollars.
          Including free endpoints, the same mix is $
          {formatPerMillion(snapshot.all.blendedPerMillion)} / M.
        </p>

        <Houses providers={snapshot.providers} />
        {snapshot.compute ? <ComputeMeter compute={snapshot.compute} /> : null}
        <Constituents rows={snapshot.constituents} />
        <Method
          all={snapshot.all}
          compute={snapshot.compute}
          matchedModels={snapshot.matchedModels}
          unmatchedModels={snapshot.unmatchedModels}
        />
      </main>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-4 text-xs text-ink-soft">
        <p>
          Source: {snapshot.source}
          {snapshot.compute ? `. Compute: ${snapshot.compute.source}.` : "."} Refreshed{" "}
          {new Date(snapshot.fetchedAt).toUTCString()}.
        </p>
        <a className="underline decoration-copper/60 underline-offset-4" href="/api/index">
          JSON
        </a>
      </footer>
    </div>
  );
}
