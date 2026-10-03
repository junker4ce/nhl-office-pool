import Link from "next/link";
import { PickCounts } from "@/components/pool/pick-counts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PoolPickCounts } from "@/lib/pick-counts";
import { cn } from "@/lib/utils";

export type DashboardView = "standings" | "pick-counts";

const VIEWS: Array<{ key: DashboardView; label: string; description: string }> = [
  { key: "standings", label: "Standings", description: "Every team, ranked by points" },
  { key: "pick-counts", label: "Pick counts", description: "How often each player was picked" },
];

type PoolSummary = {
  id: string;
  name: string;
  seasonLabel: string;
  joined: boolean;
  locked: boolean;
  boxCount: number;
  picksMade: number;
};

type EntrantTeam = {
  id: string;
  teamName: string;
  ownerName: string;
  teamLogoData: string | null;
  joinedLabel: string;
  picksMade: number;
  boxCount: number;
  points: number;
};

type Props = {
  displayName: string;
  role: string;
  pools: PoolSummary[];
  entrantTeams: EntrantTeam[];
  view: DashboardView;
  pickCounts: PoolPickCounts | null;
};

export function DashboardOverview({
  displayName,
  role,
  pools,
  entrantTeams,
  view,
  pickCounts,
}: Props) {
  const currentPool = pools[0] ?? null;
  const joined = currentPool ? currentPool.joined : false;
  const open = currentPool ? !currentPool.locked : false;
  const locked = currentPool ? currentPool.locked : false;

  return (
    <div className="space-y-5">
      <Card className="border-brand/20 bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-4xl uppercase text-brand">
            My Dashboard
          </CardTitle>
          <CardDescription>
            Welcome back, {displayName}. You are signed in as {role.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-brand/20 bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-brand/70">
              Pool status
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {currentPool ? (joined ? "Joined" : "Not joined") : "Not set"}
            </p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-brand/70">
              Pool access
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {currentPool ? (open ? "Open" : "Locked") : "Unavailable"}
            </p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-brand/70">
              Next action
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Open the office pool and submit your picks before lock.
            </p>
          </div>
        </CardContent>
      </Card>

      {locked ? (
        <nav aria-label="Dashboard views" className="grid gap-3 sm:grid-cols-2">
          {VIEWS.map((option) => {
            const active = option.key === view;
            return (
              <Link
                key={option.key}
                href={option.key === "standings" ? "/" : `/?view=${option.key}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  active
                    ? "border-brand bg-brand/15"
                    : "border-border bg-card hover:border-brand/40 hover:bg-muted/50"
                )}
              >
                <p className={cn("font-semibold", active ? "text-brand" : "text-foreground")}>
                  {option.label}
                </p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </Link>
            );
          })}
        </nav>
      ) : (
        <Card className="border-brand/20 bg-card">
          <CardHeader>
            <CardTitle>Your office pool activity</CardTitle>
            <CardDescription>
              A quick snapshot of the office pool you can view and manage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pools.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You have not joined the office pool yet.
              </p>
            )}
            {pools.map((pool) => {
              const missingPicks =
                pool.joined && !pool.locked ? Math.max(pool.boxCount - pool.picksMade, 0) : 0;
              return (
                <div
                  key={pool.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3",
                    missingPicks > 0 ? "border-amber-500/60" : "border-border"
                  )}
                >
                  <div>
                    <p className="font-semibold text-foreground">{pool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pool.seasonLabel} • {pool.boxCount} boxes
                    </p>
                    {missingPicks > 0 && (
                      <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                        {missingPicks === 1
                          ? "1 box needs a pick."
                          : `${missingPicks} boxes need a pick.`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        pool.locked
                          ? "bg-destructive/15 text-destructive"
                          : "bg-brand/15 text-brand"
                      }
                    >
                      {pool.locked ? "Locked" : "Open"}
                    </Badge>
                    <Link
                      href={`/pools/${pool.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "border-brand/40 text-brand hover:bg-brand/10"
                      )}
                    >
                      {missingPicks > 0 ? "Finish picks" : "Open"}
                    </Link>
                  </div>
                </div>
                );
            })}
          </CardContent>
        </Card>
      )}

      {view === "pick-counts" && pickCounts ? (
        <PickCounts data={pickCounts} showPickers={false} />
      ) : (
        <Card className="border-brand/20 bg-card">
          <CardHeader>
            <CardTitle>Teams in the pool</CardTitle>
            <CardDescription>
              {open
                ? "Everyone who has joined the office pool so far."
                : "Current standings, ranked by total points."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {entrantTeams.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No one has joined the office pool yet.
              </p>
            )}
            {entrantTeams.map((entrant, index) => {
              const picksComplete = entrant.picksMade >= entrant.boxCount;
              // Tied teams share the rank of the first team with that score.
              const rank =
                entrantTeams.findIndex((other) => other.points === entrant.points) + 1;
              const tied = entrantTeams.some(
                (other, otherIndex) => otherIndex !== index && other.points === entrant.points
              );
              return (
                <div
                  key={entrant.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    {!open && (
                      <span className="w-8 shrink-0 text-center font-heading text-xl text-brand">
                        {tied ? `T${rank}` : rank}
                      </span>
                    )}
                    <div className="size-10 shrink-0 overflow-hidden rounded-full border border-brand/20 bg-muted/50">
                      {entrant.teamLogoData ? (
                        <img
                          src={entrant.teamLogoData}
                          alt={`${entrant.teamName} logo`}
                          className="size-full object-contain"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{entrant.teamName}</p>
                      <p className="text-sm text-muted-foreground">
                        {entrant.ownerName} • Joined {entrant.joinedLabel}
                      </p>
                    </div>
                  </div>
                  {open ? (
                    <Badge
                      className={
                        picksComplete
                          ? "bg-brand/15 text-brand"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {entrant.picksMade}/{entrant.boxCount} picks
                    </Badge>
                  ) : (
                    <div className="text-right">
                      <p className="text-2xl font-semibold leading-none text-foreground">
                        {entrant.points}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {entrant.points === 1 ? "point" : "points"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
