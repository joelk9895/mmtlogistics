'use client';

import { useState } from 'react';

type MasterScheduleViewProps = {
  drivers: any[];
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MasterScheduleView({ drivers }: MasterScheduleViewProps) {
  // Start with 7 days ago
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 7);
    return d;
  });

  const shiftWindow = (days: number) => {
    setStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  };

  const jumpToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 7);
    setStartDate(d);
  };

  // Generate the 14 days for the window
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Schedule Timeline
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => shiftWindow(-7)}
            className="px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] rounded-md hover:bg-[var(--surface)] text-sm font-medium transition-colors"
          >
            ← Prev 7 Days
          </button>
          <button 
            onClick={jumpToToday}
            className="px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] rounded-md hover:bg-[var(--surface)] text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button 
            onClick={() => shiftWindow(7)}
            className="px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] rounded-md hover:bg-[var(--surface)] text-sm font-medium transition-colors"
          >
            Next 7 Days →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header Row (Dates) */}
          <div className="flex border-b border-[var(--border)]">
            <div className="w-64 shrink-0 p-3 bg-[var(--surface)] border-r border-[var(--border)] flex items-center">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Driver</span>
            </div>
            <div className="flex-1 grid grid-cols-14" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
              {days.map((day, i) => (
                <div key={i} className={`p-2 border-r border-[var(--border)] text-center last:border-r-0 ${isToday(day) ? 'bg-[var(--accent)]/10' : 'bg-[var(--surface)]'}`}>
                  <div className={`text-xs font-bold ${isToday(day) ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                    {DAY_NAMES[day.getDay()]}
                  </div>
                  <div className={`text-sm ${isToday(day) ? 'font-bold text-[var(--foreground)]' : 'font-medium'}`}>
                    {day.getDate()} {day.toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Rows */}
          <div className="divide-y divide-[var(--border)] bg-[var(--background)]">
            {drivers.map(driver => (
              <div key={driver.id} className="flex hover:bg-[var(--surface)]/30 transition-colors">
                
                {/* Driver Info Column */}
                <div className="w-64 shrink-0 p-3 border-r border-[var(--border)] flex items-center gap-3">
                  {driver.profilePhotoUrl ? (
                    <img src={driver.profilePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border)]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--muted)]">
                      {driver.firstName?.[0]}{driver.lastName?.[0]}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{driver.firstName} {driver.lastName}</p>
                    <p className="text-xs font-mono text-[var(--muted)] truncate">{driver.employeeId}</p>
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 grid grid-cols-14" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                  {days.map((day, i) => {
                    // Check if there are orders or leaves for this specific day
                    const dayOrders = driver.orders?.filter((o: any) => {
                      const d = new Date(o.createdAt);
                      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
                    }) || [];

                    const dayLeaves = driver.leaves?.filter((l: any) => {
                      const s = new Date(l.startDate);
                      s.setHours(0,0,0,0);
                      const e = new Date(l.endDate);
                      e.setHours(23,59,59,999);
                      return day >= s && day <= e;
                    }) || [];

                    return (
                      <div key={i} className={`border-r border-[var(--border)] p-1.5 last:border-r-0 min-h-[60px] flex flex-col gap-1 ${isToday(day) ? 'bg-[var(--accent)]/5' : ''}`}>
                        
                        {/* Leaves */}
                        {dayLeaves.map((l: any) => (
                          <div 
                            key={l.id} 
                            className={`text-[9px] px-1.5 py-1 rounded-sm truncate font-semibold border ${
                              l.status === 'APPROVED' ? 'bg-green-500/10 border-green-500/20 text-green-700' :
                              l.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-700' :
                              'bg-yellow-500/10 border-yellow-500/20 text-yellow-700'
                            }`}
                            title={`Leave: ${l.reason}`}
                          >
                            Leave ({l.status})
                          </div>
                        ))}

                        {/* Orders (Duties) */}
                        {dayOrders.map((o: any) => (
                          <div 
                            key={o.id}
                            className="text-[9px] px-1.5 py-1 rounded-sm truncate font-medium bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                            title={`Trip: ${o.trackingNumber} to ${o.customer?.companyName || 'Unknown'}`}
                          >
                            Duty: {o.trackingNumber}
                          </div>
                        ))}

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {drivers.length === 0 && (
              <div className="p-8 text-center text-[var(--muted)] text-sm">
                No drivers found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
