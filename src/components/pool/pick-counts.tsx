"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PoolPickCounts } from "@/lib/pick-counts";
import { cn } from "@/lib/utils";

export type PickComparison = {
  myOptionIds: string[];
  compareTeam: { id: string; teamName: string; optionIds: string[] } | null;
  teams: Array<{ id: string; teamName: string }>;
};

type Props = {
  data: PoolPickCounts;
  showPickers?: boolean;
  comparison?: PickComparison | null;
};

type PickOwner = "mine" | "theirs" | "both";

type SortKey = "picks" | "points";

type PlayerOption = PoolPickCounts["boxes"][number]["options"][number];

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "picks", label: "Most picked" },
  { key: "points", label: "Most points" },
];

const SORTERS: Record<SortKey, (a: PlayerOption, b: PlayerOption) => number> = {
  picks: (a, b) =>
    b.pickCount - a.pickCount ||
    b.stats.points - a.stats.points ||
    a.player.lastName.localeCompare(b.player.lastName),
  points: (a, b) =>
    b.stats.points - a.stats.points ||
    b.pickCount - a.pickCount ||
    a.player.lastName.localeCompare(b.player.lastName),
};

function statLine(option: PlayerOption) {
  const { stats } = option;
  if (option.player.position === "G") {
    return `${stats.goalieWin}W ${stats.goalieShutout}SO`;
  }
  return `${stats.goals}G ${stats.assists}A`;
}

const ROW_STYLES: Record<PickOwner, string> = {
  mine: "border-brand/60 bg-brand/10",
  theirs: "border-violet-500/60 bg-violet-500/10",
  both: "border-brand/60 bg-linear-to-r from-brand/15 to-violet-500/15",
};

