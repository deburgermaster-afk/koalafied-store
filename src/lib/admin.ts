import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions);
  if (!session.isAdmin) redirect("/admin/login");
  return session;
}
