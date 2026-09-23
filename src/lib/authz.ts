import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function requireUserSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return session;
}
