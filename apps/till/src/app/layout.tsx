import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const sans = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Till — encaissez l'argent qu'on vous doit déjà",
  description:
    "Une caisse pour indépendants. Jev décide quelle facture relancer et quel reçu classer. 19 € par mois.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={sans.variable}>
        <a className="skip" href="#contenu">
          Aller au contenu
        </a>
        <div className="wrap">
          <header className="top">
            <a className="brand" href="/">
              <strong>Till</strong>
              <span>Caisse</span>
            </a>
            <SiteNav />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
