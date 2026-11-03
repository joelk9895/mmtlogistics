'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState, useEffect, useRef, useCallback } from 'react';

const navItems = [
  { name: 'Overview', href: '/admin', icon: '⌘', shortcutKey: 'H' },
  { name: 'Orders', href: '/admin/orders', icon: '▦', accent: true, shortcutKey: 'O' },
  { name: 'Customers', href: '/admin/customers', icon: '◎', shortcutKey: 'C' },
  { name: 'Drivers', href: '/admin/drivers', icon: '◉', shortcutKey: 'D' },
  { name: 'Vehicles', href: '/admin/vehicles', icon: '▣', shortcutKey: 'V' },
  { name: 'Vehicle Types', href: '/admin/vehicles/types', icon: '⬡' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙', shortcutKey: 'S' },
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
  const [activeIndex, setActiveIndex] = useState(0);
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Ctrl/Cmd + K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
        setCommandSearch('');
        setActiveIndex(0);
        return;
      }
      if (e.key === 'Escape' && commandOpen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setCommandOpen(false);
        return;
      }
      // Ctrl/Cmd + N for new order (the most common action)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        router.push('/admin/orders?create=1');
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [router, commandOpen]);

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

  // Build a flat list of all selectable items for arrow-key navigation
  const allItems: { type: 'action' | 'nav'; index: number; item: any }[] = [];
  filteredActions.forEach((a, i) => allItems.push({ type: 'action', index: i, item: a }));
  filteredNav.forEach((n, i) => allItems.push({ type: 'nav', index: i, item: n }));

  // Reset activeIndex when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [commandSearch]);

  const executeItem = useCallback((idx: number) => {
    const entry = allItems[idx];
    if (!entry) return;
    if (entry.type === 'action') {
      router.push(`${entry.item.href}?${entry.item.param}=1`);
    } else {
      router.push(entry.item.href);
    }
    setCommandOpen(false);
    setCommandSearch('');
  }, [allItems, router]);

  const handleCommandKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setCommandOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeItem(activeIndex);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else {
        setActiveIndex(prev => Math.min(prev + 1, allItems.length - 1));
      }
    }
  }, [activeIndex, allItems.length, executeItem]);

  let itemCounter = 0;

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
            <kbd className="kbd-hint">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5" role="navigation" aria-label="Main navigation">
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
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`text-xs ${isActive && item.accent ? 'opacity-100' : 'opacity-60'}`}>{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.shortcutKey && (
                  <span className="text-[9px] font-mono text-[var(--muted)]/40 opacity-0 group-hover:opacity-100 transition-opacity" title={`G then ${item.shortcutKey}`}>
                    G{item.shortcutKey}
                  </span>
                )}
                {item.accent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60" />
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

          {/* Keyboard help */}
          <button
            onClick={() => {
              // Dispatch a ? key event so the KeyboardProvider shows help
              window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors duration-150"
          >
            <span className="text-xs opacity-60">⌨</span>
            <span className="flex-1 text-left">Shortcuts</span>
            <kbd className="kbd-hint">?</kbd>
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" role="dialog" aria-label="Command palette" aria-modal="true">
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
                onKeyDown={handleCommandKeyDown}
                aria-label="Search commands"
                aria-activedescendant={allItems[activeIndex] ? `cmd-item-${activeIndex}` : undefined}
                role="combobox"
                aria-expanded="true"
                aria-haspopup="listbox"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="kbd-hint">↑↓</kbd>
                <kbd className="kbd-hint">↵</kbd>
                <kbd className="kbd-hint">ESC</kbd>
              </div>
            </div>

            {/* Results list */}
            <div role="listbox" aria-label="Command results" className="max-h-80 overflow-y-auto">
              {/* Quick Actions */}
              {filteredActions.length > 0 && (
                <div className="px-2 py-2">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Quick Actions</div>
                  {filteredActions.map((action, i) => {
                    const globalIdx = itemCounter++;
                    const isActive = globalIdx === activeIndex;
                    return (
                      <button
                        key={action.label}
                        id={`cmd-item-${globalIdx}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => executeItem(globalIdx)}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                          isActive ? 'bg-[var(--accent)]/10 text-[var(--foreground)]' : 'hover:bg-[var(--surface)]'
                        }`}
                      >
                        <span className={`text-xs ${isActive ? 'opacity-100' : 'opacity-60'}`}>{action.icon}</span>
                        <span className="flex-1 text-left font-medium">{action.label}</span>
                        <kbd className={`kbd-hint ${isActive ? 'border-[var(--accent)]/30 text-[var(--accent)]' : ''}`}>
                          ⌘{action.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigate */}
              {filteredNav.length > 0 && (
                <div className="px-2 py-2 border-t border-[var(--border)]">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Navigate</div>
                  {filteredNav.map((item, i) => {
                    const globalIdx = itemCounter++;
                    const isActive = globalIdx === activeIndex;
                    return (
                      <button
                        key={item.name}
                        id={`cmd-item-${globalIdx}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => executeItem(globalIdx)}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-[var(--accent)]/10 text-[var(--foreground)]' : 'hover:bg-[var(--surface)]'
                        }`}
                      >
                        <span className={`text-xs ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.icon}</span>
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.shortcutKey && (
                          <span className={`text-[10px] font-mono ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>G{item.shortcutKey}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredActions.length === 0 && filteredNav.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No results found</div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface)]/30 flex items-center justify-between">
              <span className="text-[10px] text-[var(--muted)]">{allItems.length} result{allItems.length !== 1 ? 's' : ''}</span>
              <span className="text-[10px] text-[var(--muted)]">
                <kbd className="kbd-hint mr-1">Tab</kbd> to navigate · <kbd className="kbd-hint mx-1">↵</kbd> to select
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
