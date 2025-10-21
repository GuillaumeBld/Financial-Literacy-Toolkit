import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authOptions } from "@/auth.config";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/start");
  }

  return <>{children}</>;
}
