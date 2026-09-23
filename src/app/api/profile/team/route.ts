import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserSession } from "@/lib/authz";
import { db } from "@/lib/db";

const teamSchema = z.object({
  teamName: z.string().trim().min(2).max(80),
  teamLogoData: z
    .string()
    .refine((value) => /^data:image\/(png|jpeg|webp|gif);base64,/.test(value), "Logo must be a supported image.")
    .refine((value) => value.length <= 700_000, "Logo must be smaller than 512 KB.")
    .nullable()
    .optional(),
});

export async function PUT(request: Request) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = teamSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a team name and choose a supported logo image." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      teamName: parsed.data.teamName,
      ...(parsed.data.teamLogoData !== undefined ? { teamLogoData: parsed.data.teamLogoData } : {}),
    },
    select: {
      teamName: true,
      teamLogoData: true,
    },
  });

  return NextResponse.json({ user });
}