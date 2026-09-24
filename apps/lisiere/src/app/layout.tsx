import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lisière — Jev contre la foule",
  description:
    "Le prix Polymarket d'un côté, la distribution Jev de l'autre. Le papier ne s'ouvre que si l'écart passe les seuils.",
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
        <a className="skip" href="#scene">
          Aller à la scène
        </a>
        {children}
      </body>
    </html>
  );
}
