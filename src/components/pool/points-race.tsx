"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PointsRace as PointsRaceData } from "@/lib/points-race";
import { cn } from "@/lib/utils";

type Props = {
  data: PointsRaceData;
  myEntrantId: string | null;
};

// Four validated, colour-blind-safe slots; every other team is drawn as a grey context line.
const SLOT_COLORS = ["var(--race-1)", "var(--race-2)", "var(--race-3)", "var(--race-4)"];
const MAX_HIGHLIGHTS = SLOT_COLORS.length;

const HEIGHT = 360;
const MARGIN = { top: 16, bottom: 32, left: 40 };
const LABEL_GAP = 14;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function niceTicks(max: number, count = 5) {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const ticks = [];
  for (let value = 0; value < max + step; value += step) ticks.push(value);
  return ticks;
}

function initialSlots(data: PointsRaceData, myEntrantId: string | null) {
  const slots: Record<string, number> = {};
  const ids = [
    ...(myEntrantId && data.teams.some((team) => team.id === myEntrantId) ? [myEntrantId] : []),
    ...data.teams.map((team) => team.id).filter((id) => id !== myEntrantId),
  ];
  // Your team plus the current leaders.
  ids.slice(0, 3).forEach((id, slot) => (slots[id] = slot));
  return slots;
}

// Nudge end-of-line labels apart so they never overlap.
function spreadLabels(ys: number[], minY: number, maxY: number) {
  const order = ys.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < order.length; i++) {
    order[i].y = Math.max(order[i].y, order[i - 1].y + LABEL_GAP);
  }
  const overflow = order.length ? order[order.length - 1].y - maxY : 0;
  if (overflow > 0) {
    for (let i = order.length - 1; i >= 0; i--) {
      const ceiling = i === order.length - 1 ? maxY : order[i + 1].y - LABEL_GAP;
      order[i].y = Math.max(minY, Math.min(order[i].y, ceiling));
    }
  }
  const result = [...ys];
  for (const item of order) result[item.index] = item.y;
  return result;
}

