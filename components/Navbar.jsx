'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { BIRDS } from './birds';

const LINKS = [
  { href: '/', label: '首頁' },
  { href: '/projects', label: '專案' },
  { href: '/gallery', label: '攝影展間' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <nav className="nav-inner" aria-label="主選單">
        <Link href="/" className="nav-flock" aria-label="回首頁">
          {BIRDS.map((Bird, i) => (
            <span key={i} className="nav-bird">
              <Bird size={32} />
            </span>
          ))}
       
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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}