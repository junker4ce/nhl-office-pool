"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pool, Season, Team } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PoolWithSeason = Pool & {
  season: Season;
};

type PlayerWithTeam = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  team: Team | null;
};

type BoxOption = {
  id: string;
  player: PlayerWithTeam;
};

type BoxData = {
  id: string;
  title: string;
  description: string | null;
  boxOrder: number;
  playerOptions: BoxOption[];
};

type PoolBoxResponse = {
  pool: {
    id: string;
    name: string;
    boxCount: number;
    boxes: BoxData[];
  };
};

type Props = {
  pools: PoolWithSeason[];
};

const emptyPlayerForm = {
  nhlId: "",
  firstName: "",
  lastName: "",
  position: "",
};

export function PoolBoxSetup({ pools }: Props) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id ?? "");
  const [poolData, setPoolData] = useState<PoolBoxResponse["pool"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerWithTeam[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [creatingBox, setCreatingBox] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm);

  const selectedPool = useMemo(
    () => pools.find((pool) => pool.id === selectedPoolId) ?? null,
    [pools, selectedPoolId],
  );

  const usedPlayerIds = useMemo(
    () =>
      new Set(
        poolData?.boxes.flatMap((box) => box.playerOptions.map((option) => option.player.id)) ?? [],
      ),
    [poolData],
  );

  const availableSearchResults = useMemo(
    () => searchResults.filter((player) => !usedPlayerIds.has(player.id)),
    [searchResults, usedPlayerIds],
  );

  useEffect(() => {
    async function loadBoxes() {
      if (!selectedPoolId) {
        setPoolData(null);
        return;
      }

      setLoading(true);
      setMessage(null);

      const response = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`);
      setLoading(false);

      if (!response.ok) {
        setPoolData(null);
        setMessage("Could not load pool boxes.");
        return;
      }

      const data = (await response.json()) as PoolBoxResponse;
      setPoolData(data.pool);
    }

    void loadBoxes();
  }, [selectedPoolId]);

  async function createBox(formData: FormData) {
    if (!selectedPoolId) return;

    setCreatingBox(true);
    setMessage(null);

    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      boxOrder: formData.get("boxOrder") ? Number(String(formData.get("boxOrder"))) : undefined,
    };

    const response = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setCreatingBox(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not create box.");
      return;
    }

    const refresh = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`);
    if (refresh.ok) {
      const data = (await refresh.json()) as PoolBoxResponse;
      setPoolData(data.pool);
    }

    setMessage("Box created.");
  }

  async function searchPlayers(query: string) {
    setSearchQuery(query);
    setSearchError(null);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const response = await fetch(
      `/api/admin/players?query=${encodeURIComponent(query.trim())}&poolId=${encodeURIComponent(selectedPoolId)}`,
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setSearchResults([]);
      setSearchError(data?.error ?? "Could not search players.");
      setSearchLoading(false);
      return;
    }

    const data = (await response.json()) as { players: PlayerWithTeam[] };
    setSearchResults(data.players);
    setSearchLoading(false);
  }

  async function addOption(boxId: string, playerId: string) {
    if (!selectedPoolId) return;

    setMessage(null);

    const response = await fetch(`/api/admin/pools/${selectedPoolId}/boxes/${boxId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not add player option.");
      return;
    }

    const refresh = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`);
    if (refresh.ok) {
      const data = (await refresh.json()) as PoolBoxResponse;
      setPoolData(data.pool);
    }

    setMessage("Player option added.");
  }

  async function deleteOption(boxId: string, optionId: string) {
    if (!selectedPoolId) return;

    const response = await fetch(
      `/api/admin/pools/${selectedPoolId}/boxes/${boxId}/options/${optionId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      setMessage("Could not remove player option.");
      return;
    }

    const refresh = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`);
    if (refresh.ok) {
      const data = (await refresh.json()) as PoolBoxResponse;
      setPoolData(data.pool);
    }

    setMessage("Player option removed.");
  }

  async function savePlayer() {
    setSavingPlayer(true);
    setMessage(null);

    const payload = {
      nhlId: Number(playerForm.nhlId),
      firstName: playerForm.firstName.trim(),
      lastName: playerForm.lastName.trim(),
      position: playerForm.position.trim().toUpperCase(),
    };

    const response = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingPlayer(false);

    if (!response.ok) {
      setMessage("Could not save player.");
      return;
    }

    setMessage("Player saved. You can now search and add to boxes.");
    setPlayerForm(emptyPlayerForm);

    if (searchQuery.trim()) {
      await searchPlayers(searchQuery);
    }
  }

  return (
    <Card className="border-cyan-300/20 bg-slate-900/85">
      <CardHeader>
        <CardTitle className="text-slate-100">Pool box setup</CardTitle>
        <CardDescription className="text-slate-300">
          Define each box and add player choices for entrants.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {pools.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="poolId">Pool</Label>
              <select
                id="poolId"
                value={selectedPoolId}
                onChange={(event) => setSelectedPoolId(event.target.value)}
                className="h-8 w-full rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100"
              >
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name} ({pool.season.label})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-md border border-slate-700/70 bg-slate-950/50 p-3 text-sm text-slate-200">
            <p className="font-semibold text-slate-100">Office pool details</p>
            <p>Name: {selectedPool?.name ?? "-"}</p>
            <p>Configured boxes: {poolData?.boxes.length ?? 0} / {selectedPool?.boxCount ?? 0}</p>
          </div>
        </div>

        {!selectedPool && <p className="text-sm text-slate-300">No office pool has been created yet.</p>}

        {selectedPool && (
          <form action={createBox} className="grid gap-3 rounded-md border border-slate-700/70 bg-slate-950/40 p-3 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="title">Box title</Label>
            <Input id="title" name="title" placeholder="Top Scorer" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boxOrder">Order (optional)</Label>
            <Input id="boxOrder" name="boxOrder" type="number" min={1} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" name="description" placeholder="Any winger" />
          </div>
            <div className="lg:col-span-4">
              <Button type="submit" disabled={creatingBox || !selectedPoolId} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                {creatingBox ? "Creating box..." : "Create box"}
              </Button>
            </div>
          </form>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border border-slate-700/70 bg-slate-950/40 p-3">
            <p className="text-sm font-semibold text-slate-100">Player search</p>
            <Input
              value={searchQuery}
              onChange={(event) => void searchPlayers(event.target.value)}
              placeholder="Search players by name"
            />
            <p className="text-xs text-slate-300">
              Searches players already saved in this app database. If no results appear, add players below first.
            </p>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1 text-sm text-slate-200">
              {!searchQuery.trim() && <p>Type a player name to search.</p>}
              {searchLoading && <p>Searching players...</p>}
              {searchError && <p className="text-rose-200">{searchError}</p>}
              {!searchLoading && !searchError && searchQuery.trim() && availableSearchResults.length === 0 && (
                <p>No available players match this search.</p>
              )}
              {availableSearchResults.map((player) => (
                <div key={player.id} className="rounded-md border border-slate-700/70 bg-slate-900/50 p-2">
                  <p className="font-medium text-slate-100">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-xs text-slate-300">
                    {player.position} {player.team ? `- ${player.team.abbreviation}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-slate-700/70 bg-slate-950/40 p-3">
            <p className="text-sm font-semibold text-slate-100">Quick add player</p>
            <p className="text-xs text-slate-300">
              Use this when a player is not in search results yet.
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
              <Input
                placeholder="NHL ID"
                type="number"
                value={playerForm.nhlId}
                onChange={(event) =>
                  setPlayerForm((prev) => ({ ...prev, nhlId: event.target.value }))
                }
              />
              <Input
                placeholder="Position (C, LW, RW, D, G)"
                value={playerForm.position}
                onChange={(event) =>
                  setPlayerForm((prev) => ({ ...prev, position: event.target.value }))
                }
              />
              <Input
                placeholder="First name"
                value={playerForm.firstName}
                onChange={(event) =>
                  setPlayerForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
              />
              <Input
                placeholder="Last name"
                value={playerForm.lastName}
                onChange={(event) =>
                  setPlayerForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
              />
            </div>
            <Button
              type="button"
              disabled={
                savingPlayer ||
                !playerForm.nhlId ||
                !playerForm.firstName ||
                !playerForm.lastName ||
                !playerForm.position
              }
              onClick={() => void savePlayer()}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {savingPlayer ? "Saving player..." : "Save player"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-100">Boxes</p>
          {loading && <p className="text-sm text-slate-300">Loading boxes...</p>}
          {!loading && (!poolData || poolData.boxes.length === 0) && (
            <p className="text-sm text-slate-300">No boxes yet.</p>
          )}

          {!loading &&
            poolData?.boxes.map((box) => (
              <div key={box.id} className="space-y-3 rounded-md border border-slate-700/70 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">
                      #{box.boxOrder} {box.title}
                    </p>
                    {box.description && <p className="text-xs text-slate-300">{box.description}</p>}
                  </div>
                  <Badge variant="outline" className="text-slate-100">
                    {box.playerOptions.length} options
                  </Badge>
                </div>

                <div className="grid gap-2 lg:grid-cols-2">
                  {box.playerOptions.length === 0 && (
                    <p className="text-xs text-slate-300">No options yet.</p>
                  )}
                  {box.playerOptions.map((option) => (
                    <div key={option.id} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/50 p-2">
                      <p className="text-sm text-slate-100">
                        {option.player.firstName} {option.player.lastName} ({option.player.position})
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-200 hover:bg-rose-950/60"
                        onClick={() => void deleteOption(box.id, option.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-300">Add option from current search results:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSearchResults.slice(0, 10).map((player) => (
                      <Button
                        key={`${box.id}-${player.id}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void addOption(box.id, player.id)}
                      >
                        + {player.firstName} {player.lastName}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {message && <p className="text-sm text-cyan-100">{message}</p>}
      </CardContent>
    </Card>
  );
}
