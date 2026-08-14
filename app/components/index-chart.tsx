"use client";

import { useId, useMemo, useState } from "react";
import {
  formatIndex,
  formatMonthYear,
  formatPerMillion,
  formatPercent,
  formatShortDate,
} from "@/lib/format";
import { colorForLab, labelForLab } from "@/lib/labs";
import type { HistoryPoint, LabShare } from "@/lib/types";

const WIDTH = 960;
const PRICE_HEIGHT = 300;
const SHARE_HEIGHT = 220;
const PAD = { top: 24, right: 20, bottom: 36, left: 52 };

function niceMax(value: number): number {
  const padded = Math.max(value * 1.1, 50);
  const step = padded > 150 ? 50 : 25;
  return Math.ceil(padded / step) * step;
}

function ticks(max: number): number[] {
  const step = max > 150 ? 50 : 25;
  const values: number[] = [];
  for (let value = 0; value <= max; value += step) {
    values.push(value);
  }
  return values;
}

function areaPath(xs: number[], upper: number[], lower: number[]): string {
  if (xs.length < 2) {
    return "";
  }
  const up = xs.map(
    (x, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${upper[index]?.toFixed(2)}`,
  );
  const down = [];
  for (let index = xs.length - 1; index >= 0; index -= 1) {
    down.push(`L ${xs[index]?.toFixed(2)} ${lower[index]?.toFixed(2)}`);
  }
  return `${up.join(" ")} ${down.join(" ")} Z`;
}

export function IndexChart({ points }: { points: HistoryPoint[] }) {
  const clipId = useId();
  const [active, setActive] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length < 2) {
      return null;
    }
    const maxIndex = niceMax(Math.max(...points.map((point) => point.index)));
    const innerW = WIDTH - PAD.left - PAD.right;
    const priceH = PRICE_HEIGHT - PAD.top - PAD.bottom;
    const shareH = SHARE_HEIGHT - PAD.top - PAD.bottom;
    const xAt = (index: number) =>
      PAD.left + (index / (points.length - 1)) * innerW;
    const priceY = (value: number) =>
      PAD.top + priceH - (value / maxIndex) * priceH;
    const shareY = (value: number) => PAD.top + shareH - value * shareH;

    const xs = points.map((_, index) => xAt(index));
    const line = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${xs[index]?.toFixed(2)} ${priceY(point.index).toFixed(2)}`,
      )
      .join(" ");
    const area = `${line} L ${xs[xs.length - 1]?.toFixed(2)} ${priceY(0).toFixed(2)} L ${xs[0]?.toFixed(2)} ${priceY(0).toFixed(2)} Z`;

    const keys = points[points.length - 1]?.shares.map((row) => row.provider) ?? [];
    const stacks: Array<{ provider: string; path: string }> = [];
    const cumulative = points.map(() => 0);
    for (const provider of keys) {
      const lower = [...cumulative];
      const upper = points.map((point, index) => {
        const share = point.shares.find((row) => row.provider === provider)?.weight ?? 0;
        const next = Math.min(1, (cumulative[index] ?? 0) + share);
        cumulative[index] = next;
        return next;
      });
      const path = areaPath(
        xs,
        upper.map((value) => shareY(value)),
        lower.map((value) => shareY(value)),
      );
      if (path) {
        stacks.push({ provider, path });
      }
    }

    const xLabels = [
      0,
      Math.round((points.length - 1) / 3),
      Math.round(((points.length - 1) * 2) / 3),
      points.length - 1,
    ].filter((value, index, list) => list.indexOf(value) === index);

    return {
      maxIndex,
      innerW,
      priceH,
      shareH,
      xAt,
      priceY,
      shareY,
      line,
      area,
      stacks,
      keys,
      xLabels,
      grid: ticks(maxIndex),
    };
  }, [points]);

  if (!geometry || points.length < 2) {
    return null;
  }

  const geo = geometry;
  const first = points[0];
  const last = points[points.length - 1];
  const hover = active === null ? last : points[active];
  const hoverX = geo.xAt(active === null ? points.length - 1 : active);
  const hoverPriceY = geo.priceY(hover.index);
  const change = (last.index - first.index) / first.index;
  const changeLabel = `${change > 0 ? "+" : ""}${Math.round(change * 100)}%`;
  const showShares = geo.stacks.length > 0;
  const hoverShares = hover.shares.filter((row) => row.weight >= 0.015);

  function hitAreas(height: number) {
    return points.map((point, index) => (
      <rect
        key={`${height}-${point.date}`}
        x={geo.xAt(index) - geo.innerW / points.length / 2}
        y={PAD.top}
        width={geo.innerW / points.length}
        height={height}
        fill="transparent"
        onMouseEnter={() => setActive(index)}
      />
    ));
  }

  return (
    <section className="border-t border-rule pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-3xl italic sm:text-4xl">A year of mix</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Weekly TPI at today’s catalog, then the same weeks split by who
            actually burned the tokens. Hover any week for that day’s price.
          </p>
        </div>
        <p className="font-mono text-sm text-copper-deep">
          {changeLabel} since {formatMonthYear(first.date)}
        </p>
      </div>

      <div className="mt-8" onMouseLeave={() => setActive(null)}>
        <p className="mb-2 text-[11px] tracking-[0.18em] uppercase text-ink-soft">Price</p>
        <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${PRICE_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Weekly token price index from ${formatShortDate(first.date)} to ${formatShortDate(last.date)}`}
        >
          <defs>
            <linearGradient id={`${clipId}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#b85c2a" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#b85c2a" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {geometry.grid.map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={geometry.priceY(value)}
                y2={geometry.priceY(value)}
                stroke={value === 100 ? "#b85c2a" : "#1a1610"}
                strokeOpacity={value === 100 ? 0.45 : 0.12}
                strokeDasharray={value === 100 ? "4 5" : undefined}
              />
              <text
                x={PAD.left - 10}
                y={geometry.priceY(value) + 4}
                textAnchor="end"
                fill="#5c5348"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
              >
                {value}
              </text>
            </g>
          ))}

          <path d={geometry.area} fill={`url(#${clipId}-fill)`} />
          <path
            d={geometry.line}
            fill="none"
            stroke="#b85c2a"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {geometry.xLabels.map((index) => (
            <text
              key={`price-${points[index].date}`}
              x={geometry.xAt(index)}
              y={PRICE_HEIGHT - 10}
              textAnchor="middle"
              fill="#5c5348"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
            >
              {formatMonthYear(points[index].date)}
            </text>
          ))}

          <line
            x1={hoverX}
            x2={hoverX}
            y1={PAD.top}
            y2={PRICE_HEIGHT - PAD.bottom}
            stroke="#1a1610"
            strokeOpacity="0.35"
          />
          <circle cx={hoverX} cy={hoverPriceY} r="5" fill="#efe6d4" stroke="#b85c2a" strokeWidth="2.2" />
          {hitAreas(geometry.priceH)}
        </svg>
        <HoverCard hover={hover} shares={hoverShares} x={hoverX} />
        </div>

        {showShares ? (
        <div className="mt-10">
          <p className="mb-2 text-[11px] tracking-[0.18em] uppercase text-ink-soft">
            Share of tokens
          </p>
          <div className="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${SHARE_HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Weekly share of OpenRouter tokens by lab"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((value) => (
              <g key={value}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={geometry.shareY(value)}
                  y2={geometry.shareY(value)}
                  stroke="#1a1610"
                  strokeOpacity="0.12"
                />
                <text
                  x={PAD.left - 10}
                  y={geometry.shareY(value) + 4}
                  textAnchor="end"
                  fill="#5c5348"
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                >
                  {Math.round(value * 100)}
                </text>
              </g>
            ))}

            {geometry.stacks.map((stack) => (
              <path
                key={stack.provider}
                d={stack.path}
                fill={colorForLab(stack.provider)}
                fillOpacity={stack.provider === "others" ? 0.55 : 0.88}
                stroke="#efe6d4"
                strokeWidth="0.6"
              />
            ))}

            {geometry.xLabels.map((index) => (
              <text
                key={`share-${points[index].date}`}
                x={geometry.xAt(index)}
                y={SHARE_HEIGHT - 10}
                textAnchor="middle"
                fill="#5c5348"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
              >
                {formatMonthYear(points[index].date)}
              </text>
            ))}

            <line
              x1={hoverX}
              x2={hoverX}
              y1={PAD.top}
              y2={SHARE_HEIGHT - PAD.bottom}
              stroke="#1a1610"
              strokeOpacity="0.4"
            />
            {hitAreas(geometry.shareH)}
          </svg>
          <HoverCard hover={hover} shares={hoverShares} x={hoverX} />
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {geometry.keys.map((provider) => (
              <li key={provider} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5" style={{ background: colorForLab(provider) }} />
                {labelForLab(provider)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      </div>
    </section>
  );
}

function HoverCard({
  hover,
  shares,
  x,
}: {
  hover: HistoryPoint;
  shares: LabShare[];
  x: number;
}) {
  const pct = (x / WIDTH) * 100;
  const flip = pct > 64;
  return (
    <div
      className="pointer-events-none absolute top-3 z-10 w-52 border border-rule bg-paper/95 px-3 py-2 font-mono text-xs text-ink shadow-[0_8px_24px_rgba(26,22,16,0.12)]"
      style={
        flip
          ? { right: `${Math.max(100 - pct, 2)}%`, transform: "translateX(-10px)" }
          : { left: `${pct}%`, transform: "translateX(10px)" }
      }
    >
      <div className="tracking-[0.14em] uppercase text-ink-soft">
        {formatShortDate(hover.date)}
      </div>
      <div className="display mt-1 text-2xl italic leading-none">{formatIndex(hover.index)}</div>
      <div className="mt-1 text-ink-soft">${formatPerMillion(hover.blendedPerMillion)} / M</div>
      {shares.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-rule pt-2">
          {shares.map((row) => (
            <li key={row.provider} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-ink-soft">
                <span className="h-2 w-2" style={{ background: colorForLab(row.provider) }} />
                {labelForLab(row.provider)}
              </span>
              <span>{formatPercent(row.weight)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
