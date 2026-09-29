import Link from "next/link";
import { notFound } from "next/navigation";
import { PickCounts } from "@/components/pool/pick-counts";
import { db } from "@/lib/db";
import { getPoolPickCounts } from "@/lib/pick-counts";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ poolId?: string }>;
};

export default async function AdminPickCountsPage({ searchParams }: Props) {
  const { poolId } = await searchParams;

  const pools = await db.pool.findMany({
    include: { season: true },
    orderBy: { createdAt: "desc" },
  });

  if (pools.length === 0) {
    return <p className="text-sm text-muted-foreground">No pools yet.</p>;
  }

  const selectedPoolId = poolId ?? pools[0].id;
  const data = await getPoolPickCounts(selectedPoolId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-5">
      {pools.length > 1 && (
        <nav className="flex flex-wrap gap-2 text-sm">
          {pools.map((pool) => (
            <Link
              key={pool.id}
              href={`/admin/pick-counts?poolId=${pool.id}`}
              className={`rounded-md border px-3 py-1.5 ${
                pool.id === selectedPoolId
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-border hover:bg-muted"
              }`}
            >
              {pool.name} ({pool.season.label})
            </Link>
          ))}
        </nav>
      )}
      <PickCounts data={data} />
    </div>
  );
}
