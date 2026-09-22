'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DriverCalendar from '@/components/DriverCalendar';

type Order = {
  id: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
  customer?: { companyName: string };
};

type Leave = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export default function DriverDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });

  const fetchSchedule = () => {
    setLoading(true);
    fetch('/api/driver/schedule')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        if (data.leaves) setLeaves(data.leaves);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/driver/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setIsModalOpen(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      fetchSchedule(); // Refresh calendar
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    targetDate.setHours(0, 0, 0, 0);

    const dayOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return (
        orderDate.getFullYear() === targetDate.getFullYear() &&
        orderDate.getMonth() === targetDate.getMonth() &&
        orderDate.getDate() === targetDate.getDate()
      );
    });

    const dayLeaves = leaves.filter((l) => {
      const start = new Date(l.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(l.endDate);
      end.setHours(23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    });

    return { orders: dayOrders, leaves: dayLeaves };
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Driver Portal</h1>
            <p className="text-sm text-[var(--muted)]">View your assigned duties and leave schedule.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Request Leave
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-[var(--border)] rounded-md text-sm font-medium hover:bg-[var(--surface)] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading schedule...</div>
        ) : (
          <DriverCalendar orders={orders} leaves={leaves} />
        )}
      </div>

      {/* Leave Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">Request Leave</h2>
            <form onSubmit={handleRequestLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] h-24 resize-none"
                  placeholder="Reason for leave..."
                />
              </div>
              
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-md text-sm hover:bg-[var(--surface)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
