'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  drivers: { total: number; active: number };
  vehicles: { total: number; active: number };
  customers: { total: number; active: number };
  orders: {
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getRouteSummary = (order: any) => {
    const locations = order.locations || [];
    const pickup = locations.find((l: any) => l.type === 'PICKUP') || locations[0];
    const dropoff = [...locations].reverse().find((l: any) => l.type === 'DROPOFF') || locations[locations.length - 1];
    return {
      pickup: pickup?.city || '—',
      dropoff: dropoff?.city || '—',
    };
  };

  const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
    PENDING: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
    IN_TRANSIT: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
    DELIVERED: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    CANCELLED: { color: 'text-red-500', bg: 'bg-red-500/10' },
  };

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`skeleton ${className}`} />
  );

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Overview</h1>
        <p className="text-sm text-[var(--muted)]">Welcome back. Here&apos;s what&apos;s happening across MMT Logistics.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <Link
          href="/admin/drivers"
          className="border border-[var(--border)] rounded-xl p-5 bg-[var(--card)] hover:border-[var(--accent)]/50 transition-all duration-200 group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Drivers</p>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-sm">◉</span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{stats?.drivers.total ?? 0}</p>
              <p className="text-xs text-[var(--muted)] mt-1">{stats?.drivers.active ?? 0} active</p>
            </>
          )}
        </Link>
        <Link
          href="/admin/vehicles"
          className="border border-[var(--border)] rounded-xl p-5 bg-[var(--card)] hover:border-[var(--accent)]/50 transition-all duration-200 group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Vehicles</p>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-sm">▣</span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{stats?.vehicles.total ?? 0}</p>
              <p className="text-xs text-[var(--muted)] mt-1">{stats?.vehicles.active ?? 0} active</p>
            </>
          )}
        </Link>
        <Link
          href="/admin/customers"
          className="border border-[var(--border)] rounded-xl p-5 bg-[var(--card)] hover:border-[var(--accent)]/50 transition-all duration-200 group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Customers</p>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-sm">◎</span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{stats?.customers.total ?? 0}</p>
              <p className="text-xs text-[var(--muted)] mt-1">{stats?.customers.active ?? 0} active</p>
            </>
          )}
        </Link>
        <Link
          href="/admin/orders"
          className="border border-[var(--border)] rounded-xl p-5 bg-[var(--card)] hover:border-[var(--accent)]/50 transition-all duration-200 group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Orders</p>
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-sm">▦</span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{stats?.orders.total ?? 0}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {stats?.orders.pending ?? 0} pending · {stats?.orders.inTransit ?? 0} in transit
              </p>
            </>
          )}
        </Link>
      </div>

      {/* Order Pipeline + Quick Actions */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {/* Pipeline */}
        <div className="col-span-2">
          <h2 className="text-sm font-medium text-[var(--muted)] mb-4 uppercase tracking-wider">Order Pipeline</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Pending', value: stats?.orders.pending ?? 0, color: 'amber', href: '/admin/orders?status=PENDING' },
              { label: 'In Transit', value: stats?.orders.inTransit ?? 0, color: 'blue', href: '/admin/orders?status=IN_TRANSIT' },
              { label: 'Delivered', value: stats?.orders.delivered ?? 0, color: 'emerald', href: '/admin/orders?status=DELIVERED' },
              { label: 'Cancelled', value: stats?.orders.cancelled ?? 0, color: 'red', href: '/admin/orders?status=CANCELLED' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] hover:border-[var(--accent)]/50 transition-all duration-200 shadow-sm group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                  <span className="text-xs text-[var(--muted)] font-medium">{item.label}</span>
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums group-hover:text-[var(--accent)] transition-colors">{item.value}</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)] mb-4 uppercase tracking-wider">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'New Order', href: '/admin/orders?create=1', shortcut: '⌘N', primary: true },
              { label: 'New Customer', href: '/admin/customers?create=1', shortcut: '⌘K → C' },
              { label: 'New Driver', href: '/admin/drivers?create=1', shortcut: '⌘K → D' },
              { label: 'New Vehicle', href: '/admin/vehicles?create=1', shortcut: '⌘K → V' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`border rounded-lg px-4 py-3 flex items-center justify-between group transition-all duration-200 ${
                  action.primary
                    ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/50'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]/30'
                }`}
              >
                <span className={`text-sm font-medium ${action.primary ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                  {action.label}
                </span>
                <span className="text-[10px] text-[var(--muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded font-mono group-hover:text-[var(--foreground)] transition-colors">
                  {action.shortcut}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-[var(--accent)] hover:underline font-medium">View all →</Link>
        </div>
        <div className="border border-[var(--border)] rounded-xl bg-[var(--card)] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : !stats?.recentOrders?.length ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center text-xl opacity-40">▦</div>
              <p className="text-sm text-[var(--muted)]">No orders yet. Create your first order to get started.</p>
              <Link
                href="/admin/orders?create=1"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Create Order →
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Tracking</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Route</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any) => {
                  const route = getRouteSummary(order);
                  const s = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/admin/orders?view=${order.id}`)}
                      className="hover:bg-[var(--surface)] cursor-pointer transition-colors border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm font-bold">{order.trackingNumber}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm">{order.customer?.companyName || '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-[var(--muted)]">{route.pickup} → {route.dropoff}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color}`}>
                          {order.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
