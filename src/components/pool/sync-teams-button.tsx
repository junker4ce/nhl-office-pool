"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SyncTeamsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/sync", {
      method: "POST",
    });

    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; log?: { recordsUpserted?: number } }
      | { error?: string }
      | null;

    if (!response.ok) {
      setMessage(data && "error" in data && data.error ? data.error : "Sync failed.");
      setIsLoading(false);
      return;
    }

    const upserted = data && "log" in data ? data.log?.recordsUpserted ?? 0 : 0;
    setMessage(`Team sync completed. Upserted ${upserted} teams.`);
    setIsLoading(false);
  }

  return (
    <div className="space-y-2">
      <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={handleSync} disabled={isLoading}>
        {isLoading ? "Syncing teams..." : "Sync NHL teams"}
      </Button>
      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  );
}
