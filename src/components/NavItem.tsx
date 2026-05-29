'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export function NavItem({ href, label, Icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center flex-1 py-2 gap-1 text-xs font-medium transition-colors ${
        isActive
          ? 'text-brand-400'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="leading-none">{label}</span>
    </Link>
  );
}
