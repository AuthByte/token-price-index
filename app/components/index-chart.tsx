"use client";

import { useId, useMemo, useState } from "react";
import {
  formatIndex,
  formatMonthYear,
  formatPerMillion,
  formatShortDate,
} from "@/lib/format";
import type { HistoryPoint } from "@/lib/types";

const WIDTH = 960;
const HEIGHT = 340;
const PAD = { top: 28, right: 20, bottom: 40, left: 52 };

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

export function IndexChart({ points }: { points: HistoryPoint[] }) {
  const clipId = useId();
  const [active, setActive] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length < 2) {
      return null;
    }
    const maxIndex = niceMax(Math.max(...points.map((point) => point.index)));
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const xAt = (index: number) =>
      PAD.left + (index / (points.length - 1)) * innerW;
    const yAt = (value: number) =>
      PAD.top + innerH - (value / maxIndex) * innerH;

    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index).toFixed(2)} ${yAt(point.index).toFixed(2)}`)
      .join(" ");
    const area = `${line} L ${xAt(points.length - 1).toFixed(2)} ${yAt(0).toFixed(2)} L ${xAt(0).toFixed(2)} ${yAt(0).toFixed(2)} Z`;

    const xLabels = [0, Math.round((points.length - 1) / 3), Math.round(((points.length - 1) * 2) / 3), points.length - 1]
      .filter((value, index, list) => list.indexOf(value) === index);

    return { maxIndex, innerW, innerH, xAt, yAt, line, area, xLabels, grid: ticks(maxIndex) };
  }, [points]);

  if (!geometry || points.length < 2) {
    return null;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const hover = active === null ? last : points[active];
  const hoverX = geometry.xAt(active === null ? points.length - 1 : active);
  const hoverY = geometry.yAt(hover.index);
  const change = (last.index - first.index) / first.index;
  const changeLabel = `${change > 0 ? "+" : ""}${Math.round(change * 100)}%`;

  return (
    <section className="border-t border-rule pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-3xl italic sm:text-4xl">A year of mix</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            OpenRouter’s weekly top models, billed at today’s catalog prices.
            Volume moved to cheap labs. The stickers on Claude barely had to
            flinch.
          </p>
        </div>
        <p className="font-mono text-sm text-copper-deep">
          {changeLabel} since {formatMonthYear(first.date)}
        </p>
      </div>

      <div className="relative mt-8">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Weekly token price index from ${formatShortDate(first.date)} to ${formatShortDate(last.date)}`}
          onMouseLeave={() => setActive(null)}
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
                y1={geometry.yAt(value)}
                y2={geometry.yAt(value)}
                stroke={value === 100 ? "#b85c2a" : "#1a1610"}
                strokeOpacity={value === 100 ? 0.45 : 0.12}
                strokeDasharray={value === 100 ? "4 5" : undefined}
              />
              <text
                x={PAD.left - 10}
                y={geometry.yAt(value) + 4}
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
          <path d={geometry.line} fill="none" stroke="#b85c2a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

          {geometry.xLabels.map((index) => (
            <text
              key={points[index].date}
              x={geometry.xAt(index)}
              y={HEIGHT - 12}
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
            y2={HEIGHT - PAD.bottom}
            stroke="#1a1610"
            strokeOpacity="0.35"
          />
          <circle cx={hoverX} cy={hoverY} r="5" fill="#efe6d4" stroke="#b85c2a" strokeWidth="2.2" />

          {points.map((point, index) => (
            <rect
              key={point.date}
              x={geometry.xAt(index) - geometry.innerW / points.length / 2}
              y={PAD.top}
              width={geometry.innerW / points.length}
              height={geometry.innerH}
              fill="transparent"
              onMouseEnter={() => setActive(index)}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute right-0 top-0 border border-rule bg-paper/90 px-3 py-2 font-mono text-xs text-ink">
          <div className="tracking-[0.14em] uppercase text-ink-soft">
            {formatShortDate(hover.date)}
          </div>
          <div className="display mt-1 text-2xl italic leading-none">
            {formatIndex(hover.index)}
          </div>
          <div className="mt-1 text-ink-soft">
            ${formatPerMillion(hover.blendedPerMillion)} / M · {hover.modelsPriced} models
          </div>
        </div>
      </div>
    </section>
  );
}
