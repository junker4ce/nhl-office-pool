import { SeasonStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

const createSeasonSchema = z
  .object({
    label: z.string().min(3).max(80),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    status: z.enum(["DRAFT", "OPEN", "LOCKED", "COMPLETED"]).optional(),
  })
  .refine((value) => new Date(value.endDate) > new Date(value.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seasons = await db.season.findMany({
    orderBy: {
      startDate: "desc",
    },
    include: {
      pools: {
        select: {
          id: true,
          name: true,
          isLocked: true,
          boxCount: true,
        },
      },
    },
  });

  return NextResponse.json({ seasons });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createSeasonSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const season = await db.season.create({
    data: {
      label: parsed.data.label.trim(),
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      status: (parsed.data.status as SeasonStatus | undefined) ?? SeasonStatus.DRAFT,
    },
  });

  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "season.create",
      entityType: "season",
      entityId: season.id,
      metadata: {
        label: season.label,
      },
    },
  });

  return NextResponse.json({ season }, { status: 201 });
}