export function PointsRace({ data, myEntrantId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [slots, setSlots] = useState(() => initialSlots(data, myEntrantId));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (data.dates.length === 0 || data.teams.length === 0) {
    return (
      <Card className="border-brand/20 bg-card">
        <CardHeader>
          <CardTitle>Points race</CardTitle>
          <CardDescription>
            No points have been scored yet. The race will fill in once games are played.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Every line starts from zero the day before the first scored day.
  const firstDate = new Date(`${data.dates[0]}T00:00:00Z`);
  firstDate.setUTCDate(firstDate.getUTCDate() - 1);
  const dates = [firstDate.toISOString().slice(0, 10), ...data.dates];
  const series = data.teams.map((team) => ({ ...team, values: [0, ...team.totals] }));

  const compact = width < 520;
  const marginRight = compact ? 84 : 132;
  const plotWidth = Math.max(width - MARGIN.left - marginRight, 1);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yTicks = niceTicks(Math.max(...series.map((team) => team.total), 1));
  const yMax = yTicks[yTicks.length - 1];

  const x = (index: number) => MARGIN.left + (index / (dates.length - 1)) * plotWidth;
  const y = (value: number) => MARGIN.top + plotHeight - (value / yMax) * plotHeight;
  const path = (values: number[]) =>
    values.map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`).join("");

  const xTickCount = Math.min(dates.length, compact ? 3 : 6);
  const xTicks = [
    ...new Set(
      Array.from({ length: xTickCount }, (_, i) =>
        Math.round((i / Math.max(xTickCount - 1, 1)) * (dates.length - 1)),
      ),
    ),
  ];

  const highlighted = series
    .filter((team) => slots[team.id] !== undefined)
    .sort((a, b) => slots[a.id] - slots[b.id]);
  const hoveredTeam =
    hoveredTeamId && slots[hoveredTeamId] === undefined
      ? series.find((team) => team.id === hoveredTeamId)
      : undefined;
  const labelYs = spreadLabels(
    highlighted.map((team) => y(team.total)),
    MARGIN.top,
    MARGIN.top + plotHeight,
  );
  const maxLabelLength = compact ? 10 : 17;

  function toggleTeam(teamId: string) {
    setSlots((current) => {
      const next = { ...current };
      if (next[teamId] !== undefined) {
        delete next[teamId];
        return next;
      }
      const used = new Set(Object.values(next));
      const free = SLOT_COLORS.findIndex((_, slot) => !used.has(slot));
      if (free === -1) return current;
      next[teamId] = free;
      return next;
    });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - bounds.left - MARGIN.left) / plotWidth;
    const index = Math.round(fraction * (dates.length - 1));
    setActiveIndex(Math.min(Math.max(index, 0), dates.length - 1));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActiveIndex((index) =>
      Math.min(Math.max((index ?? dates.length - 1) + step, 0), dates.length - 1),
    );
  }

  const tooltipTeams =
    activeIndex === null
      ? []
      : [...highlighted, ...(hoveredTeam ? [hoveredTeam] : [])].sort(
          (a, b) => b.values[activeIndex] - a.values[activeIndex],
        );
  const tooltipOnLeft = activeIndex !== null && x(activeIndex) > width / 2;

  return (
    <Card className="border-brand/20 bg-card">
      <CardHeader>
        <CardTitle>Points race</CardTitle>
        <CardDescription>
          Running point totals for every team, day by day. Pick up to {MAX_HIGHLIGHTS} teams to
          highlight.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div ref={containerRef} className="relative min-w-0 overflow-hidden">
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Line chart of cumulative points from ${dateFormatter.format(new Date(dates[0]))} to ${dateFormatter.format(new Date(dates[dates.length - 1]))}. Use the left and right arrow keys to step through days.`}
            tabIndex={0}
            className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(dates.length - 1)}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={handleKeyDown}
          >
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + plotWidth}
                  y1={y(tick)}
                  y2={y(tick)}
                  className={tick === 0 ? "stroke-muted-foreground/40" : "stroke-border"}
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            ))}
            {xTicks.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={HEIGHT - 10}
                textAnchor={index === 0 ? "start" : index === dates.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[11px]"
              >
                {dateFormatter.format(new Date(dates[index]))}
              </text>
            ))}

            {series
              .filter((team) => slots[team.id] === undefined && team.id !== hoveredTeam?.id)
              .map((team) => (
                <path
                  key={team.id}
                  d={path(team.values)}
                  fill="none"
                  stroke="var(--race-context)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              ))}

            {hoveredTeam && (
              <path
                d={path(hoveredTeam.values)}
                fill="none"
                className="stroke-muted-foreground"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            )}

            {highlighted.map((team) => (
              <g key={team.id}>
                <path
                  d={path(team.values)}
                  fill="none"
                  stroke="var(--card)"
                  strokeWidth={6}
                  strokeLinejoin="round"
                />
                <path
                  d={path(team.values)}
                  fill="none"
                  stroke={SLOT_COLORS[slots[team.id]]}
                  strokeWidth={hoveredTeamId === team.id ? 3 : 2}
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {highlighted.map((team, i) => (
              <text
                key={team.id}
                x={MARGIN.left + plotWidth + 8}
                y={labelYs[i]}
                dy="0.32em"
                className="fill-foreground text-xs font-medium"
              >
                {team.teamName.length > maxLabelLength
                  ? `${team.teamName.slice(0, maxLabelLength - 1)}…`
                  : team.teamName}
              </text>
            ))}

            {activeIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={x(activeIndex)}
                  x2={x(activeIndex)}
                  y1={MARGIN.top}
                  y2={MARGIN.top + plotHeight}
                  className="stroke-muted-foreground/60"
                  strokeWidth={1}
                />
                {tooltipTeams.map((team) => (
                  <circle
                    key={team.id}
                    cx={x(activeIndex)}
                    cy={y(team.values[activeIndex])}
                    r={4}
                    fill={
                      slots[team.id] !== undefined
                        ? SLOT_COLORS[slots[team.id]]
                        : "var(--muted-foreground)"
                    }
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
          </svg>

          {activeIndex !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
              style={{
                left: x(activeIndex),
                transform: tooltipOnLeft ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
              }}
            >
              <p className="text-xs text-muted-foreground">
                {activeIndex === 0
                  ? "Start"
                  : dateFormatter.format(new Date(dates[activeIndex]))}
              </p>
              {tooltipTeams.length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">No teams highlighted</p>
              )}
              <ul className="mt-1.5 space-y-1">
                {tooltipTeams.map((team) => {
                  const gained =
                    activeIndex > 0 ? team.values[activeIndex] - team.values[activeIndex - 1] : 0;
                  return (
                    <li key={team.id} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className="h-0.5 w-3 shrink-0 rounded-full"
                        style={{
                          background:
                            slots[team.id] !== undefined
                              ? SLOT_COLORS[slots[team.id]]
                              : "var(--muted-foreground)",
                        }}
                      />
                      <span className="font-semibold tabular-nums">{team.values[activeIndex]}</span>
                      <span className="truncate text-muted-foreground">{team.teamName}</span>
                      {gained > 0 && (
                        <span className="ml-auto pl-2 text-xs tabular-nums text-muted-foreground">
                          +{gained}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <ol aria-label="Teams" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((team, index) => {
            const slot = slots[team.id];
            const selected = slot !== undefined;
            const full = !selected && Object.keys(slots).length >= MAX_HIGHLIGHTS;
            const rank = series.findIndex((other) => other.total === team.total) + 1;
            return (
              <li key={team.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={full}
                  title={full ? `Up to ${MAX_HIGHLIGHTS} teams can be highlighted` : undefined}
                  onClick={() => toggleTeam(team.id)}
                  onPointerEnter={() => setHoveredTeamId(team.id)}
                  onPointerLeave={() => setHoveredTeamId(null)}
                  onFocus={() => setHoveredTeamId(team.id)}
                  onBlur={() => setHoveredTeamId(null)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "border-brand/50 bg-brand/10"
                      : "border-border bg-muted/40 hover:border-brand/40 hover:bg-muted/60",
                    full && "cursor-not-allowed opacity-60 hover:border-border hover:bg-muted/40",
                  )}
                >
                  <span className="w-7 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {series.some((other, i) => i !== index && other.total === team.total)
                      ? `T${rank}`
                      : rank}
                  </span>
                  <span
                    aria-hidden
                    className="h-0.5 w-4 shrink-0 rounded-full"
                    style={{ background: selected ? SLOT_COLORS[slot] : "var(--race-context)" }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {team.teamName}
                    {team.id === myEntrantId && (
                      <span className="ml-1 font-normal text-muted-foreground">(you)</span>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{team.total}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
