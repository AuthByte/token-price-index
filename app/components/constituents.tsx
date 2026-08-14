import { formatPercent, formatPrice, formatTokens } from "@/lib/format";
import type { Constituent } from "@/lib/types";

export function Constituents({ rows }: { rows: Constituent[] }) {
  const paid = rows.filter((row) => !row.free).slice(0, 32);

  return (
    <section className="border-t border-rule pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="display text-3xl italic sm:text-4xl">The basket</h2>
        <p className="max-w-md text-sm text-ink-soft">
          Ranked by tokens, not by how famous the model is. Weight is each
          model’s share of paid volume. Batch endpoints keep their discounted
          sticker.
        </p>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink/25 text-[11px] tracking-[0.16em] uppercase text-ink-soft">
              <th className="py-3 pr-3 font-medium">#</th>
              <th className="py-3 pr-3 font-medium">Model</th>
              <th className="py-3 pr-3 font-medium">Weight</th>
              <th className="py-3 pr-3 text-right font-medium">In / M</th>
              <th className="py-3 pr-3 text-right font-medium">Out / M</th>
              <th className="py-3 pr-3 text-right font-medium">Blend / M</th>
              <th className="py-3 text-right font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {paid.map((row, index) => (
              <tr key={row.slug} className="border-b border-rule">
                <td className="py-3 pr-3 font-mono text-ink-soft">{index + 1}</td>
                <td className="py-3 pr-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="font-mono text-[11px] text-ink-soft">
                    {row.slug}
                    {row.variant && row.variant !== "standard" ? ` · ${row.variant}` : ""}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-mono text-xs">{formatPercent(row.weight)}</span>
                    <span className="h-1.5 w-24 bg-paper-2">
                      <span
                        className="block h-full bg-copper"
                        style={{ width: `${Math.min(row.weight * 100, 100)}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-right font-mono">${formatPrice(row.promptPricePerMillion)}</td>
                <td className="py-3 pr-3 text-right font-mono">${formatPrice(row.completionPricePerMillion)}</td>
                <td className="py-3 pr-3 text-right font-mono">${formatPrice(row.blendedPerMillion)}</td>
                <td className="py-3 text-right font-mono">{formatTokens(row.tokens)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
