import { redirect } from "next/navigation";

// The dashboard now lives at the site root; keep old links and bookmarks working.
export default function DashboardPage() {
  redirect("/");
}
