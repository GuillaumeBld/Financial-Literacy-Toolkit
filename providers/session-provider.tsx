"use client";

import type { Session } from "next-auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode;
  session: Session | null;
};

export default function SessionProvider({ children, session }: Props) {
  useEffect(() => {
    if (session?.accessToken) {
      window.sessionStorage.setItem("finlit:last-auth-refresh", new Date().toISOString());
    } else {
      window.sessionStorage.removeItem("finlit:last-auth-refresh");
    }
  }, [session?.accessToken]);

  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
