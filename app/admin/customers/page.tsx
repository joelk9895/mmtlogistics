'use client';

import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, CreditCard, FileText, Package, Search, Plus, X, ChevronRight, Users, TrendingUp, AlertTriangle, Shield, Globe, Briefcase, BadgeCheck, UserPlus, Trash2 } from 'lucide-react';

type ContactEntry = {
  name: string;
  title: string;
  email: string;
  phone: string;
  role: string;
};

const emptyContact: ContactEntry = { name: '', title: '', email: '', phone: '', role: '' };

const CONTACT_ROLES = ['Primary', 'Billing', 'Operations', 'Logistics', 'Finance', 'Management', 'Dispatch', 'Other'];

// ── Types ──────────────────────────────────────────────────

type Customer = {
  id: string;
  accountNumber: string;
  companyName: string;
  companyNameAr: string | null;
  tradeName: string | null;
  division: string | null;
  brand: string | null;
  customerType: string;
  customerSubType: string | null;
  status: string;
  industryType: string | null;
  crNumber: string | null;
  crExpiryDate: string | null;
  vatNumber: string | null;
  vatTreatment: string | null;
  zakatCertNumber: string | null;
  zakatCertExpiry: string | null;
  nationalAddress: string | null;
  contactPerson: string;
  contactTitle: string | null;
  email: string;
  phone: string;
  alternatePhone: string | null;
  whatsapp: string | null;
  additionalContacts: string | null;
  billingAttention: string | null;
  billingAddress: string | null;
  billingStreet2: string | null;
  billingDistrict: string | null;
  billingCity: string | null;
  billingRegion: string | null;
  billingPostalCode: string | null;
  billingAdditionalNumber: string | null;
  billingCountry: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingRegion: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  paymentTerms: string;
  paymentTermsLabel: string | null;
  creditLimitSar: number | null;
  openingBalance: number | null;
  currentBalanceSar: number | null;
  bankName: string | null;
  ibanNumber: string | null;
  currency: string | null;
  discountPercent: number | null;
  specialRateCard: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractDocUrl: string | null;
  preferredVehicleTypes: string | null;
  requiresColdChain: boolean;
  requiresHazmat: boolean;
  requiresInsuredCargo: boolean;
  defaultPickupCity: string | null;
  defaultDeliveryCity: string | null;
  accountManagerName: string | null;
  salesRepName: string | null;
  referralSource: string | null;
  tags: string | null;
  notes: string | null;
  logoUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  orders?: any[];
  _count?: { orders: number };
};

// ── Constants ──

const TABS = ['Company', 'Contact', 'Address', 'Financial', 'Services', 'Account'] as const;
type Tab = typeof TABS[number];

const CUSTOMER_TYPES: { value: string; label: string }[] = [
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'SME', label: 'SME' },
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'SEMI_GOVERNMENT', label: 'Semi-Government' },
];

