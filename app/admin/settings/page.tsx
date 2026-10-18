'use client';

import { FormEvent, useEffect, useState } from 'react';

type Settings = {
  companyName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  currency: string;
  timezone: string;
  defaultAnnualLeaveDays: number;
  defaultMonthlyAllowance: number;
  defaultNoticePeriodDays: number;
};

const blankSettings: Settings = {
  companyName: 'MMT Logistics', supportEmail: '', supportPhone: '', currency: 'SAR', timezone: 'Asia/Riyadh',
  defaultAnnualLeaveDays: 21, defaultMonthlyAllowance: 0, defaultNoticePeriodDays: 30,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(blankSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => { if (!data.error) setSettings(data); })
      .catch(() => setMessage('Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, value: string) => setSettings((previous) => ({
    ...previous,
    [key]: ['defaultAnnualLeaveDays', 'defaultMonthlyAllowance', 'defaultNoticePeriodDays'].includes(key) ? Number(value) : value,
  }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage('');
    const response = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error || 'Could not save settings.');
    setSettings(data); setMessage('Settings saved. Driver records without an override will use these defaults.');
  };

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading settings…</p>;

  return <div className="max-w-3xl">
    <div className="mb-8"><h1 className="text-2xl font-semibold">Platform Settings</h1><p className="mt-1 text-sm text-[var(--muted)]">Set organization-wide operating defaults. Individual drivers can override allowance values.</p></div>
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"><h2 className="text-sm font-semibold">Organization</h2><div className="mt-4 grid grid-cols-2 gap-4">
        <Input label="Company Name" value={settings.companyName} onChange={(v) => set('companyName', v)} required />
        <Input label="Currency" value={settings.currency} onChange={(v) => set('currency', v)} required />
        <Input label="Support Email" type="email" value={settings.supportEmail || ''} onChange={(v) => set('supportEmail', v)} />
        <Input label="Support Phone" value={settings.supportPhone || ''} onChange={(v) => set('supportPhone', v)} />
        <Input label="Timezone" value={settings.timezone} onChange={(v) => set('timezone', v)} required />
      </div></section>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"><h2 className="text-sm font-semibold">Driver Defaults</h2><p className="mt-1 text-xs text-[var(--muted)]">Used automatically for drivers without their own override.</p><div className="mt-4 grid grid-cols-3 gap-4">
        <Input label="Annual Leave Days" type="number" min="0" value={String(settings.defaultAnnualLeaveDays)} onChange={(v) => set('defaultAnnualLeaveDays', v)} required />
        <Input label="Base Monthly Allowance" type="number" min="0" step="0.01" value={String(settings.defaultMonthlyAllowance)} onChange={(v) => set('defaultMonthlyAllowance', v)} required />
        <Input label="Default Notice Period (Days)" type="number" min="0" value={String(settings.defaultNoticePeriodDays)} onChange={(v) => set('defaultNoticePeriodDays', v)} required />
      </div></section>
      {message && <p className={`text-sm ${message === 'Settings saved. Driver records without an override will use these defaults.' ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>{message}</p>}
      <button disabled={saving} className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50">{saving ? 'Saving…' : 'Save Settings'}</button>
    </form>
  </div>;
}

function Input({ label, value, onChange, type = 'text', required, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string; step?: string }) {
  return <label className="block text-xs font-medium text-[var(--muted)]">{label}<input required={required} type={type} min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" /></label>;
}
