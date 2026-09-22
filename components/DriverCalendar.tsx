'use client';

import { useState } from 'react';

type Order = {
  id: string;
  trackingNumber: string;
  createdAt: string;
};

type Leave = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
};

type DriverCalendarProps = {
  orders: Order[];
  leaves: Leave[];
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DriverCalendar({ orders, leaves }: DriverCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--surface)] text-sm"
          >
            Prev
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--surface)] text-sm"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--surface)] text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface)]">
        {DAYS.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-r border-[var(--border)] last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[120px] bg-[var(--card)]">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="border-r border-b border-[var(--border)] bg-[var(--surface)]/30 p-2" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const { orders: dayOrders, leaves: dayLeaves } = getEventsForDay(day);
          const isToday = 
            day === new Date().getDate() && 
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div key={day} className="border-r border-b border-[var(--border)] p-2 flex flex-col gap-1 overflow-y-auto last:border-r-0 hover:bg-[var(--surface)]/20 transition-colors">
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--accent)] text-white' : 'text-[var(--foreground)]'}`}>
                {day}
              </div>
              
              {dayLeaves.map(leave => (
                <div key={leave.id} className={`text-[10px] px-2 py-1 rounded truncate border ${
                  leave.status === 'APPROVED' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                  leave.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'
                }`}>
                  Leave ({leave.status})
                </div>
              ))}

              {dayOrders.map(order => (
                <div key={order.id} className="text-[10px] px-2 py-1 rounded truncate border bg-[var(--foreground)] text-[var(--background)]">
                  Trip: {order.trackingNumber}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
