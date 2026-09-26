"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SyncStatsResponse = {
  ok?: boolean;
  error?: string;
  log?: {
    recordsUpserted?: number;
    errorMessage?: string | null;
  };
  summary?: {
    date?: string;
    gamesProcessed?: number;
    entrantsProcessed?: number;
    totalPointsAwarded?: number;
  };
};

export function SyncStatsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [date, setDate] = useState("");

  async function handleSync() {
    setIsLoading(true);
    setMessage(null);

    const url = date ? `/api/admin/sync/stats?date=${date}` : "/api/admin/sync/stats";
    const response = await fetch(url, {
      method: "POST",
    });

    const data = (await response.json().catch(() => null)) as SyncStatsResponse | null;

    if (!response.ok) {
      const failureMessage =
        data?.error ?? data?.log?.errorMessage ?? "Daily stat sync failed.";

      setMessage(failureMessage);
      setIsLoading(false);
      return;
    }

    const upserted = data?.log?.recordsUpserted ?? 0;
    const summary = data?.summary;

    setMessage(
      `Stat sync completed for ${summary?.date ?? "yesterday"}. Upserted ${upserted} stat lines from ${summary?.gamesProcessed ?? 0} games; recalculated points for ${summary?.entrantsProcessed ?? 0} entrants.`,
    );
    setIsLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
        <Button
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={handleSync}
          disabled={isLoading}
        >
          {isLoading ? "Syncing stats..." : "Sync daily stats"}
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
