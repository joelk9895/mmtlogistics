'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────

type Shortcut = {
  key: string;
  label: string;
  action: () => void;
  section?: string;
  modifier?: 'ctrl' | 'shift' | 'alt' | 'meta';
};

type KeyboardContextType = {
  registerShortcut: (id: string, shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  focusedRowIndex: number;
  setFocusedRowIndex: (index: number) => void;
};

const KeyboardContext = createContext<KeyboardContextType>({
  registerShortcut: () => {},
  unregisterShortcut: () => {},
  showHelp: false,
  setShowHelp: () => {},
  focusedRowIndex: -1,
  setFocusedRowIndex: () => {},
});

export const useKeyboard = () => useContext(KeyboardContext);

// ── Shortcut Help Overlay ──────────────────────────────────

const GLOBAL_SHORTCUTS = [
  { keys: '⌘ K', label: 'Open command palette' },
  { keys: '⌘ N', label: 'Create new order' },
  { keys: '?', label: 'Show this help' },
  { keys: 'Esc', label: 'Close modal / cancel' },
  { keys: '/', label: 'Focus search' },
];

const NAV_SHORTCUTS = [
  { keys: 'G then H', label: 'Go to Overview' },
  { keys: 'G then O', label: 'Go to Orders' },
  { keys: 'G then C', label: 'Go to Customers' },
  { keys: 'G then D', label: 'Go to Drivers' },
  { keys: 'G then V', label: 'Go to Vehicles' },
  { keys: 'G then S', label: 'Go to Settings' },
];

const TABLE_SHORTCUTS = [
  { keys: 'J / ↓', label: 'Next row' },
  { keys: 'K / ↑', label: 'Previous row' },
  { keys: 'Enter', label: 'Open selected item' },
  { keys: 'E', label: 'Edit selected item' },
  { keys: 'N', label: 'Create new item' },
  { keys: 'Tab', label: 'Next field / section' },
];

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onClose]);

  const Section = ({ title, shortcuts }: { title: string; shortcuts: { keys: string; label: string }[] }) => (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">{title}</h3>
      <div className="space-y-2">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-sm text-[var(--foreground)]">{s.label}</span>
            <div className="flex items-center gap-1.5">
              {s.keys.split(' ').map((k, j) => (
                k === 'then' ? (
                  <span key={j} className="text-xs text-[var(--muted)]">then</span>
                ) : (
                  <kbd
                    key={j}
                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono font-medium text-[var(--muted)] shadow-sm"
                  >
                    {k}
                  </kbd>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-label="Keyboard shortcuts">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
              <span className="text-[var(--accent)] text-xs font-bold">⌨</span>
            </div>
            <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button data-action="close" aria-label="Close" onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-lg">×</button>
        </div>
        <div className="grid grid-cols-3 gap-8 p-6">
          <Section title="Global" shortcuts={GLOBAL_SHORTCUTS} />
          <Section title="Navigation" shortcuts={NAV_SHORTCUTS} />
          <Section title="Tables & Lists" shortcuts={TABLE_SHORTCUTS} />
        </div>
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--surface)]/50">
          <p className="text-[11px] text-[var(--muted)] text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono mx-0.5">?</kbd> again or <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono mx-0.5">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────

export default function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const shortcutsRef = useRef<Map<string, Shortcut>>(new Map());
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerShortcut = useCallback((id: string, shortcut: Shortcut) => {
    shortcutsRef.current.set(id, shortcut);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    shortcutsRef.current.delete(id);
  }, []);

  // Reset focused row on page change
  useEffect(() => {
    setFocusedRowIndex(-1);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;

      // Cmd+Enter or Ctrl+Enter submits active form / modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const submitBtn = document.querySelector<HTMLButtonElement>(
          'form button[type="submit"]:not([disabled]), [role="dialog"] button[type="submit"]:not([disabled]), [data-action="submit"]:not([disabled])'
        );
        if (submitBtn) {
          e.preventDefault();
          submitBtn.click();
          return;
        }
      }

      // Always handle Escape
      if (e.key === 'Escape') {
        if (showHelp) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setShowHelp(false);
          return;
        }

        // Check registered escape shortcuts first
        for (const [, shortcut] of shortcutsRef.current) {
          if (shortcut.key.toLowerCase() === 'escape') {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }

        // Check for modal close buttons
        const modalClose = document.querySelector<HTMLButtonElement>(
          '[data-action="close"]:not([disabled]), [data-modal-close]:not([disabled]), [role="dialog"] button[aria-label="Close"]'
        );
        if (modalClose) {
          e.preventDefault();
          modalClose.click();
          return;
        }

        // Blur input if currently focused
        if (isInput) {
          target.blur();
          return;
        }
      }

      // ? for help (only outside inputs)
      if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // / to focus search (outside inputs)
      if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-search-input], input[placeholder*="Search"], input[placeholder*="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // G + key navigation (vim-style) – only outside inputs
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'g' || e.key === 'G') {
          if (!gPressedRef.current) {
            gPressedRef.current = true;
            if (gTimerRef.current) clearTimeout(gTimerRef.current);
            gTimerRef.current = setTimeout(() => {
              gPressedRef.current = false;
            }, 800);
            return;
          }
        }

        if (gPressedRef.current) {
          gPressedRef.current = false;
          if (gTimerRef.current) clearTimeout(gTimerRef.current);

          const routes: Record<string, string> = {
            h: '/admin',
            o: '/admin/orders',
            c: '/admin/customers',
            d: '/admin/drivers',
            v: '/admin/vehicles',
            s: '/admin/settings',
          };
          const route = routes[e.key.toLowerCase()];
          if (route) {
            e.preventDefault();
            router.push(route);
            return;
          }
        }

        // J/K for table row navigation (outside inputs)
        if (e.key === 'j' || e.key === 'ArrowDown') {
          const rows = document.querySelectorAll<HTMLElement>('[data-row-index]');
          if (rows.length > 0) {
            e.preventDefault();
            setFocusedRowIndex(prev => {
              const next = Math.min(prev + 1, rows.length - 1);
              rows[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              rows[next]?.focus();
              return next;
            });
            return;
          }
        }

        if (e.key === 'k' || e.key === 'ArrowUp') {
          const rows = document.querySelectorAll<HTMLElement>('[data-row-index]');
          if (rows.length > 0) {
            e.preventDefault();
            setFocusedRowIndex(prev => {
              const next = Math.max(prev - 1, 0);
              rows[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              rows[next]?.focus();
              return next;
            });
            return;
          }
        }

        // Enter to activate focused row
        if (e.key === 'Enter') {
          const focused = document.querySelector<HTMLElement>('[data-row-index][data-focused="true"]');
          if (focused) {
            e.preventDefault();
            focused.click();
            return;
          }
        }

        // N for new item (outside inputs)
        if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
          const addBtn = document.querySelector<HTMLButtonElement>('[data-action="create"]');
          if (addBtn) {
            e.preventDefault();
            addBtn.click();
            return;
          }
        }

        // E for edit on focused row
        if (e.key === 'e') {
          const editBtn = document.querySelector<HTMLButtonElement>('[data-row-index][data-focused="true"] [data-action="edit"]');
          if (editBtn) {
            e.preventDefault();
            editBtn.click();
            return;
          }
        }
      }

      // Check registered page-level shortcuts
      for (const [, shortcut] of shortcutsRef.current) {
        const modMatch =
          !shortcut.modifier ||
          (shortcut.modifier === 'ctrl' && (e.ctrlKey || e.metaKey)) ||
          (shortcut.modifier === 'shift' && e.shiftKey) ||
          (shortcut.modifier === 'alt' && e.altKey) ||
          (shortcut.modifier === 'meta' && e.metaKey);

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && modMatch) {
          if (!isInput || shortcut.modifier) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, showHelp]);

  return (
    <KeyboardContext.Provider value={{ registerShortcut, unregisterShortcut, showHelp, setShowHelp, focusedRowIndex, setFocusedRowIndex }}>
      {children}
      {showHelp && <ShortcutHelp onClose={() => setShowHelp(false)} />}
    </KeyboardContext.Provider>
  );
}
