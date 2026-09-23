import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

const createPlayerSchema = z.object({
  nhlId: z.number().int().positive(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  position: z.string().min(1).max(10),
  teamId: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const poolId = searchParams.get("poolId")?.trim() ?? "";
  const terms = query.split(/\s+/).filter(Boolean);
  const nhlIdQuery = Number.parseInt(query, 10);
  const hasNhlIdQuery = Number.isInteger(nhlIdQuery) && String(nhlIdQuery) === query;

  const usedPlayerIds = poolId
    ? (
        await db.poolBoxPlayerOption
          .findMany({
            where: { poolId },
            select: { playerId: true },
          })
      ).map((row) => row.playerId)
    : [];

  const players = await db.player.findMany({
    where: {
      ...(terms.length > 0
        ? {
            OR: [
              {
                AND: terms.map((term) => ({
                  OR: [
                    { firstName: { contains: term, mode: "insensitive" } },
                    { lastName: { contains: term, mode: "insensitive" } },
                  ],
                })),
              },
              ...(hasNhlIdQuery ? [{ nhlId: nhlIdQuery }] : []),
            ],
          }
        : {}),
      ...(usedPlayerIds.length > 0 ? { id: { notIn: usedPlayerIds } } : {}),
    },
    include: {
      team: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 25,
  });

  return NextResponse.json({ players });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPlayerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const player = await db.player.upsert({
    where: { nhlId: parsed.data.nhlId },
    create: {
      nhlId: parsed.data.nhlId,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      position: parsed.data.position.trim().toUpperCase(),
      teamId: parsed.data.teamId ?? null,
      active: true,
    },
    update: {
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      position: parsed.data.position.trim().toUpperCase(),
      teamId: parsed.data.teamId ?? null,
      active: true,
    },
    include: {
      team: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "player.upsert",
      entityType: "player",
      entityId: player.id,
      metadata: {
        nhlId: player.nhlId,
      },
    },
  });

  return NextResponse.json({ player }, { status: 201 });
}
