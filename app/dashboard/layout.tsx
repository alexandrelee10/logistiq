import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import DashboardShell from "@/app/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard - Logistiq",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionUserId) {
    redirect("/sign-in");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
