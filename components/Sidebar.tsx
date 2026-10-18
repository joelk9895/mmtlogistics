'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState, useEffect, useRef } from 'react';

const navItems = [
  { name: 'Overview', href: '/admin', icon: '⌘' },
  { name: 'Orders', href: '/admin/orders', icon: '▦', accent: true },
  { name: 'Customers', href: '/admin/customers', icon: '◎' },
  { name: 'Drivers', href: '/admin/drivers', icon: '◉' },
  { name: 'Vehicles', href: '/admin/vehicles', icon: '▣' },
  { name: 'Vehicle Types', href: '/admin/vehicles/types', icon: '⬡' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙' },
];

const quickActions = [
  { label: 'New Order', href: '/admin/orders', param: 'create', shortcut: 'O', icon: '▦' },
  { label: 'New Customer', href: '/admin/customers', param: 'create', shortcut: 'C', icon: '◎' },
  { label: 'New Driver', href: '/admin/drivers', param: 'create', shortcut: 'D', icon: '◉' },
  { label: 'New Vehicle', href: '/admin/vehicles', param: 'create', shortcut: 'V', icon: '▣' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Ctrl/Cmd + K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
        setCommandSearch('');
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
      }
      // Ctrl/Cmd + N for new order (the most common action)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        router.push('/admin/orders?create=1');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (commandOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandOpen]);

  // Close command palette on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        setCommandOpen(false);
      }
    };
    if (commandOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [commandOpen]);

  const filteredActions = quickActions.filter(a =>
    a.label.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredNav = navItems.filter(n =>
    n.name.toLowerCase().includes(commandSearch.toLowerCase())
  );

  return (
    <>
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

        {/* Quick Create */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all duration-200 group"
          >
            <span className="text-base leading-none group-hover:text-[var(--accent)] transition-colors">+</span>
            <span className="flex-1 text-left">Quick create</span>
            <kbd className="text-[9px] bg-[var(--surface)] px-1.5 py-0.5 rounded font-mono text-[var(--muted)]">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
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
                <span className={`text-xs ${isActive && item.accent ? 'opacity-100' : 'opacity-60'}`}>{item.icon}</span>
                {item.name}
                {item.accent && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60" />
                )}
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

      {/* Command Palette Modal */}
      {commandOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setCommandOpen(false)} />
          <div
            ref={commandRef}
            className="relative w-full max-w-lg bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-scale-in"
          >
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search actions, pages…"
                className="flex-1 bg-transparent outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredActions.length > 0) {
                    router.push(`${filteredActions[0].href}?${filteredActions[0].param}=1`);
                    setCommandOpen(false);
                  }
                }}
              />
              <kbd className="text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded font-mono text-[var(--muted)]">ESC</kbd>
            </div>

            {/* Quick Actions */}
            {filteredActions.length > 0 && (
              <div className="px-2 py-2">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Quick Actions</div>
                {filteredActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      router.push(`${action.href}?${action.param}=1`);
                      setCommandOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--surface)] text-sm transition-colors group"
                  >
                    <span className="text-xs opacity-60">{action.icon}</span>
                    <span className="flex-1 text-left font-medium">{action.label}</span>
                    <kbd className="text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded font-mono text-[var(--muted)] group-hover:text-[var(--foreground)]">
                      ⌘{action.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            )}

            {/* Navigate */}
            {filteredNav.length > 0 && (
              <div className="px-2 py-2 border-t border-[var(--border)]">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Navigate</div>
                {filteredNav.map(item => (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setCommandOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface)] text-sm transition-colors"
                  >
                    <span className="text-xs opacity-60">{item.icon}</span>
                    <span className="flex-1 text-left">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredActions.length === 0 && filteredNav.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No results found</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
