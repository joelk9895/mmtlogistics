'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboard } from '@/components/KeyboardProvider';
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), {
  ssr: false,
  loading: () => <div className="h-full min-h-[360px] bg-[var(--surface)] animate-pulse" />,
});

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
  const [mapDrivers, setMapDrivers] = useState<any[]>([]);
  const [mapWidth, setMapWidth] = useState(440);
  const mapResizeRef = useRef(false);
  const router = useRouter();
  const { focusedRowIndex, setFocusedRowIndex } = useKeyboard();

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));

    const loadDrivers = () => {
      fetch('/api/driver/location')
        .then(r => r.json())
        .then(data => {
          if (data.drivers) setMapDrivers(data.drivers);
        })
        .catch(() => {});
    };

    loadDrivers();
    const interval = setInterval(loadDrivers, 15000); // Poll every 15s for live fleet movement
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncMapWidth = () => {
      setMapWidth(current => Math.min(580, Math.max(340, Math.min(current, window.innerWidth * 0.36))));
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!mapResizeRef.current) return;
      setMapWidth(Math.min(580, Math.max(340, Math.min(window.innerWidth - event.clientX, window.innerWidth * 0.45))));
    };
    const stopResize = () => {
      mapResizeRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('resize', syncMapWidth);
    syncMapWidth();
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('resize', syncMapWidth);
    };
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
    <div
      className="min-w-0 pb-10 xl:grid xl:grid-cols-[minmax(0,1fr)_var(--map-pane-width)] xl:gap-8"
      style={{ '--map-pane-width': `${mapWidth}px` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-6 mb-8 xl:col-start-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">Operations control room</p>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Today&apos;s dispatch</h1>
          <p className="text-sm text-[var(--muted)]">Monitor workload, readiness, and the shipments that need action.</p>
        </div>
        <Link href="/admin/orders?create=1" className="shrink-0 border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
          + New Order
        </Link>
      </div>

      <section className="border border-[var(--border)] rounded-xl bg-[var(--card)] p-5 mb-8 xl:col-start-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Needs attention</h2>
            <p className="text-xs text-[var(--muted)] mt-1">The current operational workload at a glance.</p>
          </div>
          <Link href="/admin/orders" className="text-xs text-[var(--accent)] font-medium hover:underline">Open dispatch →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Link href="/admin/orders?status=PENDING" className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 hover:border-amber-500/50 transition-colors">
            <div className="min-w-0 mr-3">
              <p className="text-xs text-amber-500 font-medium uppercase tracking-wider">Awaiting dispatch</p>
              <p className="text-xs text-[var(--muted)] mt-1 truncate">Orders pending assignment</p>
            </div>
            <span className="text-2xl font-bold tabular-nums text-amber-500 shrink-0">{loading ? '—' : stats?.orders.pending ?? 0}</span>
          </Link>
          <Link href="/admin/orders?status=IN_TRANSIT" className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 hover:border-blue-500/50 transition-colors">
            <div className="min-w-0 mr-3">
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">On the road</p>
              <p className="text-xs text-[var(--muted)] mt-1 truncate">Shipments currently in transit</p>
            </div>
            <span className="text-2xl font-bold tabular-nums text-blue-500 shrink-0">{loading ? '—' : stats?.orders.inTransit ?? 0}</span>
          </Link>
          <Link href="/admin/drivers" className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 hover:border-[var(--accent)]/50 transition-colors">
            <div className="min-w-0 mr-3">
              <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Active drivers</p>
              <p className="text-xs text-[var(--muted)] mt-1 truncate">Available fleet operators</p>
            </div>
            <span className="text-2xl font-bold tabular-nums shrink-0">{loading ? '—' : `${stats?.drivers.active ?? 0}/${stats?.drivers.total ?? 0}`}</span>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 mb-8 xl:col-start-1">
        <section className="2xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-sm font-semibold">Shipment flow</h2><p className="text-xs text-[var(--muted)] mt-1">Where orders are in the lifecycle.</p></div>
            <Link href="/admin/orders" className="text-xs text-[var(--accent)] hover:underline">View orders →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending', value: stats?.orders.pending ?? 0, href: '/admin/orders?status=PENDING', tone: 'text-amber-500' },
              { label: 'In transit', value: stats?.orders.inTransit ?? 0, href: '/admin/orders?status=IN_TRANSIT', tone: 'text-blue-500' },
              { label: 'Delivered', value: stats?.orders.delivered ?? 0, href: '/admin/orders?status=DELIVERED', tone: 'text-emerald-500' },
              { label: 'Cancelled', value: stats?.orders.cancelled ?? 0, href: '/admin/orders?status=CANCELLED', tone: 'text-red-500' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 hover:border-[var(--accent)]/50 transition-colors">
                <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">{item.label}</p>
                {loading ? <Skeleton className="h-8 w-12 mt-2" /> : <p className={`text-2xl sm:text-3xl font-bold tabular-nums mt-2 ${item.tone}`}>{item.value}</p>}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-sm font-semibold">Resource readiness</h2><p className="text-xs text-[var(--muted)] mt-1">Active capacity in the fleet.</p></div></div>
          <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] divide-y divide-[var(--border)]">
            <Link href="/admin/drivers" className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface)] transition-colors"><span className="text-sm">Drivers</span><span className="text-sm font-semibold tabular-nums">{loading ? '—' : `${stats?.drivers.active ?? 0} / ${stats?.drivers.total ?? 0}`}</span></Link>
            <Link href="/admin/vehicles" className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface)] transition-colors"><span className="text-sm">Vehicles</span><span className="text-sm font-semibold tabular-nums">{loading ? '—' : `${stats?.vehicles.active ?? 0} / ${stats?.vehicles.total ?? 0}`}</span></Link>
            <Link href="/admin/customers" className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface)] transition-colors"><span className="text-sm">Active customers</span><span className="text-sm font-semibold tabular-nums">{loading ? '—' : stats?.customers.active ?? 0}</span></Link>
          </div>
        </section>
      </div>

      <section
        className="grid grid-cols-1 xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1 xl:row-span-4 xl:max-h-[calc(100vh-5rem)] xl:grid-cols-1 xl:gap-0 xl:overflow-y-auto bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-sm mb-8"
        style={{ '--map-pane-width': `${mapWidth}px` } as React.CSSProperties}
      >
        <div
          role="separator"
          aria-label="Resize fleet map"
          aria-orientation="vertical"
          onPointerDown={() => {
            mapResizeRef.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
          className="absolute left-0 top-0 bottom-0 z-20 hidden w-1 cursor-col-resize bg-transparent hover:bg-[var(--accent)]/60 xl:block"
        />
        <div className="border-b border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-semibold">Live fleet map</h2>
              <p className="text-xs text-[var(--muted)] mt-1">Driver locations will appear here when the driver app starts sharing GPS.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
              <span className={`w-1.5 h-1.5 rounded-full ${mapDrivers.length > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-[var(--muted)]'}`} /> {mapDrivers.length > 0 ? 'Live (Connected)' : 'Waiting for GPS'}
            </span>
          </div>
          <div className="relative h-[62vh] min-h-[360px] max-h-[620px]">
            <MapDisplay
              latitude={mapDrivers[0]?.currentLatitude || null}
              longitude={mapDrivers[0]?.currentLongitude || null}
              height="100%"
              markers={mapDrivers.map(d => ({
                id: d.id,
                latitude: d.currentLatitude,
                longitude: d.currentLongitude,
                label: `${d.firstName} ${d.lastName} (${d.primaryVehicle?.licensePlate || d.employeeId})`,
                detail: d.orders?.[0]?.trackingNumber ? `Order: ${d.orders[0].trackingNumber}` : `Status: ${d.status}`,
              }))}
            />
            {mapDrivers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-lg border border-zinc-800 bg-black/90 backdrop-blur-md px-5 py-4 text-center shadow-xl">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <p className="text-sm font-semibold text-zinc-100">Live Fleet Radar Standing By</p>
                  </div>
                  <p className="text-xs text-zinc-400">Driver positions will populate here automatically as drivers share GPS.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold">Fleet map status</h2>
          <p className="text-xs text-[var(--muted)] mt-1 mb-5">Location coverage for active drivers.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-[var(--muted)]">Drivers on map</span><span className="font-semibold tabular-nums text-yellow-400">{mapDrivers.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-[var(--muted)]">GPS feed</span><span className={`text-xs font-medium ${mapDrivers.length > 0 ? 'text-yellow-400 font-semibold' : 'text-[var(--muted)]'}`}>{mapDrivers.length > 0 ? 'Connected (Live)' : 'Not connected'}</span></div>
            <div className="border-t border-[var(--border)] pt-4"><p className="text-xs text-[var(--muted)] leading-relaxed">Once location sharing is enabled, each driver marker will show the driver name, current assignment, and last update time.</p></div>
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <div className="xl:col-start-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-[var(--accent)] hover:underline font-medium">View all →</Link>
        </div>
        <div className="border border-[var(--border)] rounded-xl bg-[var(--card)] overflow-x-auto shadow-sm">
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
              <Link href="/admin/orders?create=1" className="text-xs font-medium text-[var(--accent)] hover:underline">
                Create Order →
              </Link>
            </div>
          ) : (
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Tracking</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Route</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any, i: number) => {
                  const isFocused = focusedRowIndex === i;
                  const route = getRouteSummary(order);
                  const s = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
                  return (
                    <tr
                      key={order.id}
                      data-row-index={i}
                      data-focused={isFocused}
                      tabIndex={0}
                      onFocus={() => setFocusedRowIndex(i)}
                      onClick={() => router.push(`/admin/orders?view=${order.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          router.push(`/admin/orders?view=${order.id}`);
                        }
                      }}
                      className={`hover:bg-[var(--surface)] cursor-pointer transition-colors border-b border-[var(--border)] last:border-0 outline-none ${
                        isFocused ? 'bg-[var(--surface)] ring-2 ring-[var(--accent)] ring-inset' : ''
                      }`}
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
