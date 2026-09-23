import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PoolPicksForm } from "@/components/pool/pool-picks-form";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ poolId: string }>;
};

function isPoolLocked(pool: { isLocked: boolean; lockAt: Date | null }) {
  if (pool.isLocked) {
    return true;
  }

  if (pool.lockAt && pool.lockAt.getTime() <= Date.now()) {
    return true;
  }

  return false;
}

export default async function PoolDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/pools");
  }

  const { poolId } = await params;

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    include: {
      season: true,
      boxes: {
        orderBy: {
          boxOrder: "asc",
        },
        include: {
          playerOptions: {
            include: {
              player: {
                include: {
                  team: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!pool) {
    notFound();
  }

  const entrant = await db.poolEntrant.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: session.user.id,
      },
    },
    include: {
      picks: true,
    },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <PoolPicksForm pool={pool} entrant={entrant} locked={isPoolLocked(pool)} />
    </section>
  );
}
