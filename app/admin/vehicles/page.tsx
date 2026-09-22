'use client';

import { useState, useEffect } from 'react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ make: '', model: '', licensePlate: '', capacity: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ make: '', model: '', licensePlate: '', capacity: '' });
        setIsFormOpen(false);
        fetchVehicles();
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
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Vehicles</h1>
          <p className="text-sm text-[var(--muted)]">{vehicles.length} total vehicles</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${
            isFormOpen
              ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]'
              : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          }`}
        >
          {isFormOpen ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 mb-8">
          <h2 className="text-sm font-medium mb-5 text-[var(--foreground)]">New Vehicle</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Make</label>
                <input
                  required type="text" value={formData.make}
                  onChange={e => setFormData({ ...formData, make: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Tata"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Model</label>
                <input
                  required type="text" value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Ace Gold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">License Plate</label>
                <input
                  required type="text" value={formData.licensePlate}
                  onChange={e => setFormData({ ...formData, licensePlate: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="KL-01-AB-1234"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Capacity (tons)</label>
                <input
                  required type="number" step="0.1" value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="2.5"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit" disabled={submitting}
                className="bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Vehicle'}
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
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Plate</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Capacity</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Added</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--muted)]">Loading...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--muted)]">No vehicles yet. Click &quot;Add Vehicle&quot; to create one.</td></tr>
            ) : (
              vehicles.map((vehicle, i) => (
                <tr key={vehicle.id} className={`hover:bg-[var(--surface)] transition-colors duration-100 ${i < vehicles.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium">{vehicle.make} {vehicle.model}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs text-[var(--muted)]">{vehicle.licensePlate}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)] tabular-nums">{vehicle.capacity}t</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)] tabular-nums">{new Date(vehicle.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
