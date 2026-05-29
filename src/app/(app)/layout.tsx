import Link from 'next/link';
import { logout } from '@/app/login/actions';

const navItems = [
  { href: '/home', label: 'Início', icon: HomeIcon },
  { href: '/lancamentos', label: 'Lançamentos', icon: ListIcon },
  { href: '/fixas', label: 'Fixas', icon: RepeatIcon },
  { href: '/parceladas', label: 'Parceladas', icon: CreditCardIcon },
  { href: '/resumo', label: 'Resumo', icon: ChartIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto w-full">
          <span className="text-white font-semibold text-lg">Finanças</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-10 bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="flex max-w-2xl mx-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} />
          ))}
        </div>
      </nav>
    </div>
  );
}

// Split into a client component for active state detection
import { NavItem } from '@/components/NavItem';

/* ─── Inline SVG icons ─────────────────────────────────────────────────── */

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
      <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
      <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
      <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" strokeWidth={2.5} />
      <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth={2.5} />
      <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth={2.5} />
    </svg>
  );
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="17 1 21 5 17 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="7 23 3 19 7 15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeLinecap="round" />
      <line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
    </svg>
  );
}
