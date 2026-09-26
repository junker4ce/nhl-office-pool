import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TeamProfileForm } from "@/components/dashboard/team-profile-form";

type PoolSummary = {
  id: string;
  name: string;
  seasonLabel: string;
  joined: boolean;
  locked: boolean;
  boxCount: number;
};

type Props = {
  displayName: string;
  role: string;
  teamName: string | null;
  teamLogoData: string | null;
  pools: PoolSummary[];
};

export function DashboardOverview({ displayName, role, teamName, teamLogoData, pools }: Props) {
  const currentPool = pools[0] ?? null;
  const joined = currentPool ? currentPool.joined : false;
  const open = currentPool ? !currentPool.locked : false;

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

      <TeamProfileForm initialTeamName={teamName} initialTeamLogoData={teamLogoData} />

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
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3"
            >
              <div>
                <p className="font-semibold text-foreground">{pool.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pool.seasonLabel} • {pool.boxCount} boxes
                </p>
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
                  Open
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
