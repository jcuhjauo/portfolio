'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 想加新頁面,在這裡加一筆就會出現在選單裡。
const LINKS = [
  { href: '/', label: '首頁' },
  { href: '/#work', label: '專案' },
  { href: '/gallery', label: '攝影展間' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <nav className="nav-inner" aria-label="主選單">
        <Link href="/" className="nav-logo">
          趙誼臻
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => {
            const active = l.href === pathname;
            return (
              <Link key={l.href} href={l.href} className="nav-link" aria-current={active ? 'page' : undefined}>
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
