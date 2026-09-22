'use client';

import { useState, useEffect } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', contactPerson: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ companyName: '', contactPerson: '', email: '', phone: '' });
        setIsFormOpen(false);
        fetchCustomers();
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
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Customers</h1>
          <p className="text-sm text-[var(--muted)]">{customers.length} total customers</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${
            isFormOpen
              ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]'
              : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          }`}
        >
          {isFormOpen ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 mb-8">
          <h2 className="text-sm font-medium mb-5 text-[var(--foreground)]">New Customer</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Company Name</label>
                <input
                  required type="text" value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Acme Industries"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Contact Person</label>
                <input
                  required type="text" value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Jane Smith"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Email</label>
                <input
                  required type="email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="jane@acme.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">Phone</label>
                <input
                  required type="text" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit" disabled={submitting}
                className="bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Customer'}
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
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--muted)]">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--muted)]">No customers yet. Click &quot;Add Customer&quot; to create one.</td></tr>
            ) : (
              customers.map((customer, i) => (
                <tr key={customer.id} className={`hover:bg-[var(--surface)] transition-colors duration-100 ${i < customers.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium">{customer.companyName}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{customer.contactPerson}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{customer.email}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)] tabular-nums">{customer.phone}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
