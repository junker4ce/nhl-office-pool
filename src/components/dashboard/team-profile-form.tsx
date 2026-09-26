"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  initialTeamName: string | null;
  initialTeamLogoData: string | null;
};

export function TeamProfileForm({ initialTeamName, initialTeamLogoData }: Props) {
  const [teamName, setTeamName] = useState(initialTeamName ?? "");
  const [logoData, setLogoData] = useState(initialTeamLogoData ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onLogoChange(file: File | undefined) {
    setError(null);
    setSaved(false);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("Choose a PNG, JPG, WEBP, or GIF image.");
      return;
    }

    if (file.size > 512 * 1024) {
      setError("Logo must be smaller than 512 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogoData(String(reader.result));
    reader.onerror = () => setError("Unable to read logo.");
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);

    const response = await fetch("/api/profile/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName, teamLogoData: logoData || null }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to save team profile.");
      return;
    }

    setSaved(true);
  }

  return (
    <Card className="border-brand/20 bg-card">
      <CardHeader>
        <CardTitle>Your team identity</CardTitle>
        <CardDescription>
          Set the name and logo your office pool teammates will recognize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-team-name">Team name</Label>
              <Input
                id="dashboard-team-name"
                value={teamName}
                onChange={(event) => {
                  setTeamName(event.target.value);
                  setSaved(false);
                }}
                minLength={2}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-team-logo">Team logo</Label>
              <Input
                id="dashboard-team-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => void onLogoChange(event.target.files?.[0])}
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF up to 512 KB.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save team"}
              </Button>
              {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Team profile saved.</span>}
              {error && <span className="text-sm text-destructive">{error}</span>}
            </div>
          </div>
          <div className="size-32 overflow-hidden rounded-full border border-brand/20 bg-muted/50 p-3">
            {logoData ? (
              <img src={logoData} alt="Team logo preview" className="size-full rounded-full object-contain" />
            ) : (
              <span className="flex size-full items-center justify-center text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">No logo</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}