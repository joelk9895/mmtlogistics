import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    { label: 'Total Drivers', value: '—', href: '/admin/drivers' },
    { label: 'Total Vehicles', value: '—', href: '/admin/vehicles' },
    { label: 'Total Customers', value: '—', href: '/admin/customers' },
    { label: 'Active Orders', value: '—', href: '/admin/orders' },
  ];

  const quickActions = [
    { label: 'New Driver', href: '/admin/drivers', shortcut: 'D' },
    { label: 'New Vehicle', href: '/admin/vehicles', shortcut: 'V' },
    { label: 'New Customer', href: '/admin/customers', shortcut: 'C' },
    { label: 'New Order', href: '/admin/orders', shortcut: 'O' },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Overview</h1>
        <p className="text-sm text-[var(--muted)]">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-[var(--border)] rounded-lg p-5 bg-[var(--card)] hover:border-[var(--muted)]/30 transition-colors duration-150"
          >
            <p className="text-xs text-[var(--muted)] font-medium mb-2 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-[var(--muted)] mb-4 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="border border-[var(--border)] rounded-lg px-4 py-3 bg-[var(--card)] hover:border-[var(--muted)]/30 transition-colors duration-150 flex items-center justify-between group"
            >
              <span className="text-sm font-medium text-[var(--foreground)]">{action.label}</span>
              <span className="text-[10px] text-[var(--muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded font-mono group-hover:text-[var(--foreground)] transition-colors">
                {action.shortcut}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity placeholder */}
      <div>
        <h2 className="text-sm font-medium text-[var(--muted)] mb-4 uppercase tracking-wider">Recent Activity</h2>
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-12 flex items-center justify-center">
          <p className="text-sm text-[var(--muted)]">No recent activity yet. Start by creating a driver, vehicle, or customer.</p>
        </div>
      </div>
    </div>
  );
}
