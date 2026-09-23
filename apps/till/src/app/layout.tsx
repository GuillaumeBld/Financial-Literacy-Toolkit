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
  title: "Till — chase the cash you are already owed",
  description:
    "A cash desk for freelancers. Jev scores which invoice to chase and which receipt to file. $19 a month.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        <div className="wrap">
          <header className="top">
            <a className="brand" href="/">
              <strong>Till</strong>
              <span>Cash desk</span>
            </a>
            <nav className="nav">
              <a href="/desk">Desk</a>
              <a href="/#pricing">Pricing</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
