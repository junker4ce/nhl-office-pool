"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pool, Season, Team } from "@prisma/client";
import { ArrowDown, ArrowUp } from "lucide-react";
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

function pickedOptionConfirmMessage(pickCount: number) {
  const single = pickCount === 1;
  return (
    `This player has been picked by ${pickCount} ${single ? "entrant" : "entrants"}. ` +
    `Removing them will also delete ${single ? "that pick" : "those picks"}, ` +
    `leaving ${single ? "that entrant" : "those entrants"} without a pick in this box.\n\n` +
    "Remove anyway?"
  );
}

export function PoolBoxSetup({ pools }: Props) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id ?? "");
  const [poolData, setPoolData] = useState<PoolBoxResponse["pool"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [boxError, setBoxError] = useState<{ boxId: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerWithTeam[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [creatingBox, setCreatingBox] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm);
  const [activeBoxId, setActiveBoxId] = useState<string>("");
  const [addingPlayerId, setAddingPlayerId] = useState<string | null>(null);
  const [reorderingBoxId, setReorderingBoxId] = useState<string | null>(null);

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

  useEffect(() => {
    setActiveBoxId((prev) => {
      if (prev && poolData?.boxes.some((box) => box.id === prev)) return prev;
      return poolData?.boxes[0]?.id ?? "";
    });
  }, [poolData]);

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
    setAddingPlayerId(playerId);

    const response = await fetch(`/api/admin/pools/${selectedPoolId}/boxes/${boxId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not add player option.");
      setAddingPlayerId(null);
      return;
    }

    const refresh = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`);
    if (refresh.ok) {
      const data = (await refresh.json()) as PoolBoxResponse;
      setPoolData(data.pool);
    }

    const box = poolData?.boxes.find((candidate) => candidate.id === boxId);
    setMessage(box ? `Added to "${box.title}".` : "Player option added.");
    setAddingPlayerId(null);
  }

  async function deleteOption(boxId: string, optionId: string) {
    if (!selectedPoolId) return;

    const url = `/api/admin/pools/${selectedPoolId}/boxes/${boxId}/options/${optionId}`;
    let response = await fetch(url, { method: "DELETE" });

    if (response.status === 409) {
      const data = (await response.json().catch(() => null)) as { pickCount?: number } | null;
      const pickCount = data?.pickCount ?? 0;
      if (!window.confirm(pickedOptionConfirmMessage(pickCount))) return;

      response = await fetch(`${url}?force=true`, { method: "DELETE" });
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setBoxError({ boxId, message: data?.error ?? "Could not remove player option." });
      return;
    }

    const result = (await response.json().catch(() => null)) as { removedPickCount?: number } | null;
    const removedPickCount = result?.removedPickCount ?? 0;
    setBoxError(null);

    const refresh = await fetch(`/api/admin/pools/${selectedPoolId}/boxes`);
    if (refresh.ok) {
      const data = (await refresh.json()) as PoolBoxResponse;
      setPoolData(data.pool);
    }

    if (removedPickCount > 0) {
      const pickLabel = removedPickCount === 1 ? "pick" : "picks";
      setMessage(`Player option removed along with ${removedPickCount} ${pickLabel}.`);
    } else {
      setMessage("Player option removed.");
    }
  }

  async function moveOption(boxId: string, index: number, direction: -1 | 1) {
    if (!selectedPoolId || !poolData) return;

    const box = poolData.boxes.find((candidate) => candidate.id === boxId);
    const targetIndex = index + direction;
    if (!box || targetIndex < 0 || targetIndex >= box.playerOptions.length) return;

    const previousPoolData = poolData;
    const reordered = [...box.playerOptions];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setMessage(null);
    setReorderingBoxId(boxId);
    setPoolData({
      ...poolData,
      boxes: poolData.boxes.map((candidate) =>
        candidate.id === boxId ? { ...candidate, playerOptions: reordered } : candidate,
      ),
    });

    const response = await fetch(`/api/admin/pools/${selectedPoolId}/boxes/${boxId}/options`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: reordered.map((option) => option.id) }),
    });

    setReorderingBoxId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setPoolData(previousPoolData);
      setMessage(data?.error ?? "Could not reorder player options.");
    }
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
    <Card className="border-brand/20 bg-card">
      <CardHeader>
        <CardTitle>Pool box setup</CardTitle>
        <CardDescription>
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
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
              >
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name} ({pool.season.label})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
            <p className="font-semibold text-foreground">Office pool details</p>
            <p>Name: {selectedPool?.name ?? "-"}</p>
            <p>Configured boxes: {poolData?.boxes.length ?? 0} / {selectedPool?.boxCount ?? 0}</p>
          </div>
        </div>

        {!selectedPool && <p className="text-sm text-muted-foreground">No office pool has been created yet.</p>}

        {selectedPool && (
          <form action={createBox} className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 lg:grid-cols-4">
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
              <Button type="submit" disabled={creatingBox || !selectedPoolId} className="bg-brand text-brand-foreground hover:bg-brand/90">
                {creatingBox ? "Creating box..." : "Create box"}
              </Button>
            </div>
          </form>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground">Player search</p>
            <Input
              value={searchQuery}
              onChange={(event) => void searchPlayers(event.target.value)}
              placeholder="Search players by name"
            />
            <p className="text-xs text-muted-foreground">
              Searches players already saved in this app database. If no results appear, add players below first.
            </p>

            {poolData?.boxes.length ? (
              <div className="space-y-1">
                <Label htmlFor="activeBoxId" className="text-xs">Add to box</Label>
                <select
                  id="activeBoxId"
                  value={activeBoxId}
                  onChange={(event) => setActiveBoxId(event.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
                >
                  {poolData.boxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      #{box.boxOrder} {box.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              searchQuery.trim() &&
              availableSearchResults.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-300">Create a box below before assigning players.</p>
              )
            )}

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm text-foreground">
              {!searchQuery.trim() && <p>Type a player name to search.</p>}
              {searchLoading && <p>Searching players...</p>}
              {searchError && <p className="text-destructive">{searchError}</p>}
              {!searchLoading && !searchError && searchQuery.trim() && availableSearchResults.length === 0 && (
                <p>No available players match this search.</p>
              )}
              {availableSearchResults.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-2"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.position} {player.team ? `- ${player.team.abbreviation}` : ""}
                    </p>
                  </div>
                  {poolData?.boxes.length ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={!activeBoxId || addingPlayerId === player.id}
                      onClick={() => void addOption(activeBoxId, player.id)}
                      className="bg-brand text-brand-foreground hover:bg-brand/90"
                    >
                      {addingPlayerId === player.id ? "Adding..." : "Add"}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground">Quick add player</p>
            <p className="text-xs text-muted-foreground">
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
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {savingPlayer ? "Saving player..." : "Save player"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Boxes</p>
          {loading && <p className="text-sm text-muted-foreground">Loading boxes...</p>}
          {!loading && (!poolData || poolData.boxes.length === 0) && (
            <p className="text-sm text-muted-foreground">No boxes yet.</p>
          )}

          {!loading &&
            poolData?.boxes.map((box) => (
              <div key={box.id} className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      #{box.boxOrder} {box.title}
                    </p>
                    {box.description && <p className="text-xs text-muted-foreground">{box.description}</p>}
                  </div>
                  <Badge variant="outline">
                    {box.playerOptions.length} options
                  </Badge>
                </div>

                <div className="grid gap-2 lg:grid-cols-2">
                  {box.playerOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No options yet.</p>
                  )}
                  {box.playerOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/60 p-2">
                      <p className="text-sm text-foreground">
                        <span className="mr-1 text-muted-foreground">{index + 1}.</span>
                        {option.player.firstName} {option.player.lastName} ({option.player.position})
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Move ${option.player.firstName} ${option.player.lastName} up`}
                          disabled={index === 0 || reorderingBoxId === box.id}
                          onClick={() => void moveOption(box.id, index, -1)}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Move ${option.player.firstName} ${option.player.lastName} down`}
                          disabled={index === box.playerOptions.length - 1 || reorderingBoxId === box.id}
                          onClick={() => void moveOption(box.id, index, 1)}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => void deleteOption(box.id, option.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {boxError?.boxId === box.id && (
                  <p className="text-sm text-destructive">{boxError.message}</p>
                )}
              </div>
            ))}
        </div>

        {message && <p className="text-sm text-brand">{message}</p>}
      </CardContent>
    </Card>
  );
}
