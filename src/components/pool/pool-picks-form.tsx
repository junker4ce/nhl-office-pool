"use client";

import { useMemo, useState } from "react";
import type { EntrantPick, Pool, PoolEntrant, PoolBox, PoolBoxPlayerOption, Player, Season, Team } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlayerOptionWithPlayer = PoolBoxPlayerOption & {
  player: Player & {
    team: Team | null;
  };
};

type PoolBoxWithOptions = PoolBox & {
  playerOptions: PlayerOptionWithPlayer[];
};

type PoolDetail = Pool & {
  season: Season;
  boxes: PoolBoxWithOptions[];
};

type EntrantWithPicks = PoolEntrant & {
  picks: EntrantPick[];
};

type Props = {
  pool: PoolDetail;
  entrant: EntrantWithPicks | null;
  locked: boolean;
};

export function PoolPicksForm({ pool, entrant: initialEntrant, locked: initialLocked }: Props) {
  const [entrant, setEntrant] = useState<EntrantWithPicks | null>(initialEntrant);
  const [locked, setLocked] = useState(initialLocked);
  const [message, setMessage] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [selectedByBoxId, setSelectedByBoxId] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};

    for (const pick of initialEntrant?.picks ?? []) {
      values[pick.poolBoxId] = pick.playerOptionId;
    }

    return values;
  });

  const completedCount = useMemo(
    () => Object.keys(selectedByBoxId).length,
    [selectedByBoxId],
  );

  async function refreshData() {
    const response = await fetch(`/api/pools/${pool.id}/picks`);

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      entrant: EntrantWithPicks | null;
      locked: boolean;
    };

    setEntrant(data.entrant);
    setLocked(data.locked);

    const values: Record<string, string> = {};
    for (const pick of data.entrant?.picks ?? []) {
      values[pick.poolBoxId] = pick.playerOptionId;
    }
    setSelectedByBoxId(values);
  }

  async function joinPool() {
    setJoinLoading(true);
    setMessage(null);

    const response = await fetch(`/api/pools/${pool.id}/join`, {
      method: "POST",
    });

    setJoinLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not join pool.");
      return;
    }

    await refreshData();
    setMessage("Joined pool. You can now submit picks.");
  }

  async function savePicks() {
    if (!entrant) return;

    setSaveLoading(true);
    setMessage(null);

    const payload = {
      picks: Object.entries(selectedByBoxId).map(([poolBoxId, playerOptionId]) => ({
        poolBoxId,
        playerOptionId,
      })),
    };

    if (payload.picks.length === 0) {
      setSaveLoading(false);
      setMessage("Choose at least one pick before saving.");
      return;
    }

    const response = await fetch(`/api/pools/${pool.id}/picks`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setSaveLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not save picks.");
      await refreshData();
      return;
    }

    setMessage("Picks saved.");
    await refreshData();
  }

  return (
    <div className="space-y-5">
      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-100">{pool.name}</CardTitle>
              <CardDescription className="text-slate-300">
                {pool.season.label} - one player per box
              </CardDescription>
            </div>
            <Badge className={locked ? "bg-rose-500/20 text-rose-100" : "bg-cyan-500/20 text-cyan-100"}>
              {locked ? "Locked" : "Open"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200">
          <p>
            Progress: {completedCount} / {pool.boxes.length} boxes selected
          </p>
          {!entrant && !locked && (
            <Button
              type="button"
              onClick={() => void joinPool()}
              disabled={joinLoading}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {joinLoading ? "Joining..." : "Join this pool"}
            </Button>
          )}
          {!entrant && locked && <p>Pool is locked and can no longer be joined.</p>}
          {message && <p className="text-cyan-100">{message}</p>}
        </CardContent>
      </Card>

      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-slate-100">How scoring works</CardTitle>
          <CardDescription className="text-slate-300">
            Each player you pick earns points for your entry based on their real NHL stats:
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-200">
          <ul className="list-disc space-y-1 pl-5">
            <li>Goal - 1 point</li>
            <li>Assist - 1 point</li>
            <li>Goalie win - 2 points</li>
            <li>Goalie shutout - 3 points</li>
          </ul>
        </CardContent>
      </Card>

      {pool.boxes.map((box) => (
        <Card key={box.id} className="border-cyan-300/20 bg-slate-900/85">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Box {box.boxOrder}: {box.title}
            </CardTitle>
            {box.description && <CardDescription className="text-slate-300">{box.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-2">
            {box.playerOptions.length === 0 && (
              <p className="text-sm text-slate-300">No player options configured yet.</p>
            )}

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {box.playerOptions.map((option) => {
                const initials = `${option.player.firstName.charAt(0) ?? ""}${option.player.lastName.charAt(0) ?? ""}`.toUpperCase();
                const teamPrimaryColor = option.player.team?.primaryColorHex ?? "#22D3EE";
                const teamSecondaryColor = option.player.team?.secondaryColorHex ?? "#334155";
                const isSelected = selectedByBoxId[box.id] === option.id;

                return (
                  <label
                    key={option.id}
                    className={`relative flex h-full cursor-pointer overflow-hidden rounded-md border p-3 text-sm text-slate-100 transition ${
                      isSelected
                        ? "border-cyan-300/90 bg-cyan-500/10 ring-2 ring-cyan-300/70"
                        : "border-slate-700/80 bg-slate-950/50 hover:border-cyan-300/40"
                    } focus-within:ring-2 focus-within:ring-cyan-300/80`}
                  >
                    {isSelected && (
                      <span className="absolute right-2 top-2 z-20 rounded-full border border-cyan-200/70 bg-cyan-300/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
                        Picked
                      </span>
                    )}

                    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[62%]">
                      <span className="block h-[5px] w-full" style={{ backgroundColor: teamPrimaryColor, opacity: 0.9 }} />
                      <span className="mt-1 block h-[3px] w-full" style={{ backgroundColor: teamSecondaryColor, opacity: 0.85 }} />
                    </div>

                    <div className="relative z-10 flex w-full items-center gap-3">
                      <input
                        type="radio"
                        name={`box-${box.id}`}
                        value={option.id}
                        className="sr-only"
                        checked={selectedByBoxId[box.id] === option.id}
                        onChange={(event) =>
                          setSelectedByBoxId((prev) => ({
                            ...prev,
                            [box.id]: event.target.value,
                          }))
                        }
                        disabled={!entrant || locked}
                      />

                      <span
                        aria-hidden
                        className={`h-4 w-4 rounded-full border transition ${
                          isSelected
                            ? "border-cyan-200 bg-cyan-300"
                            : "border-slate-400/80 bg-transparent"
                        }`}
                      />

                      {option.player.headshotUrl ? (
                        <img
                          src={option.player.headshotUrl}
                          alt={`${option.player.firstName} ${option.player.lastName} headshot`}
                          className="h-14 w-14 rounded-full border border-slate-700 bg-slate-900 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-[10px] font-semibold text-slate-200">
                          {initials || "NHL"}
                        </div>
                      )}

                      <div className="flex flex-1 items-center justify-between gap-3">
                        <span className="font-semibold tracking-wide text-slate-50 drop-shadow-[0_1px_0_rgba(2,6,23,0.75)]">
                          {option.player.firstName} {option.player.lastName} ({option.player.position})
                        </span>

                        <div className="flex items-center gap-1">
                          {option.player.team?.logoUrl ? (
                            <img
                              src={option.player.team.logoUrl}
                              alt="Team logo"
                              className="h-20 w-20 object-contain"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!entrant || locked || saveLoading}
          onClick={() => void savePicks()}
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        >
          {saveLoading ? "Saving picks..." : "Save picks"}
        </Button>
      </div>
    </div>
  );
}
