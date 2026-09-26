import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PoolBoxSetup } from "@/components/admin/pool-box-setup";
import { SyncPlayersButton } from "@/components/pool/sync-players-button";
import { SyncStatsButton } from "@/components/pool/sync-stats-button";
import { SyncTeamsButton } from "@/components/pool/sync-teams-button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const pools = await db.pool.findMany({
    include: {
      season: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-brand/20 bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-4xl uppercase text-brand">
            Admin Panel
          </CardTitle>
          <CardDescription>
            First implementation slice for operations and season controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground">
          <p>- Account creation and login are active</p>
          <p>- Role-protected admin routes are active</p>
          <p>- NHL team and player sync endpoints are ready</p>
          <p>- Daily stat sync and score ledger calculation are active</p>
          <SyncTeamsButton />
          <SyncPlayersButton />
          <SyncStatsButton />
        </CardContent>
      </Card>
      <PoolBoxSetup pools={pools} />
    </div>
  );
}
