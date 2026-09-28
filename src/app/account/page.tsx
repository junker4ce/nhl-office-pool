import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TeamProfileForm } from "@/components/account/team-profile-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/account");
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { teamName: true, teamLogoData: true },
  });

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 px-6 py-10 md:px-10">
      <Card className="border-brand/20 bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-4xl uppercase text-brand">
            My Account
          </CardTitle>
          <CardDescription>Manage how you appear in the office pool.</CardDescription>
        </CardHeader>
      </Card>

      <TeamProfileForm initialTeamName={user.teamName} initialTeamLogoData={user.teamLogoData} />
    </section>
  );
}
