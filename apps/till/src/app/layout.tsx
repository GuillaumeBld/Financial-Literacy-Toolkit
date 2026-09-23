import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Till — encaissez l'argent qu'on vous doit déjà",
  description:
    "Une caisse pour indépendants. Jev décide quelle facture relancer et quel reçu classer. 19 € par mois.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        <div className="wrap">
          <header className="top">
            <a className="brand" href="/">
              <strong>Till</strong>
              <span>Caisse</span>
            </a>
            <nav className="nav">
              <a href="/desk">Bureau</a>
              <a href="/#pricing">Tarif</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
