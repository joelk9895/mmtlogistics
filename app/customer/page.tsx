'use client';

import { useRouter } from 'next/navigation';

export default function CustomerDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Customer Portal</h1>
            <p className="text-sm text-[var(--muted)]">Track your orders and manage shipments.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 border border-[var(--border)] rounded-md text-sm font-medium hover:bg-[var(--surface)] transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <p className="text-[var(--muted)] text-sm">Your active orders and freight history will appear here.</p>
        </div>
      </div>
    </div>
  );
}
