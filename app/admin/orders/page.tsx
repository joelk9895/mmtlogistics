'use client';

import { useState, useEffect } from 'react';

type OrderStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'text-[var(--warning)]',
  IN_TRANSIT: 'text-[var(--accent)]',
  DELIVERED: 'text-[var(--success)]',
  CANCELLED: 'text-[var(--destructive)]',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '', pickupLocation: '', dropoffLocation: '',
    assignedDriverId: '', assignedVehicleId: '', status: 'PENDING',
  });

  const fetchAll = async () => {
    try {
      const [ordersRes, customersRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/orders'), fetch('/api/customers'), fetch('/api/drivers'), fetch('/api/vehicles'),
      ]);
      setOrders(await ordersRes.json());
      setCustomers(await customersRes.json());
      setDrivers(await driversRes.json());
      setVehicles(await vehiclesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ customerId: '', pickupLocation: '', dropoffLocation: '', assignedDriverId: '', assignedVehicleId: '', status: 'PENDING' });
        setIsFormOpen(false);
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Orders</h1>
          <p className="text-sm text-[var(--muted)]">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${
            isFormOpen
              ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]'
              : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          }`}
        >
          {isFormOpen ? 'Cancel' : 'Create Order'}
        </button>
      </div>

      {isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 mb-8">
          <h2 className="text-sm font-medium mb-5 text-[var(--foreground)]">New Order</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer select */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Customer</label>
              <select
                required value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="">Select a customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Pickup Location</label>
                <input
                  required type="text" value={formData.pickupLocation}
                  onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Warehouse A, Mumbai"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Drop-off Location</label>
                <input
                  required type="text" value={formData.dropoffLocation}
                  onChange={e => setFormData({ ...formData, dropoffLocation: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Distribution Center, Pune"
                />
              </div>
            </div>

            {/* Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Assign Driver <span className="normal-case text-[var(--muted)]/60">(optional)</span></label>
                <select
                  value={formData.assignedDriverId}
                  onChange={e => setFormData({ ...formData, assignedDriverId: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="">Unassigned</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Assign Vehicle <span className="normal-case text-[var(--muted)]/60">(optional)</span></label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={e => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="">Unassigned</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} — {v.licensePlate}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit" disabled={submitting}
                className="bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Route</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Driver</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--muted)]">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--muted)]">No orders yet. Click &quot;Create Order&quot; to get started.</td></tr>
            ) : (
              orders.map((order, i) => (
                <tr key={order.id} className={`hover:bg-[var(--surface)] transition-colors duration-100 ${i < orders.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium">{order.customer?.companyName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    <span>{order.pickupLocation}</span>
                    <span className="mx-1.5 text-[var(--border)]">→</span>
                    <span>{order.dropoffLocation}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{order.driver?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)] font-mono text-xs">{order.vehicle ? `${order.vehicle.licensePlate}` : '—'}</td>
                  <td className={`px-4 py-3 text-xs font-medium uppercase tracking-wider ${statusStyles[order.status as OrderStatus] || ''}`}>
                    {order.status?.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)] tabular-nums">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
