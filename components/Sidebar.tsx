'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

const navItems = [
  { name: 'Overview', href: '/admin', icon: '⌘' },
  { name: 'Drivers', href: '/admin/drivers', icon: '◉' },
  { name: 'Vehicles', href: '/admin/vehicles', icon: '▣' },
  { name: 'Customers', href: '/admin/customers', icon: '◎' },
  { name: 'Orders', href: '/admin/orders', icon: '▦' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="w-56 border-r border-[var(--border)] flex flex-col bg-[var(--card)] shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[var(--accent)] rounded-md flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            MMT Logistics
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[var(--surface)] text-[var(--foreground)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
              }`}
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[var(--border)] space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors duration-150"
        >
          <span className="text-xs opacity-60">{theme === 'dark' ? '☀' : '☽'}</span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 px-3 py-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--muted)] font-medium">
              A
            </div>
            <span className="text-xs text-[var(--muted)]">Admin</span>
          </div>
          <button 
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="text-[10px] uppercase font-bold text-[var(--muted)] hover:text-[var(--destructive)] transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