export function PickCounts({ data, showPickers = true, comparison = null }: Props) {
  const router = useRouter();
  const [comparing, startComparing] = useTransition();
  const [expandedOptionIds, setExpandedOptionIds] = useState<Set<string>>(() => new Set());
  const [sortKey, setSortKey] = useState<SortKey>("picks");

  const myOptionIds = new Set(comparison?.myOptionIds ?? []);
  const compareTeam = comparison?.compareTeam ?? null;
  const theirOptionIds = new Set(compareTeam?.optionIds ?? []);
  const sharedPickCount = [...myOptionIds].filter((id) => theirOptionIds.has(id)).length;

  function ownerOf(optionId: string): PickOwner | null {
    const mine = myOptionIds.has(optionId);
    const theirs = theirOptionIds.has(optionId);
    if (mine && theirs) return "both";
    if (mine) return "mine";
    if (theirs) return "theirs";
    return null;
  }

  function selectCompareTeam(entrantId: string) {
    const params = new URLSearchParams({ view: "pick-counts" });
    if (entrantId) {
      params.set("compare", entrantId);
    }
    startComparing(() => router.push(`/?${params}`, { scroll: false }));
  }

  function togglePickers(optionId: string) {
    setExpandedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  }

  return (
    <div className="@container space-y-5">
      <Card className="border-brand/20 bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-4xl uppercase text-brand">
            Box Breakdown
          </CardTitle>
          <CardDescription>
            {data.name} - {data.seasonLabel} - {data.entrantCount}{" "}
            {data.entrantCount === 1 ? "entrant" : "entrants"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort players by</span>
            <div
              role="group"
              aria-label="Sort players"
              className="inline-flex rounded-lg border border-border p-0.5"
            >
              {SORTS.map((sort) => (
                <button
                  key={sort.key}
                  type="button"
                  aria-pressed={sortKey === sort.key}
                  onClick={() => setSortKey(sort.key)}
                  className={cn(
                    "rounded-md px-3 py-1 transition-colors",
                    sortKey === sort.key
                      ? "bg-brand/15 font-medium text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
          {comparison && comparison.teams.length > 0 && (
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Compare your picks with</span>
              <select
                value={compareTeam?.id ?? ""}
                onChange={(event) => selectCompareTeam(event.target.value)}
                disabled={comparing}
                className="h-8 min-w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 [&_option]:bg-popover [&_option]:text-popover-foreground"
              >
                <option value="">No one</option>
                {comparison.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {comparison && (
            <div className="flex flex-wrap items-center gap-2">
              <PickTag owner="mine" />
              {compareTeam && (
                <>
                  <PickTag owner="theirs" teamName={compareTeam.teamName} />
                  <PickTag owner="both" teamName={compareTeam.teamName} />
                  <span className="text-sm text-muted-foreground">
                    You share {sharedPickCount} of {data.boxes.length} picks with{" "}
                    {compareTeam.teamName}.
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {data.boxes.length === 0 && (
        <p className="text-sm text-muted-foreground">No boxes configured for this pool yet.</p>
      )}

      <div className="grid items-start gap-5 @4xl:grid-cols-2">
        {data.boxes.map((box) => {
          const owners = box.options.map((option) => ownerOf(option.id));
          const samePick = owners.includes("both");
          const bothPicked = samePick || (owners.includes("mine") && owners.includes("theirs"));

          return (
            <Card key={box.id} className="border-brand/20 bg-card">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  Box {box.boxOrder}: {box.title}
                  {compareTeam && bothPicked && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        samePick
                          ? "bg-brand/15 text-brand"
                          : "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                      )}
                    >
                      {samePick ? "Same pick" : "Different picks"}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {box.totalPicks} of {data.entrantCount} entrants picked this box
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {box.options.length === 0 && (
                  <p className="text-sm text-muted-foreground">No player options configured yet.</p>
                )}

                {box.options.toSorted(SORTERS[sortKey]).map((option) => {
                  const share = box.totalPicks > 0 ? option.pickCount / box.totalPicks : 0;
                  const percent = Math.round(share * 100);
                  const barColor = option.player.team?.primaryColorHex ?? "#22D3EE";
                  const expanded = expandedOptionIds.has(option.id);
                  const pickersListId = `pickers-${option.id}`;
                  const owner = ownerOf(option.id);

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-md border p-2 text-sm text-foreground",
                        owner ? cn("pl-3.5", ROW_STYLES[owner]) : "border-border bg-muted/40"
                      )}
                    >
                      {owner && <OwnerStripe owner={owner} />}
                      {option.player.team?.logoUrl ? (
                        <img
                          src={option.player.team.logoUrl}
                          alt={`${option.player.team.name} logo`}
                          className="h-8 w-8 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="h-8 w-8 shrink-0" />
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-semibold">
                            {option.player.firstName} {option.player.lastName} ({option.player.position})
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            <span className="font-semibold text-foreground">{option.pickCount}</span>
                            {" "}
                            ({percent}%)
                            {showPickers && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="ml-1 align-middle"
                                disabled={option.pickCount === 0}
                                aria-expanded={expanded}
                                aria-controls={pickersListId}
                                aria-label={`${expanded ? "Hide" : "Show"} teams that picked ${option.player.firstName} ${option.player.lastName}`}
                                onClick={() => togglePickers(option.id)}
                              >
                                <ChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                              </Button>
                            )}
                          </span>
                        </div>
                        {owner && (
                          <div className="flex flex-wrap gap-1">
                            <PickTag owner={owner} teamName={compareTeam?.teamName} />
                          </div>
                        )}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${share * 100}%`, backgroundColor: barColor }}
                          />
                        </div>
                        {expanded && option.pickers.length > 0 && (
                          <ul id={pickersListId} className="flex flex-wrap gap-1 pt-1">
                            {option.pickers.map((picker) => (
                              <li
                                key={picker.entrantId}
                                className="rounded-full border border-border bg-background px-2 py-0.5 text-xs"
                              >
                                {picker.teamName}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="w-14 shrink-0 text-right">
                        <p className="text-xl font-semibold leading-none tabular-nums text-foreground">
                          {option.stats.points}
                        </p>
                        <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {option.stats.points === 1 ? "pt" : "pts"}
                        </p>
                        <p className="text-xs tabular-nums text-muted-foreground">{statLine(option)}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Left-edge marker; a shared pick splits it so both colours stay visible.
function OwnerStripe({ owner }: { owner: PickOwner }) {
  return (
    <span aria-hidden="true" className="absolute inset-y-0 left-0 flex w-1.5 flex-col">
      {owner !== "theirs" && <span className="flex-1 bg-brand" />}
      {owner !== "mine" && <span className="flex-1 bg-violet-500" />}
    </span>
  );
}

function PickTag({ owner, teamName }: { owner: PickOwner; teamName?: string }) {
  if (owner === "both") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-brand/20 to-violet-500/20 px-2 py-0.5 text-xs font-medium text-foreground ring-1 ring-brand/40">
        <Check className="size-3" aria-hidden="true" />
        You &amp; {teamName ?? "them"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        owner === "mine"
          ? "bg-brand/15 text-brand"
          : "bg-violet-500/15 text-violet-700 dark:text-violet-300"
      )}
    >
      {owner === "mine" ? "Your pick" : `${teamName ?? "Their"} pick`}
    </span>
  );
}
