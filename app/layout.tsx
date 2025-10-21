import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { authOptions } from "@/auth.config";
import SessionProvider from "@/providers/session-provider";
import SiteHeader from "@/components/navigation/site-header";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Literacy Toolkit",
  description: "Adaptive assessments and coaching for financial literacy."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900`}>
        <SessionProvider session={session}>
          <SiteHeader />
          <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl px-4 py-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
