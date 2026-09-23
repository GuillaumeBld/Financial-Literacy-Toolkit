"use client";

import { usePathname } from "next/navigation";

export function SiteNav() {
  const path = usePathname();
  const onDesk = path.startsWith("/desk");
  return (
    <nav className="nav" aria-label="Principal">
      <a href="/desk" aria-current={onDesk ? "page" : undefined}>
        Bureau
      </a>
      <a href="/#pricing">Tarif</a>
    </nav>
  );
}