const CUSTOMER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  INACTIVE: { label: 'Inactive', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  PROSPECT: { label: 'Prospect', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ON_HOLD: { label: 'On Hold', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  BLACKLISTED: { label: 'Blacklisted', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const PAYMENT_TERMS: { value: string; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'NET_15', label: 'Net 15 Days' },
  { value: 'NET_30', label: 'Net 30 Days' },
  { value: 'NET_45', label: 'Net 45 Days' },
  { value: 'NET_60', label: 'Net 60 Days' },
  { value: 'NET_90', label: 'Net 90 Days' },
  { value: 'PREPAID', label: 'Prepaid' },
  { value: 'CREDIT', label: 'Credit Line' },
];

const INDUSTRIES: { value: string; label: string }[] = [
  { value: 'FMCG', label: 'FMCG' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'OIL_GAS', label: 'Oil & Gas' },
  { value: 'PETROCHEMICAL', label: 'Petrochemical' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'PHARMACEUTICAL', label: 'Pharmaceutical' },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'ECOMMERCE', label: 'E-Commerce' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'MINING', label: 'Mining' },
  { value: 'TELECOMMUNICATIONS', label: 'Telecom' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'OTHER', label: 'Other' },
];

const SAUDI_REGIONS = [
  'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir',
  'Tabuk', 'Hail', 'Northern Borders', 'Jazan', 'Najran',
  'Al Baha', 'Al Jawf', 'Qassim',
];

const SAUDI_CITIES = [
  'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Dhahran',
  'Jubail', 'Yanbu', 'Tabuk', 'Taif', 'Abha', 'Khamis Mushait', 'Hail',
  'Buraydah', 'Najran', 'Jazan', 'Al Ahsa', 'Hofuf', 'Ras Tanura',
];

// ── Helpers ──

function isExpiringSoon(dateStr: string | null, days = 30): 'expired' | 'warning' | 'ok' {
  if (!dateStr) return 'ok';
  const d = new Date(dateStr);
  const now = new Date();
  if (d < now) return 'expired';
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days ? 'warning' : 'ok';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── Reusable Components ──

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-[var(--destructive)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[var(--muted)]/60 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = "w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 outline-none focus:border-[var(--accent)] transition-colors";

function StatusBadge({ status }: { status: string }) {
  const s = CUSTOMER_STATUS[status] || { label: status, color: 'text-[var(--muted)]', bg: 'bg-[var(--surface)]' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s.color} ${s.bg}`}>{s.label}</span>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)]"
      />
      <div>
        <span className="text-sm font-medium group-hover:text-[var(--accent)] transition-colors">{label}</span>
        {description && <p className="text-[11px] text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

// ── Initial Form ──

const initialForm = {
  // Company & Hierarchy
  companyName: '', companyNameAr: '', tradeName: '', division: '', brand: '', customerType: 'CORPORATE', customerSubType: '', status: 'ACTIVE', industryType: '',
  // Saudi CR & Tax
  crNumber: '', crExpiryDate: '', vatNumber: '', vatTreatment: 'VAT Registered', zakatCertNumber: '', zakatCertExpiry: '', nationalAddress: '',
  // Contact
  contactPerson: '', contactTitle: '', email: '', phone: '', alternatePhone: '', whatsapp: '',
  // Billing
  billingAttention: '', billingAddress: '', billingStreet2: '', billingDistrict: '', billingCity: '', billingRegion: '', billingPostalCode: '', billingAdditionalNumber: '', billingCountry: 'SA',
  // Shipping
  shippingAddress: '', shippingCity: '', shippingRegion: '', shippingPostalCode: '', shippingCountry: 'SA',
  // Financial
  paymentTerms: 'NET_30', paymentTermsLabel: '', creditLimitSar: '', openingBalance: '', currentBalanceSar: '', bankName: '', ibanNumber: '', currency: 'SAR',
  discountPercent: '', contractStartDate: '', contractEndDate: '', contractDocUrl: '',
  // Services
  preferredVehicleTypes: '', requiresColdChain: false, requiresHazmat: false, requiresInsuredCargo: false,
  defaultPickupCity: '', defaultDeliveryCity: '',
  // Account
  accountManagerName: '', salesRepName: '', referralSource: '', tags: '', notes: '', logoUrl: '', website: '',
};

// ══════════════════════════════════════════════════════════════
// ── Main Page ──
// ══════════════════════════════════════════════════════════════

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<typeof initialForm>({ ...initialForm });
  const [activeTab, setActiveTab] = useState<Tab>('Company');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);

  // Detail
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { setLoading(true); fetchCustomers(); }, [searchQuery, filterStatus, filterType]);

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value ?? '' }));

  const sanitizeForEdit = (c: Customer) => {
    const sanitized = { ...initialForm };
    for (const key of Object.keys(initialForm) as (keyof typeof initialForm)[]) {
      const val = (c as any)[key];
      if (val !== null && val !== undefined) {
        if (typeof initialForm[key] === 'boolean') {
          (sanitized as any)[key] = Boolean(val);
        } else if (['crExpiryDate', 'zakatCertExpiry', 'contractStartDate', 'contractEndDate'].includes(key) && val) {
          (sanitized as any)[key] = new Date(val).toISOString().split('T')[0];
        } else {
          (sanitized as any)[key] = String(val);
        }
      }
    }
    return sanitized;
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData(sanitizeForEdit(c));
    // Parse additionalContacts JSON
    try {
      const parsed = c.additionalContacts ? JSON.parse(c.additionalContacts) : [];
      setContacts(Array.isArray(parsed) ? parsed : []);
    } catch { setContacts([]); }
    setIsFormOpen(true);
    setActiveTab('Company');
    setError('');
    setSelectedCustomer(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (c: Customer) => {
    try {
      const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingId(null);
        setIsFormOpen(false);
        setFormData({ ...initialForm });
        setDeleteConfirm(null);
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (e) { alert('Network error'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        additionalContacts: contacts.length > 0 ? JSON.stringify(contacts.filter(c => c.name.trim())) : null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFormData({ ...initialForm });
        setContacts([]);
        setEditingId(null);
        setIsFormOpen(false);
        setActiveTab('Company');
        fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save customer');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCustomer = async (c: Customer) => {
    try {
      const res = await fetch(`/api/customers/${c.id}`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch {
      setSelectedCustomer(c);
    }
  };

  // Stats
  const activeCount = customers.filter(c => c.status === 'ACTIVE').length;
  const prospectCount = customers.filter(c => c.status === 'PROSPECT').length;
  const totalCredit = customers.reduce((acc, c) => acc + (c.creditLimitSar || 0), 0);
  const expiringContracts = customers.filter(c => isExpiringSoon(c.contractEndDate) !== 'ok').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Customers</h1>
          <p className="text-sm text-[var(--muted)]">
            {customers.length} total · {activeCount} active
            {prospectCount > 0 && <span className="ml-1">· {prospectCount} prospects</span>}
          </p>
        </div>
        <button
          onClick={() => {
            if (isFormOpen) {
              setIsFormOpen(false);
              setEditingId(null);
              setFormData({ ...initialForm });
              setActiveTab('Company');
            } else {
              setIsFormOpen(true);
            }
          }}
          className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${
            isFormOpen
              ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]'
              : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          }`}
        >
          {isFormOpen ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Stats Row */}
      {!isFormOpen && customers.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[var(--muted)]" />
              <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Active</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{activeCount}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--muted)]" />
              <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Prospects</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{prospectCount}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-[var(--muted)]" />
              <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Total Credit</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totalCredit)}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--muted)]" />
              <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Expiring</span>
            </div>
            <p className={`text-xl font-bold tabular-nums ${expiringContracts > 0 ? 'text-amber-400' : ''}`}>{expiringContracts}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">contracts</p>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="border border-[var(--border)] rounded-lg bg-[var(--card)] mb-8 overflow-hidden">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                {editingId ? 'Edit Customer' : 'New Customer'}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">Fill in company details across the tabs below</p>
            </div>
            {error && (
              <div className="text-xs text-[var(--destructive)] bg-[var(--destructive)]/10 px-3 py-1.5 rounded-md border border-[var(--destructive)]/20">
                {error}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--border)] px-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-xs font-medium tracking-wider transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="px-6 py-5">
            {/* ═══ COMPANY TAB ═══ */}
            {activeTab === 'Company' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Company Name" required>
                    <input required className={inputClass} value={formData.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Saudi Express Transport" />
                  </Field>
                  <Field label="Arabic Name" hint="اسم الشركة بالعربي">
                    <input className={inputClass} value={formData.companyNameAr} onChange={e => set('companyNameAr', e.target.value)} placeholder="النقل السعودي السريع" dir="rtl" />
                  </Field>
                  <Field label="Trade Name" hint="DBA / brand name">
                    <input className={inputClass} value={formData.tradeName} onChange={e => set('tradeName', e.target.value)} placeholder="SET Logistics" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Division" hint="Operating division / unit">
                    <input className={inputClass} value={formData.division} onChange={e => set('division', e.target.value)} placeholder="Logistics Division" />
                  </Field>
                  <Field label="Brand">
                    <input className={inputClass} value={formData.brand} onChange={e => set('brand', e.target.value)} placeholder="SET Cargo" />
                  </Field>
                  <Field label="Customer Sub-Type" hint="Classification">
                    <input className={inputClass} value={formData.customerSubType} onChange={e => set('customerSubType', e.target.value)} placeholder="Key Account / Direct" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Customer Type">
                    <select className={inputClass} value={formData.customerType} onChange={e => set('customerType', e.target.value)}>
                      {CUSTOMER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className={inputClass} value={formData.status} onChange={e => set('status', e.target.value)}>
                      {Object.entries(CUSTOMER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Industry">
                    <select className={inputClass} value={formData.industryType} onChange={e => set('industryType', e.target.value)}>
                      <option value="">— Select —</option>
                      {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Saudi Registration */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Saudi Commercial Registration & Tax
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="CR Number" hint="سجل تجاري (10 digits)">
                      <input className={inputClass} value={formData.crNumber} onChange={e => set('crNumber', e.target.value)} placeholder="1010123456" maxLength={10} />
                    </Field>
                    <Field label="CR Expiry Date">
                      <input type="date" className={inputClass} value={formData.crExpiryDate} onChange={e => set('crExpiryDate', e.target.value)} />
                    </Field>
                    <Field label="VAT / Tax Reg Number" hint="ZATCA TRN (15 digits)">
                      <input className={inputClass} value={formData.vatNumber} onChange={e => set('vatNumber', e.target.value)} placeholder="300012345600003" maxLength={15} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <Field label="VAT Treatment" hint="Tax status">
                      <select className={inputClass} value={formData.vatTreatment} onChange={e => set('vatTreatment', e.target.value)}>
                        <option value="VAT Registered">VAT Registered</option>
                        <option value="Non-VAT Registered">Non-VAT Registered</option>
                        <option value="Zero Rated">Zero Rated</option>
                        <option value="GCC VAT Registered">GCC VAT Registered</option>
                        <option value="Exempt">Exempt</option>
                      </select>
                    </Field>
                    <Field label="Zakat Certificate">
                      <input className={inputClass} value={formData.zakatCertNumber} onChange={e => set('zakatCertNumber', e.target.value)} placeholder="Certificate number" />
                    </Field>
                    <Field label="Zakat Cert Expiry">
                      <input type="date" className={inputClass} value={formData.zakatCertExpiry} onChange={e => set('zakatCertExpiry', e.target.value)} />
                    </Field>
                    <Field label="National Address Short Code" hint="Saudi short code">
                      <input className={inputClass} value={formData.nationalAddress} onChange={e => set('nationalAddress', e.target.value)} placeholder="RXXX1234" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CONTACT TAB ═══ */}
            {activeTab === 'Contact' && (
              <div className="space-y-5">
                {/* Primary Contact */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Primary Contact
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Contact Person" required>
                      <input required className={inputClass} value={formData.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Ahmed Al-Rashidi" />
                    </Field>
                    <Field label="Title / Position">
                      <input className={inputClass} value={formData.contactTitle} onChange={e => set('contactTitle', e.target.value)} placeholder="Logistics Manager" />
                    </Field>
                    <Field label="Email" required>
                      <input required type="email" className={inputClass} value={formData.email} onChange={e => set('email', e.target.value)} placeholder="ahmed@company.sa" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Field label="Phone" required hint="+966 format">
                      <input required className={inputClass} value={formData.phone} onChange={e => set('phone', e.target.value)} placeholder="+966 50 123 4567" />
                    </Field>
                    <Field label="Alternate Phone">
                      <input className={inputClass} value={formData.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} placeholder="+966 55 987 6543" />
                    </Field>
                    <Field label="WhatsApp" hint="Essential for KSA business">
                      <input className={inputClass} value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+966 50 123 4567" />
                    </Field>
                  </div>
                </div>

                {/* Additional Contacts */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                      <UserPlus className="w-3.5 h-3.5" /> Additional Contacts
                    </h3>
                    <button
                      type="button"
                      onClick={() => setContacts([...contacts, { ...emptyContact }])}
                      className="text-xs font-medium text-[var(--accent)] hover:opacity-80 transition-opacity flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Contact
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center">
                      <UserPlus className="w-5 h-5 text-[var(--muted)] mx-auto mb-2" />
                      <p className="text-xs text-[var(--muted)]">No additional contacts yet.</p>
                      <button
                        type="button"
                        onClick={() => setContacts([{ ...emptyContact }])}
                        className="text-xs font-medium text-[var(--accent)] mt-2 hover:opacity-80 transition-opacity"
                      >
                        + Add a contact person
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((contact, idx) => (
                        <div key={idx} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)] relative group">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Contact {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}
                              className="text-[var(--muted)] hover:text-[var(--destructive)] transition-colors p-1 rounded hover:bg-[var(--destructive)]/10"
                              title="Remove contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-5 gap-3">
                            <div>
                              <label className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wider">Name *</label>
                              <input
                                className={inputClass}
                                value={contact.name}
                                onChange={e => {
                                  const updated = [...contacts];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setContacts(updated);
                                }}
                                placeholder="Full name"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wider">Title</label>
                              <input
                                className={inputClass}
                                value={contact.title}
                                onChange={e => {
                                  const updated = [...contacts];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setContacts(updated);
                                }}
                                placeholder="Position"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wider">Email</label>
                              <input
                                type="email"
                                className={inputClass}
                                value={contact.email}
                                onChange={e => {
                                  const updated = [...contacts];
                                  updated[idx] = { ...updated[idx], email: e.target.value };
                                  setContacts(updated);
                                }}
                                placeholder="email@company.sa"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wider">Phone</label>
                              <input
                                className={inputClass}
                                value={contact.phone}
                                onChange={e => {
                                  const updated = [...contacts];
                                  updated[idx] = { ...updated[idx], phone: e.target.value };
                                  setContacts(updated);
                                }}
                                placeholder="+966 5X XXX XXXX"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wider">Role</label>
                              <select
                                className={inputClass}
                                value={contact.role}
                                onChange={e => {
                                  const updated = [...contacts];
                                  updated[idx] = { ...updated[idx], role: e.target.value };
                                  setContacts(updated);
                                }}
                              >
                                <option value="">— Select —</option>
                                {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setContacts([...contacts, { ...emptyContact }])}
                        className="w-full border border-dashed border-[var(--border)] rounded-lg py-2.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add another contact
                      </button>
                    </div>
                  )}
                </div>

                <Field label="Website">
                  <input className={inputClass} value={formData.website} onChange={e => set('website', e.target.value)} placeholder="https://company.sa" />
                </Field>
              </div>
            )}

            {/* ═══ ADDRESS TAB ═══ */}
            {activeTab === 'Address' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Billing Address (ZATCA & ERP Compatible)
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Field label="Billing Attention" hint="Department / Invoice recipient">
                      <input className={inputClass} value={formData.billingAttention} onChange={e => set('billingAttention', e.target.value)} placeholder="Accounts Payable / Ahmed" />
                    </Field>
                    <Field label="Street Address Line 1">
                      <input className={inputClass} value={formData.billingAddress} onChange={e => set('billingAddress', e.target.value)} placeholder="King Fahd Road, Building 42" />
                    </Field>
                    <Field label="Street Address Line 2">
                      <input className={inputClass} value={formData.billingStreet2} onChange={e => set('billingStreet2', e.target.value)} placeholder="Floor 4, Office 402" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="District (الحي)" hint="Saudi National Address">
                      <input className={inputClass} value={formData.billingDistrict} onChange={e => set('billingDistrict', e.target.value)} placeholder="Al Olaya / Al Malaz" />
                    </Field>
                    <Field label="City">
                      <select className={inputClass} value={formData.billingCity} onChange={e => set('billingCity', e.target.value)}>
                        <option value="">— Select —</option>
                        {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="State / Region">
                      <select className={inputClass} value={formData.billingRegion} onChange={e => set('billingRegion', e.target.value)}>
                        <option value="">— Select —</option>
                        {SAUDI_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Field label="Postal Code / Code" hint="5 digits">
                      <input className={inputClass} value={formData.billingPostalCode} onChange={e => set('billingPostalCode', e.target.value)} placeholder="12345" maxLength={5} />
                    </Field>
                    <Field label="Additional Number (الرقم الإضافي)" hint="4 digits">
                      <input className={inputClass} value={formData.billingAdditionalNumber} onChange={e => set('billingAdditionalNumber', e.target.value)} placeholder="6789" maxLength={4} />
                    </Field>
                    <Field label="Country / County">
                      <input className={inputClass} value={formData.billingCountry} onChange={e => set('billingCountry', e.target.value)} placeholder="SA" />
                    </Field>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" /> Shipping / Operations Address
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        set('shippingAddress', formData.billingAddress);
                        set('shippingCity', formData.billingCity);
                        set('shippingRegion', formData.billingRegion);
                        set('shippingPostalCode', formData.billingPostalCode);
                        set('shippingCountry', formData.billingCountry);
                      }}
                      className="text-[10px] uppercase font-bold text-[var(--accent)] hover:opacity-80 transition-opacity"
                    >
                      Copy from billing
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Street Address">
                      <input className={inputClass} value={formData.shippingAddress} onChange={e => set('shippingAddress', e.target.value)} placeholder="Industrial City, Warehouse 7" />
                    </Field>
                    <Field label="City">
                      <select className={inputClass} value={formData.shippingCity} onChange={e => set('shippingCity', e.target.value)}>
                        <option value="">— Select —</option>
                        {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Field label="Region">
                      <select className={inputClass} value={formData.shippingRegion} onChange={e => set('shippingRegion', e.target.value)}>
                        <option value="">— Select —</option>
                        {SAUDI_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="Postal Code">
                      <input className={inputClass} value={formData.shippingPostalCode} onChange={e => set('shippingPostalCode', e.target.value)} placeholder="12345" maxLength={5} />
                    </Field>
                    <Field label="Country">
                      <input className={inputClass} value={formData.shippingCountry} onChange={e => set('shippingCountry', e.target.value)} placeholder="SA" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ FINANCIAL TAB ═══ */}
            {activeTab === 'Financial' && (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Payment Terms">
                    <select className={inputClass} value={formData.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
                      {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Payment Terms Label" hint="ERP custom label">
                    <input className={inputClass} value={formData.paymentTermsLabel} onChange={e => set('paymentTermsLabel', e.target.value)} placeholder="Due within 30 days" />
                  </Field>
                  <Field label="Opening Balance (SAR)" hint="Initial ledger balance">
                    <input type="number" step="0.01" className={inputClass} value={formData.openingBalance} onChange={e => set('openingBalance', e.target.value)} placeholder="0.00" />
                  </Field>
                  <Field label="Credit Limit (SAR)">
                    <input type="number" step="0.01" className={inputClass} value={formData.creditLimitSar} onChange={e => set('creditLimitSar', e.target.value)} placeholder="50,000" />
                  </Field>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Default Discount %">
                    <input type="number" step="0.1" min="0" max="100" className={inputClass} value={formData.discountPercent} onChange={e => set('discountPercent', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="Bank Name">
                    <input className={inputClass} value={formData.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Al Rajhi Bank" />
                  </Field>
                  <Field label="IBAN" hint="SA + 22 digits">
                    <input className={inputClass} value={formData.ibanNumber} onChange={e => set('ibanNumber', e.target.value)} placeholder="SA0380000000608010167519" />
                  </Field>
                  <Field label="Currency">
                    <input className={inputClass} value={formData.currency} onChange={e => set('currency', e.target.value)} placeholder="SAR" />
                  </Field>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Contract
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Contract Start">
                      <input type="date" className={inputClass} value={formData.contractStartDate} onChange={e => set('contractStartDate', e.target.value)} />
                    </Field>
                    <Field label="Contract End">
                      <input type="date" className={inputClass} value={formData.contractEndDate} onChange={e => set('contractEndDate', e.target.value)} />
                    </Field>
                    <Field label="Contract Document URL">
                      <input className={inputClass} value={formData.contractDocUrl} onChange={e => set('contractDocUrl', e.target.value)} placeholder="/uploads/contracts/..." />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SERVICES TAB ═══ */}
            {activeTab === 'Services' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Default Pickup City">
                    <select className={inputClass} value={formData.defaultPickupCity} onChange={e => set('defaultPickupCity', e.target.value)}>
                      <option value="">— Select —</option>
                      {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Default Delivery City">
                    <select className={inputClass} value={formData.defaultDeliveryCity} onChange={e => set('defaultDeliveryCity', e.target.value)}>
                      <option value="">— Select —</option>
                      {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Special Requirements</h3>
                  <div className="space-y-3">
                    <Toggle label="Cold Chain Required" description="Customer needs refrigerated / temperature-controlled transport" checked={formData.requiresColdChain} onChange={v => set('requiresColdChain', v)} />
                    <Toggle label="Hazmat Transport" description="Customer handles hazardous materials requiring ADR certification" checked={formData.requiresHazmat} onChange={v => set('requiresHazmat', v)} />
                    <Toggle label="Insured Cargo" description="All shipments must have cargo insurance coverage" checked={formData.requiresInsuredCargo} onChange={v => set('requiresInsuredCargo', v)} />
                  </div>
                </div>

                <Field label="Preferred Vehicle Types" hint="Comma-separated slugs, e.g. REEFER_FROZEN_DYNA, BOX_DYNA">
                  <input className={inputClass} value={formData.preferredVehicleTypes} onChange={e => set('preferredVehicleTypes', e.target.value)} placeholder="REEFER_FROZEN_DYNA, BOX_DYNA" />
                </Field>
              </div>
            )}

            {/* ═══ ACCOUNT TAB ═══ */}
            {activeTab === 'Account' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Account Manager">
                    <input className={inputClass} value={formData.accountManagerName} onChange={e => set('accountManagerName', e.target.value)} placeholder="Internal AM name" />
                  </Field>
                  <Field label="Sales Representative">
                    <input className={inputClass} value={formData.salesRepName} onChange={e => set('salesRepName', e.target.value)} placeholder="Sales rep name" />
                  </Field>
                  <Field label="Referral Source" hint="How they found us">
                    <input className={inputClass} value={formData.referralSource} onChange={e => set('referralSource', e.target.value)} placeholder="Website, Referral, Cold Call..." />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tags" hint="Comma-separated for filtering">
                    <input className={inputClass} value={formData.tags} onChange={e => set('tags', e.target.value)} placeholder="VIP, cold-chain, hazmat" />
                  </Field>
                  <Field label="Logo URL">
                    <input className={inputClass} value={formData.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="/uploads/logos/..." />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea className={`${inputClass} h-24 resize-none`} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes about this customer..." />
                </Field>
              </div>
            )}

            {/* ── Form Actions ── */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border)]">
              <div className="flex gap-1">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                    title={tab}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = customers.find(x => x.id === editingId);
                      if (!c) return;
                      if (deleteConfirm === editingId) {
                        handleDelete(c);
                      } else {
                        setDeleteConfirm(editingId);
                        setTimeout(() => setDeleteConfirm(null), 3000);
                      }
                    }}
                    className="text-sm font-medium px-4 py-2 rounded-md text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors mr-2"
                  >
                    {deleteConfirm === editingId ? 'Confirm Delete' : 'Delete'}
                  </button>
                )}
                {activeTab !== TABS[0] && (
                  <button type="button" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1])} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                    ← Previous
                  </button>
                )}
                {activeTab !== TABS[TABS.length - 1] ? (
                  <button type="button" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])} className="text-sm font-medium px-4 py-2 rounded-md bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors">
                    Next →
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="text-sm font-medium px-5 py-2 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Search & Filters ── */}
      {!isFormOpen && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search by name, account #, CR, VAT, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className={`${inputClass} w-36`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(CUSTOMER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className={`${inputClass} w-40`} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {CUSTOMER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* ── Customer Table ── */}
      {!isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Terms</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Orders</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-[var(--muted)]">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-[var(--muted)]">No customers found. Click &quot;+ Add Customer&quot; to create one.</td></tr>
              ) : (
                customers.map((c, i) => {
                  const crStatus = isExpiringSoon(c.crExpiryDate);
                  const contractStatus = isExpiringSoon(c.contractEndDate);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[var(--surface)] transition-colors duration-100 cursor-pointer ${i < customers.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                      onClick={() => handleViewCustomer(c)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-[var(--accent)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.companyName}</p>
                            <p className="text-[11px] font-mono text-[var(--muted)]">{c.accountNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{c.contactPerson}</p>
                        <p className="text-xs text-[var(--muted)]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">{CUSTOMER_TYPES.find(t => t.value === c.customerType)?.label || c.customerType}</span>
                        {c.industryType && <p className="text-[11px] text-[var(--muted)]">{INDUSTRIES.find(i => i.value === c.industryType)?.label}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                        {(crStatus !== 'ok' || contractStatus !== 'ok') && (
                          <div className="mt-1">
                            {crStatus !== 'ok' && <span className={`text-[10px] ${crStatus === 'expired' ? 'text-red-400' : 'text-amber-400'}`}>CR {crStatus === 'expired' ? 'Expired' : 'Expiring'}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">{PAYMENT_TERMS.find(t => t.value === c.paymentTerms)?.label || c.paymentTerms}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">{c._count?.orders || 0}</td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(c)}
                            className="text-xs text-[var(--accent)] hover:opacity-80 px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4" onClick={() => setSelectedCustomer(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedCustomer.companyName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-[var(--muted)]">{selectedCustomer.accountNumber}</span>
                    <span className="text-[var(--border)]">·</span>
                    <StatusBadge status={selectedCustomer.status} />
                    {selectedCustomer.customerType && (
                      <>
                        <span className="text-[var(--border)]">·</span>
                        <span className="text-xs text-[var(--muted)]">{CUSTOMER_TYPES.find(t => t.value === selectedCustomer.customerType)?.label}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { handleEdit(selectedCustomer); }} className="text-sm text-[var(--accent)] font-medium hover:opacity-80 transition-opacity">Edit</button>
                <button onClick={() => setSelectedCustomer(null)} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-lg ml-2">✕</button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Orders</p>
                  <p className="text-lg font-bold tabular-nums">{selectedCustomer._count?.orders || 0}</p>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Payment Terms</p>
                  <p className="text-sm font-medium">{PAYMENT_TERMS.find(t => t.value === selectedCustomer.paymentTerms)?.label}</p>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Credit Limit</p>
                  <p className="text-sm font-medium tabular-nums">{formatCurrency(selectedCustomer.creditLimitSar)}</p>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Industry</p>
                  <p className="text-sm font-medium">{INDUSTRIES.find(i => i.value === selectedCustomer.industryType)?.label || '—'}</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">Contacts</h3>
                  {/* Primary */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span className="font-medium">{selectedCustomer.contactPerson}</span>
                      {selectedCustomer.contactTitle && <span className="text-xs text-[var(--muted)]">({selectedCustomer.contactTitle})</span>}
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] ml-auto">Primary</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-[var(--muted)] shrink-0" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[var(--muted)] shrink-0" />
                      <span>{selectedCustomer.phone}</span>
                      {selectedCustomer.alternatePhone && <span className="text-xs text-[var(--muted)]">/ {selectedCustomer.alternatePhone}</span>}
                    </div>
                    {selectedCustomer.whatsapp && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs">WhatsApp: {selectedCustomer.whatsapp}</span>
                      </div>
                    )}
                    {selectedCustomer.website && (
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-[var(--muted)] shrink-0" />
                        <span className="text-xs text-[var(--accent)]">{selectedCustomer.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Contacts */}
                  {(() => {
                    try {
                      const extra: ContactEntry[] = selectedCustomer.additionalContacts ? JSON.parse(selectedCustomer.additionalContacts) : [];
                      if (!Array.isArray(extra) || extra.length === 0) return null;
                      return (
                        <div className="space-y-3 pt-2">
                          {extra.map((c, i) => (
                            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
                                  <span className="text-sm font-medium">{c.name}</span>
                                  {c.title && <span className="text-xs text-[var(--muted)]">({c.title})</span>}
                                </div>
                                {c.role && <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">{c.role}</span>}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-[var(--muted)] mt-1">
                                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>

                {/* Saudi Registration */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">Saudi Registration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">CR Number</span>
                      <span className="font-mono text-xs">{selectedCustomer.crNumber || '—'}</span>
                    </div>
                    {selectedCustomer.crExpiryDate && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">CR Expiry</span>
                        <span className={`text-xs ${isExpiringSoon(selectedCustomer.crExpiryDate) === 'expired' ? 'text-red-400 font-medium' : isExpiringSoon(selectedCustomer.crExpiryDate) === 'warning' ? 'text-amber-400' : ''}`}>
                          {formatDate(selectedCustomer.crExpiryDate)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">VAT / TRN</span>
                      <span className="font-mono text-xs">{selectedCustomer.vatNumber || '—'}</span>
                    </div>
                    {selectedCustomer.vatTreatment && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">VAT Treatment</span>
                        <span className="text-xs font-medium">{selectedCustomer.vatTreatment}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Zakat Certificate</span>
                      <span className="font-mono text-xs">{selectedCustomer.zakatCertNumber || '—'}</span>
                    </div>
                    {selectedCustomer.nationalAddress && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">National Address</span>
                        <span className="font-mono text-xs">{selectedCustomer.nationalAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-6">
                {(selectedCustomer.billingAddress || selectedCustomer.billingCity) && (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Billing Address
                    </h3>
                    {selectedCustomer.billingAttention && (
                      <p className="text-xs font-medium text-[var(--accent)] mb-1">Attn: {selectedCustomer.billingAttention}</p>
                    )}
                    <p className="text-sm">{selectedCustomer.billingAddress}</p>
                    {selectedCustomer.billingStreet2 && <p className="text-xs text-[var(--muted)]">{selectedCustomer.billingStreet2}</p>}
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {[
                        selectedCustomer.billingDistrict ? `District: ${selectedCustomer.billingDistrict}` : null,
                        selectedCustomer.billingCity,
                        selectedCustomer.billingRegion,
                        selectedCustomer.billingPostalCode,
                        selectedCustomer.billingAdditionalNumber ? `Add. No: ${selectedCustomer.billingAdditionalNumber}` : null,
                        selectedCustomer.billingCountry
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {(selectedCustomer.shippingAddress || selectedCustomer.shippingCity) && (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Shipping Address
                    </h3>
                    <p className="text-sm">{selectedCustomer.shippingAddress}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{[selectedCustomer.shippingCity, selectedCustomer.shippingRegion, selectedCustomer.shippingPostalCode, selectedCustomer.shippingCountry].filter(Boolean).join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Financial & Contract */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">Financial & Ledger</h3>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.paymentTermsLabel && (
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Payment Terms</span><span>{selectedCustomer.paymentTermsLabel}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Credit Limit</span><span className="tabular-nums">{formatCurrency(selectedCustomer.creditLimitSar)}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Opening Balance</span><span className="tabular-nums">{formatCurrency(selectedCustomer.openingBalance)}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Current Balance</span><span className="tabular-nums font-medium">{formatCurrency(selectedCustomer.currentBalanceSar)}</span></div>
                    {selectedCustomer.discountPercent !== null && selectedCustomer.discountPercent !== undefined && selectedCustomer.discountPercent > 0 && (
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Discount</span><span>{selectedCustomer.discountPercent}%</span></div>
                    )}
                    {selectedCustomer.bankName && <div className="flex justify-between"><span className="text-[var(--muted)]">Bank</span><span>{selectedCustomer.bankName}</span></div>}
                    {selectedCustomer.ibanNumber && <div className="flex justify-between"><span className="text-[var(--muted)]">IBAN</span><span className="font-mono text-xs">{selectedCustomer.ibanNumber}</span></div>}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">Contract & Services</h3>
                  <div className="space-y-2 text-sm">
                    {(selectedCustomer.contractStartDate || selectedCustomer.contractEndDate) && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Contract Period</span>
                        <span className="text-xs">{formatDate(selectedCustomer.contractStartDate)} — {formatDate(selectedCustomer.contractEndDate)}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedCustomer.requiresColdChain && <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Cold Chain</span>}
                      {selectedCustomer.requiresHazmat && <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Hazmat</span>}
                      {selectedCustomer.requiresInsuredCargo && <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Insured Cargo</span>}
                    </div>
                    {(selectedCustomer.defaultPickupCity || selectedCustomer.defaultDeliveryCity) && (
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedCustomer.defaultPickupCity || '—'} → {selectedCustomer.defaultDeliveryCity || '—'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account & Notes */}
              {(selectedCustomer.accountManagerName || selectedCustomer.salesRepName || selectedCustomer.notes || selectedCustomer.tags) && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Account Management</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedCustomer.accountManagerName && <div className="flex justify-between"><span className="text-[var(--muted)]">Account Manager</span><span>{selectedCustomer.accountManagerName}</span></div>}
                    {selectedCustomer.salesRepName && <div className="flex justify-between"><span className="text-[var(--muted)]">Sales Rep</span><span>{selectedCustomer.salesRepName}</span></div>}
                    {selectedCustomer.referralSource && <div className="flex justify-between"><span className="text-[var(--muted)]">Referral</span><span>{selectedCustomer.referralSource}</span></div>}
                  </div>
                  {selectedCustomer.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedCustomer.tags.split(',').map(tag => (
                        <span key={tag.trim()} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                  {selectedCustomer.notes && (
                    <p className="text-sm text-[var(--muted)] mt-3 pt-3 border-t border-[var(--border)]">{selectedCustomer.notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
