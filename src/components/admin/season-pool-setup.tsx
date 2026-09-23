"use client";

import { useMemo, useState } from "react";
import type { Pool, Season } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SeasonWithPoolCount = Season & {
  pools?: Array<{ id: string }>;
};

type PoolWithSeason = Pool & {
  season: Season;
};

type Props = {
  seasons: SeasonWithPoolCount[];
  pools: PoolWithSeason[];
};

const nowIsoMinute = new Date().toISOString().slice(0, 16);

export function SeasonPoolSetup({ seasons, pools }: Props) {
  const [seasonState, setSeasonState] = useState<SeasonWithPoolCount[]>(seasons);
  const [poolState, setPoolState] = useState<PoolWithSeason[]>(pools);
  const [message, setMessage] = useState<string | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);

  const availableSeasons = useMemo(
    () =>
      seasonState.filter((season) => {
        const hasPool = poolState.some((pool) => pool.seasonId === season.id);
        return !hasPool;
      }),
    [poolState, seasonState],
  );

  async function handleSeasonSubmit(formData: FormData) {
    setMessage(null);
    setSeasonLoading(true);

    const payload = {
      label: String(formData.get("label") ?? "").trim(),
      startDate: new Date(String(formData.get("startDate") ?? "")).toISOString(),
      endDate: new Date(String(formData.get("endDate") ?? "")).toISOString(),
      status: "DRAFT",
    };

    const response = await fetch("/api/admin/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSeasonLoading(false);

    if (!response.ok) {
      setMessage("Could not create season.");
      return;
    }

    const data = (await response.json()) as { season: Season };
    setSeasonState((prev) => [data.season, ...prev]);
    setMessage("Season created.");
  }

  async function handlePoolSubmit(formData: FormData) {
    setMessage(null);
    setPoolLoading(true);

    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      seasonId: String(formData.get("seasonId") ?? ""),
      boxCount: Number(String(formData.get("boxCount") ?? "0")),
      entrantLimit: formData.get("entrantLimit")
        ? Number(String(formData.get("entrantLimit")))
        : null,
      lockAt: formData.get("lockAt")
        ? new Date(String(formData.get("lockAt"))).toISOString()
        : null,
    };

    const response = await fetch("/api/admin/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPoolLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not create pool.");
      return;
    }

    const data = (await response.json()) as { pool: PoolWithSeason };
    setPoolState((prev) => [data.pool, ...prev]);
    setMessage("Pool created.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-slate-100">Create season</CardTitle>
          <CardDescription className="text-slate-300">
            Define the season window before pool setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSeasonSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Season label</Label>
              <Input id="label" name="label" placeholder="2026-2027" required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="datetime-local" defaultValue={nowIsoMinute} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="datetime-local" required />
            </div>
            <Button type="submit" disabled={seasonLoading} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              {seasonLoading ? "Creating season..." : "Create season"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-slate-100">Create pool</CardTitle>
          <CardDescription className="text-slate-300">
            One pool per season in MVP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handlePoolSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pool name</Label>
              <Input id="name" name="name" placeholder="Main Office Pool" required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seasonId">Season</Label>
              <select
                id="seasonId"
                name="seasonId"
                className="h-8 w-full rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100"
                required
              >
                <option value="">Select a season</option>
                {availableSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="boxCount">Box count</Label>
              <Input id="boxCount" name="boxCount" type="number" defaultValue={10} min={1} max={200} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entrantLimit">Entrant limit (optional)</Label>
              <Input id="entrantLimit" name="entrantLimit" type="number" min={1} max={500} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockAt">Lock at (optional)</Label>
              <Input id="lockAt" name="lockAt" type="datetime-local" />
            </div>
            <Button type="submit" disabled={poolLoading || availableSeasons.length === 0} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              {poolLoading ? "Creating pool..." : "Create pool"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-cyan-300/20 bg-slate-900/85 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-slate-100">Current setup</CardTitle>
          <CardDescription className="text-slate-300">
            Seasons and pools currently configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200">
          {poolState.length === 0 && <p>No pools yet.</p>}
          {poolState.map((pool) => (
            <div key={pool.id} className="rounded-md border border-slate-700/70 bg-slate-950/50 p-3">
              <p className="font-semibold text-slate-100">{pool.name}</p>
              <p>Season: {pool.season.label}</p>
              <p>Boxes: {pool.boxCount}</p>
              <p>Status: {pool.isLocked ? "Locked" : "Open"}</p>
            </div>
          ))}
          {message && <p className="text-cyan-100">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
