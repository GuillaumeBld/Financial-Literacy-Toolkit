import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Literacy Assessment Toolkit",
  description:
    "Loyola University Chicago's AI-assisted assessment platform for finance literacy cohorts."
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-neutral/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
                  Quinlan School of Business
                </p>
                <p className="text-2xl font-bold text-primary">
                  Financial Literacy Assessment Toolkit
                </p>
              </div>
              <nav className="hidden gap-6 text-sm font-medium text-neutral/70 md:flex">
                <a href="#overview">Overview</a>
                <a href="#features">Features</a>
                <a href="#workflow">Workflow</a>
                <a href="#next-steps">Next steps</a>
              </nav>
            </div>
          </header>
          <main className="flex-1 bg-neutral/5">{children}</main>
          <footer className="bg-neutral/90 text-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm md:flex-row md:items-center md:justify-between">
              <p>&copy; {new Date().getFullYear()} Loyola University Chicago · Quinlan School of Business</p>
              <p className="text-white/70">
                Built for privacy, accessibility, and evidence-based financial literacy gains.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
