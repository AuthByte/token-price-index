import { formatIndex, formatPercent, formatPerMillion, formatUsd } from "@/lib/format";
import { colorForLab, labelForLab } from "@/lib/labs";
import type { ProviderShare } from "@/lib/types";

function labelFor(provider: string): string {
  return labelForLab(provider);
}

export function Houses({ providers }: { providers: ProviderShare[] }) {
  const top = providers.slice(0, 8);
  const volumeLead = top[0];
  const spendLead = [...top].sort((a, b) => b.spendWeight - a.spendWeight)[0];

  return (
    <section className="border-t border-rule pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-3xl italic sm:text-4xl">The houses</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Each lab’s own TPI, weighted by the tokens it actually sold.
            {volumeLead && spendLead
              ? ` ${labelFor(volumeLead.provider)} moves the volume. ${labelFor(spendLead.provider)} still collects the rent.`
              : ""}
          </p>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-ink-soft lg:block">
          We do not pick a champion. The mix does. Token share and spend share
          are different stories.
        </p>
      </div>

      <div className="mt-8 flex h-4 w-full overflow-hidden bg-paper-2">
        {top.map((row) => (
          <div
            key={row.provider}
            title={`${labelFor(row.provider)} ${formatPercent(row.weight)} of tokens`}
            className="h-full"
            style={{
              width: `${row.weight * 100}%`,
              background: colorForLab(row.provider),
            }}
          />
        ))}
      </div>

      <ul className="mt-8 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {top.map((row) => (
          <li key={row.provider} className="bg-paper px-4 py-5">
            <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">
              {labelFor(row.provider)}
            </p>
            <p className="display mt-2 text-4xl italic leading-none">{formatIndex(row.index)}</p>
            <p className="mt-3 font-mono text-[11px] text-ink-soft">
              ${formatPerMillion(row.blendedPerMillion)} / M
            </p>
            <p className="mt-4 flex justify-between gap-3 border-t border-rule pt-3 font-mono text-[11px] text-ink-soft">
              <span>{formatPercent(row.weight)} tokens</span>
              <span>{formatPercent(row.spendWeight)} spend</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-ink-soft">{formatUsd(row.spendUsd)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
