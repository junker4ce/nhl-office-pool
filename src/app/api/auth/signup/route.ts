import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(80),
  teamName: z.string().trim().min(2).max(80),
  teamLogoData: z
    .string()
    .refine((value) => /^data:image\/(png|jpeg|webp|gif);base64,/.test(value), "Logo must be a supported image.")
    .refine((value) => value.length <= 700_000, "Logo must be smaller than 512 KB.")
    .optional()
    .or(z.literal("")),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup payload." }, { status: 400 });
  }

  try {
    const normalizedEmail = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const userCount = await db.user.count();

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: parsed.data.displayName.trim(),
        teamName: parsed.data.teamName,
        teamLogoData: parsed.data.teamLogoData || null,
        role: userCount === 0 ? UserRole.ADMIN : UserRole.ENTRANT,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json(
      {
        error:
          "Database unavailable. Start PostgreSQL and verify DATABASE_URL before creating an account.",
      },
      { status: 503 },
    );
  }
}
