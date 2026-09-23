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
      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <CardTitle className="font-heading text-4xl uppercase text-cyan-100">
            My Dashboard
          </CardTitle>
          <CardDescription className="text-slate-300">
            Welcome back, {displayName}. You are signed in as {role.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-cyan-300/20 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Pool status
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {currentPool ? (joined ? "Joined" : "Not joined") : "Not set"}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Pool access
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {currentPool ? (open ? "Open" : "Locked") : "Unavailable"}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Next action
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Open the office pool and submit your picks before lock.
            </p>
          </div>
        </CardContent>
      </Card>

      <TeamProfileForm initialTeamName={teamName} initialTeamLogoData={teamLogoData} />

      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-slate-100">Your office pool activity</CardTitle>
          <CardDescription className="text-slate-300">
            A quick snapshot of the office pool you can view and manage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pools.length === 0 && (
            <p className="text-sm text-slate-300">
              You have not joined the office pool yet.
            </p>
          )}
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3"
            >
              <div>
                <p className="font-semibold text-slate-100">{pool.name}</p>
                <p className="text-sm text-slate-300">
                  {pool.seasonLabel} • {pool.boxCount} boxes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    pool.locked
                      ? "bg-rose-500/20 text-rose-100"
                      : "bg-cyan-500/20 text-cyan-100"
                  }
                >
                  {pool.locked ? "Locked" : "Open"}
                </Badge>
                <Link
                  href={`/pools/${pool.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10"
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
