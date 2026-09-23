"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SyncPlayersResponse = {
  ok?: boolean;
  error?: string;
  log?: {
    recordsUpserted?: number;
    errorMessage?: string | null;
  };
  summary?: {
    teamsProcessed?: number;
  };
};

export function SyncPlayersButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/sync/players", {
      method: "POST",
    });

    const data = (await response.json().catch(() => null)) as
      | SyncPlayersResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      const failureMessage =
        data && "error" in data && data.error
          ? data.error
          : data && "log" in data && data.log?.errorMessage
            ? data.log.errorMessage
            : "Player sync failed.";

      setMessage(failureMessage);
      setIsLoading(false);
      return;
    }

    const upserted = data && "log" in data ? data.log?.recordsUpserted ?? 0 : 0;
    const teamsProcessed =
      data && "summary" in data ? data.summary?.teamsProcessed ?? 0 : 0;

    setMessage(
      `Player sync completed. Upserted ${upserted} players from ${teamsProcessed} teams.`,
    );
    setIsLoading(false);
  }

  return (
    <div className="space-y-2">
      <Button
        className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        onClick={handleSync}
        disabled={isLoading}
      >
        {isLoading ? "Syncing players..." : "Sync NHL players"}
      </Button>
      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  );
}
