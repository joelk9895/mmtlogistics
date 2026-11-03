'use client';

import { useState, useEffect } from 'react';
import { Truck, Car, Bus, Tractor, Forklift, Train, Package, Box, Container, Snowflake, Thermometer, Fuel, Droplets, Zap, Wind, Flame, Wrench, Settings, Pickaxe, Construction, HardHat, Briefcase, Shield, ShieldAlert, Anchor, ArrowDownToLine, MapPin } from 'lucide-react';

const ICONS_MAP: Record<string, React.ElementType> = {
  Truck, Car, Bus, Tractor, Forklift, Train,
  Package, Box, Container, Snowflake, Thermometer,
  Fuel, Droplets, Zap, Wind, Flame,
  Wrench, Settings, Pickaxe, Construction, HardHat,
  Briefcase, Shield, ShieldAlert, Anchor, ArrowDownToLine, MapPin
};

// ── Types ──────────────────────────────────────────────────

type VehicleCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  isDefault: boolean;
  vehicleClass: string | null;
  bodyType: string | null;
  primaryUse: string | null;
  minPayloadTons: number | null;
  maxPayloadTons: number | null;
  maxGvwKg: number | null;
  palletCapacity: number | null;
  volumeCapacityM3: number | null;
  typicalLengthM: number | null;
  typicalWidthM: number | null;
  typicalHeightM: number | null;
  maxHeightM: number | null;
  maxLengthM: number | null;
  axleConfig: string | null;
  minAxles: number | null;
  maxAxles: number | null;
  typicalWheelCount: number | null;
  defaultFuelType: string | null;
  minEnginePowerHp: number | null;
  maxEnginePowerHp: number | null;
  transmissionTypes: string | null;
  requiresTgaCard: boolean;
  requiresWasel: boolean;
  requiresSpeedLimiter: boolean;
  defaultSpeedLimitKmh: number | null;
  minDriverLicenseType: string | null;
  requiresHazmatCert: boolean;
  requiresMvpiFrequency: string | null;
  temperatureControlled: boolean;
  minTempCelsius: number | null;
  maxTempCelsius: number | null;
  adrClass: string | null;
  canCarryHazmat: boolean;
  canCarryLivestock: boolean;
  canCarryOversized: boolean;
  requiresCrane: boolean;
  requiresTailLift: boolean;
  estimatedDailyRateSar: number | null;
  typicalServiceIntervalKm: number | null;
  typicalServiceIntervalDays: number | null;
  estimatedFuelConsumption: number | null;
  tireSizeSpec: string | null;
  numberOfTires: number | null;
  insuranceCategory: string | null;
  defaultInsuranceType: string | null;
  sortOrder: number;
  colorHex: string | null;
  isActive: boolean;
  vehicleCount?: number;
  createdAt: string;
  updatedAt: string;
};

// ── Constants ──

const TABS = ['General', 'Capacity & Dimensions', 'Engine & Axle', 'Saudi Regulatory', 'Operational', 'Cost & Maintenance'] as const;
type Tab = typeof TABS[number];

const VEHICLE_CLASSES = [
  { value: 'LIGHT', label: 'Light (< 3.5t)' },
  { value: 'MEDIUM', label: 'Medium (3.5t – 12t)' },
  { value: 'HEAVY', label: 'Heavy (12t – 40t)' },
  { value: 'SUPER_HEAVY', label: 'Super Heavy (> 40t)' },
  { value: 'EQUIPMENT', label: 'Equipment / Machinery' },
];

const BODY_TYPES = [
  // Road vehicles
  'BOX', 'FLATBED', 'TANKER', 'REFRIGERATED', 'CURTAINSIDE',
  'LOWBED', 'TIPPER', 'CHASSIS', 'VAN', 'PICKUP',
  // Specialized road
  'CAR_CARRIER', 'CEMENT_MIXER', 'HOOK_LIFT', 'SKIP_LOADER',
  // Heavy equipment & machinery
  'CRANE', 'MOBILE_CRANE', 'TOWER_CRANE',
  'FORKLIFT', 'REACH_STACKER', 'TELEHANDLER',
  'EXCAVATOR', 'BACKHOE', 'WHEEL_LOADER', 'SKID_STEER',
  'BULLDOZER', 'GRADER', 'COMPACTOR', 'ROLLER',
  'BOOM_LIFT', 'SCISSOR_LIFT', 'AERIAL_PLATFORM',
  'GENERATOR', 'COMPRESSOR', 'WATER_TANKER',
  'OTHER',
];

const BODY_TYPE_LABELS: Record<string, string> = {
  BOX: 'Box Body', FLATBED: 'Flatbed', TANKER: 'Tanker', REFRIGERATED: 'Refrigerated (Reefer)',
  CURTAINSIDE: 'Curtainside', LOWBED: 'Lowbed', TIPPER: 'Tipper / Dump', CHASSIS: 'Chassis Cab',
  VAN: 'Van', PICKUP: 'Pickup', CAR_CARRIER: 'Car Carrier', CEMENT_MIXER: 'Cement Mixer',
  HOOK_LIFT: 'Hook Lift', SKIP_LOADER: 'Skip Loader',
  CRANE: 'Crane', MOBILE_CRANE: 'Mobile Crane', TOWER_CRANE: 'Tower Crane',
  FORKLIFT: 'Forklift', REACH_STACKER: 'Reach Stacker', TELEHANDLER: 'Telehandler',
  EXCAVATOR: 'Excavator', BACKHOE: 'Backhoe Loader', WHEEL_LOADER: 'Wheel Loader',
  SKID_STEER: 'Skid Steer', BULLDOZER: 'Bulldozer', GRADER: 'Motor Grader',
  COMPACTOR: 'Compactor', ROLLER: 'Road Roller',
  BOOM_LIFT: 'Boom Lift', SCISSOR_LIFT: 'Scissor Lift', AERIAL_PLATFORM: 'Aerial Work Platform',
  GENERATOR: 'Generator', COMPRESSOR: 'Air Compressor', WATER_TANKER: 'Water Tanker',
  OTHER: 'Other',
};

const PRIMARY_USES = [
  { value: 'FREIGHT', label: 'Freight / Cargo' },
  { value: 'PASSENGER', label: 'Passenger' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'MATERIAL_HANDLING', label: 'Material Handling / Warehouse' },
  { value: 'LIFTING', label: 'Lifting / Hoisting' },
  { value: 'EARTHMOVING', label: 'Earthmoving' },
  { value: 'SPECIALIZED', label: 'Specialized' },
  { value: 'SUPPORT', label: 'Support / Utility' },
];

const FUEL_TYPES = [
  'DIESEL', 'PETROL', 'ELECTRIC', 'CNG', 'LPG', 'HYBRID',
];

const LICENSE_TYPES = [
  { value: 'PRIVATE', label: 'Private (Light)' },
  { value: 'PUBLIC_LIGHT', label: 'Public Light' },
  { value: 'PUBLIC_HEAVY', label: 'Public Heavy' },
  { value: 'HEAVY_EQUIPMENT', label: 'Heavy Equipment' },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'EQUIPMENT_OPERATOR', label: 'Equipment Operator Cert.' },
];

const INSURANCE_TYPES = [
  { value: 'COMPREHENSIVE', label: 'Comprehensive' },
  { value: 'THIRD_PARTY', label: 'Third Party' },
  { value: 'AGAINST_OTHERS', label: 'Against Others' },
  { value: 'EQUIPMENT_ALL_RISK', label: 'Equipment All Risk' },
];

const AXLE_CONFIGS = [
  '4x2', '4x4', '6x2', '6x4', '6x6', '8x4', '8x6', '8x8', '10x4',
  'TRACKED', 'N/A',
];

const TYPE_ICONS = Object.keys(ICONS_MAP);

const CLASS_COLORS: Record<string, string> = {
  LIGHT: '#22c55e',
  MEDIUM: '#3b82f6',
  HEAVY: '#f59e0b',
  SUPER_HEAVY: '#ef4444',
  EQUIPMENT: '#a855f7',
};

// ── Preset Templates ── (common vehicle types in Gulf region logistics)

type Preset = Partial<typeof initialForm> & { name: string };

const PRESET_TEMPLATES: Preset[] = [
  {
    name: 'Reefer / Frozen Dyna',
    slug: 'REEFER_FROZEN_DYNA',
    icon: 'Snowflake',
    description: 'Toyota Dyna fitted with refrigerated / frozen box body. Used for cold-chain last-mile delivery.',
    vehicleClass: 'LIGHT',
    bodyType: 'REFRIGERATED',
    primaryUse: 'FREIGHT',
    maxPayloadTons: '1.5',
    typicalLengthM: '5.5',
    typicalWidthM: '1.9',
    typicalHeightM: '2.2',
    axleConfig: '4x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '90',
    maxEnginePowerHp: '130',
    requiresWasel: false,
    requiresSpeedLimiter: false,
    defaultSpeedLimitKmh: '120',
    minDriverLicenseType: 'PRIVATE',
    temperatureControlled: true,
    minTempCelsius: '-25',
    maxTempCelsius: '4',
    colorHex: '#3b82f6',
    sortOrder: '10',
    isActive: true,
  },
  {
    name: 'Box Dyna',
    slug: 'BOX_DYNA',
    icon: 'Package',
    description: 'Toyota Dyna with enclosed box body. Standard light delivery truck for general cargo.',
    vehicleClass: 'LIGHT',
    bodyType: 'BOX',
    primaryUse: 'FREIGHT',
    maxPayloadTons: '1.5',
    typicalLengthM: '5.5',
    typicalWidthM: '1.9',
    typicalHeightM: '2.2',
    axleConfig: '4x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '90',
    maxEnginePowerHp: '130',
    defaultSpeedLimitKmh: '120',
    minDriverLicenseType: 'PRIVATE',
    colorHex: '#22c55e',
    sortOrder: '20',
    isActive: true,
  },
  {
    name: 'Open Dyna',
    slug: 'OPEN_DYNA',
    icon: 'Truck',
    description: 'Toyota Dyna with open flatbed body. Used for general freight, building materials, and oversized items.',
    vehicleClass: 'LIGHT',
    bodyType: 'FLATBED',
    primaryUse: 'FREIGHT',
    maxPayloadTons: '1.5',
    typicalLengthM: '5.0',
    typicalWidthM: '1.9',
    axleConfig: '4x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '90',
    maxEnginePowerHp: '130',
    defaultSpeedLimitKmh: '120',
    minDriverLicenseType: 'PRIVATE',
    colorHex: '#f59e0b',
    sortOrder: '30',
    isActive: true,
  },
  {
    name: '6 Meter Dyna',
    slug: 'SIX_METER_DYNA',
    icon: 'Truck',
    description: 'Toyota Dyna extended wheelbase, 6-metre cargo deck. Handles bulkier light-freight loads.',
    vehicleClass: 'LIGHT',
    bodyType: 'FLATBED',
    primaryUse: 'FREIGHT',
    maxPayloadTons: '2',
    typicalLengthM: '6.0',
    typicalWidthM: '1.9',
    axleConfig: '4x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '100',
    maxEnginePowerHp: '140',
    defaultSpeedLimitKmh: '120',
    minDriverLicenseType: 'PRIVATE',
    colorHex: '#8b5cf6',
    sortOrder: '40',
    isActive: true,
  },
  {
    name: 'Reefer / Frozen Lorry',
    slug: 'REEFER_FROZEN_LORRY',
    icon: 'Snowflake',
    description: 'Medium to heavy refrigerated lorry for cold-chain distribution. Covers regional and inter-city routes.',
    vehicleClass: 'MEDIUM',
    bodyType: 'REFRIGERATED',
    primaryUse: 'FREIGHT',
    minPayloadTons: '3',
    maxPayloadTons: '8',
    typicalLengthM: '8.0',
    typicalWidthM: '2.4',
    typicalHeightM: '3.5',
    axleConfig: '4x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '150',
    maxEnginePowerHp: '250',
    requiresTgaCard: true,
    requiresWasel: true,
    requiresSpeedLimiter: true,
    defaultSpeedLimitKmh: '90',
    minDriverLicenseType: 'HEAVY_EQUIPMENT',
    requiresMvpiFrequency: 'ANNUAL',
    temperatureControlled: true,
    minTempCelsius: '-25',
    maxTempCelsius: '4',
    colorHex: '#06b6d4',
    sortOrder: '50',
    isActive: true,
  },
  {
    name: 'FSR Lorry',
    slug: 'FSR_LORRY',
    icon: 'Truck',
    description: 'Isuzu FSR medium lorry. Workhorse for urban and regional freight delivery in KSA.',
    vehicleClass: 'MEDIUM',
    bodyType: 'BOX',
    primaryUse: 'FREIGHT',
    minPayloadTons: '3',
    maxPayloadTons: '6',
    typicalLengthM: '7.5',
    typicalWidthM: '2.3',
    typicalHeightM: '3.2',
    axleConfig: '4x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '165',
    maxEnginePowerHp: '215',
    requiresTgaCard: true,
    requiresWasel: true,
    requiresSpeedLimiter: true,
    defaultSpeedLimitKmh: '90',
    minDriverLicenseType: 'HEAVY_EQUIPMENT',
    requiresMvpiFrequency: 'ANNUAL',
    colorHex: '#f97316',
    sortOrder: '60',
    isActive: true,
  },
  {
    name: 'FTR Lorry',
    slug: 'FTR_LORRY',
    icon: 'Truck',
    description: 'Isuzu FTR forward-tilt-cab lorry. Heavier capacity step up from FSR, suited for trunk routes.',
    vehicleClass: 'HEAVY',
    bodyType: 'FLATBED',
    primaryUse: 'FREIGHT',
    minPayloadTons: '6',
    maxPayloadTons: '12',
    typicalLengthM: '9.0',
    typicalWidthM: '2.4',
    typicalHeightM: '3.5',
    axleConfig: '6x2',
    defaultFuelType: 'DIESEL',
    minEnginePowerHp: '215',
    maxEnginePowerHp: '280',
    requiresTgaCard: true,
    requiresWasel: true,
    requiresSpeedLimiter: true,
    defaultSpeedLimitKmh: '90',
    minDriverLicenseType: 'HEAVY_EQUIPMENT',
    requiresMvpiFrequency: 'ANNUAL',
    colorHex: '#ef4444',
    sortOrder: '70',
    isActive: true,
  },
];

// ── Initial Form ──

const initialForm = {
  name: '', description: '', icon: 'Truck', slug: '',
  vehicleClass: '', bodyType: '', primaryUse: '',
  minPayloadTons: '', maxPayloadTons: '', maxGvwKg: '',
  palletCapacity: '', volumeCapacityM3: '',
  typicalLengthM: '', typicalWidthM: '', typicalHeightM: '',
  maxHeightM: '', maxLengthM: '',
  axleConfig: '', minAxles: '', maxAxles: '', typicalWheelCount: '',
  defaultFuelType: '', minEnginePowerHp: '', maxEnginePowerHp: '',
  transmissionTypes: '',
  requiresTgaCard: false, requiresWasel: false, requiresSpeedLimiter: false,
  defaultSpeedLimitKmh: '', minDriverLicenseType: '',
  requiresHazmatCert: false, requiresMvpiFrequency: '',
  temperatureControlled: false, minTempCelsius: '', maxTempCelsius: '',
  adrClass: '', canCarryHazmat: false, canCarryLivestock: false,
  canCarryOversized: false, requiresCrane: false, requiresTailLift: false,
  estimatedDailyRateSar: '', typicalServiceIntervalKm: '',
  typicalServiceIntervalDays: '', estimatedFuelConsumption: '',
  tireSizeSpec: '', numberOfTires: '',
  insuranceCategory: '', defaultInsuranceType: '',
  sortOrder: '0', colorHex: '', isActive: true,
};

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
const selectClass = inputClass;

function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group py-1">
      <div className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-[var(--border)] rounded-full peer-checked:bg-[var(--accent)] transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
      </div>
      <div>
        <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{label}</span>
        {description && <p className="text-[11px] text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color: color || 'var(--muted)',
        backgroundColor: color ? `${color}15` : 'var(--surface)',
        borderColor: color ? `${color}30` : 'var(--border)',
        borderWidth: '1px',
      }}
    >
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Main Page ──
// ══════════════════════════════════════════════════════════════

export default function VehicleTypesPage() {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<typeof initialForm>({ ...initialForm });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/vehicles/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value ?? '' }));

  const sanitizeForEdit = (cat: VehicleCategory) => {
    const sanitized = { ...initialForm };
    for (const key of Object.keys(initialForm) as (keyof typeof initialForm)[]) {
      const val = (cat as any)[key];
      if (val !== null && val !== undefined) {
        if (typeof initialForm[key] === 'boolean') {
          (sanitized as any)[key] = Boolean(val);
        } else {
          (sanitized as any)[key] = String(val);
        }
      }
    }
    return sanitized;
  };

  const handleEdit = (cat: VehicleCategory) => {
    setEditingId(cat.id);
    setFormData(sanitizeForEdit(cat));
    setIsFormOpen(true);
    setActiveTab('General');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (cat: VehicleCategory) => {
    try {
      const res = await fetch(`/api/vehicles/categories/${cat.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingId(null);
        setIsFormOpen(false);
        setFormData({ ...initialForm });
        setDeleteConfirm(null);
        fetchCategories();
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
      const url = editingId ? `/api/vehicles/categories/${editingId}` : '/api/vehicles/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ ...initialForm });
        setEditingId(null);
        setIsFormOpen(false);
        setActiveTab('General');
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save vehicle type');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter
  const filtered = categories.filter(cat => {
    if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase()) && !cat.slug.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterClass && cat.vehicleClass !== filterClass) return false;
    return true;
  });

  // Group by class
  const grouped: Record<string, VehicleCategory[]> = {};
  for (const cat of filtered) {
    const cls = cat.vehicleClass || 'UNCLASSIFIED';
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(cat);
  }
  const classOrder = ['LIGHT', 'MEDIUM', 'HEAVY', 'SUPER_HEAVY', 'EQUIPMENT', 'UNCLASSIFIED'];
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => classOrder.indexOf(a) - classOrder.indexOf(b));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Vehicle Types</h1>
          <p className="text-sm text-[var(--muted)]">{categories.length} type{categories.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => {
            if (isFormOpen) {
              setIsFormOpen(false);
              setEditingId(null);
              setFormData({ ...initialForm });
            } else {
              setIsFormOpen(true);
              setActiveTab('General');
              setError('');
              setEditingId(null);
              setFormData({ ...initialForm });
            }
          }}
          className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${
            isFormOpen ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]' : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          }`}
        >
          {isFormOpen ? 'Cancel' : 'Create Type'}
        </button>
      </div>

      {/* ── Creation / Edit Form ── */}
      {isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] mb-8 overflow-hidden">

          {/* ── Preset Templates ── */}
          {!editingId && (
            <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]/50">
              <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2.5">Quick Presets — click to pre-fill the form</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_TEMPLATES.map(preset => {
                  const color = CLASS_COLORS[preset.vehicleClass as string || ''] || 'var(--accent)';
                  return (
                    <button
                      key={preset.slug}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, ...preset, isActive: true }));
                        setActiveTab('General');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 hover:shadow-md"
                      style={{
                        backgroundColor: `${color}12`,
                        border: `1px solid ${color}30`,
                        color,
                      }}
                    >
                      <span className="opacity-80">
                        {(() => {
                          const IconComp = ICONS_MAP[preset.icon || 'Truck'] || ICONS_MAP.Truck;
                          return <IconComp className="w-4 h-4" />;
                        })()}
                      </span>
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)] overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--accent)] -mb-px'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2 rounded-md bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-sm text-[var(--destructive)]">
                {error}
              </div>
            )}

            {/* ── General Tab ── */}
            {activeTab === 'General' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Type Name" required hint="e.g. Articulated Truck, Reefer Trailer">
                    <input required className={inputClass} value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Rigid Truck" />
                  </Field>
                  <Field label="Slug" hint="Auto-generated from name if empty">
                    <input className={inputClass} value={formData.slug} onChange={e => set('slug', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))} placeholder="RIGID_TRUCK" />
                  </Field>
                  <Field label="Icon">
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-md max-h-[140px] overflow-y-auto">
                      {TYPE_ICONS.map(ic => {
                        const IconComp = ICONS_MAP[ic];
                        return (
                          <button key={ic} type="button" onClick={() => set('icon', ic)} title={ic}
                            className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-all ${formData.icon === ic ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)] scale-110 text-[var(--accent)]' : 'hover:bg-[var(--border)] text-[var(--muted)]'}`}
                          >
                            <IconComp className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                <Field label="Description" hint="Brief description of this vehicle type">
                  <textarea className={inputClass + ' min-h-[80px] resize-y'} value={formData.description} onChange={e => set('description', e.target.value)} placeholder="A rigid-frame truck typically used for local and regional freight delivery..." />
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Vehicle Class" required>
                    <select className={selectClass} value={formData.vehicleClass} onChange={e => set('vehicleClass', e.target.value)}>
                      <option value="">Select class</option>
                      {VEHICLE_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Body Type">
                    <select className={selectClass} value={formData.bodyType} onChange={e => set('bodyType', e.target.value)}>
                      <option value="">Select body type</option>
                      {BODY_TYPES.map(b => <option key={b} value={b}>{BODY_TYPE_LABELS[b] || b}</option>)}
                    </select>
                  </Field>
                  <Field label="Primary Use">
                    <select className={selectClass} value={formData.primaryUse} onChange={e => set('primaryUse', e.target.value)}>
                      <option value="">Select use</option>
                      {PRIMARY_USES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Brand Color" hint="Used in UI cards and charts">
                    <div className="flex gap-2 items-center">
                      <input type="color" value={formData.colorHex || '#6366f1'} onChange={e => set('colorHex', e.target.value)} className="w-10 h-9 rounded border border-[var(--border)] cursor-pointer bg-transparent" />
                      <input className={inputClass} value={formData.colorHex} onChange={e => set('colorHex', e.target.value)} placeholder="#6366f1" />
                    </div>
                  </Field>
                  <Field label="Sort Order" hint="Lower = shown first">
                    <input type="number" className={inputClass} value={formData.sortOrder} onChange={e => set('sortOrder', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="Status">
                    <Toggle label={formData.isActive ? 'Active' : 'Disabled'} checked={formData.isActive as boolean} onChange={v => set('isActive', v)} description="Disabled types can't be assigned to new vehicles" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Capacity & Dimensions Tab ── */}
            {activeTab === 'Capacity & Dimensions' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Payload & Capacity</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Min Payload (tons)">
                    <input type="number" step="0.1" className={inputClass} value={formData.minPayloadTons} onChange={e => set('minPayloadTons', e.target.value)} placeholder="1" />
                  </Field>
                  <Field label="Max Payload (tons)">
                    <input type="number" step="0.1" className={inputClass} value={formData.maxPayloadTons} onChange={e => set('maxPayloadTons', e.target.value)} placeholder="12" />
                  </Field>
                  <Field label="Max GVW (kg)">
                    <input type="number" className={inputClass} value={formData.maxGvwKg} onChange={e => set('maxGvwKg', e.target.value)} placeholder="16000" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Pallet Capacity" hint="Standard EUR/GCC pallets">
                    <input type="number" className={inputClass} value={formData.palletCapacity} onChange={e => set('palletCapacity', e.target.value)} placeholder="12" />
                  </Field>
                  <Field label="Volume (m³)" hint="Cargo volume capacity">
                    <input type="number" step="0.1" className={inputClass} value={formData.volumeCapacityM3} onChange={e => set('volumeCapacityM3', e.target.value)} placeholder="40" />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Dimensions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Typical Length (m)">
                    <input type="number" step="0.01" className={inputClass} value={formData.typicalLengthM} onChange={e => set('typicalLengthM', e.target.value)} placeholder="12.0" />
                  </Field>
                  <Field label="Typical Width (m)">
                    <input type="number" step="0.01" className={inputClass} value={formData.typicalWidthM} onChange={e => set('typicalWidthM', e.target.value)} placeholder="2.5" />
                  </Field>
                  <Field label="Typical Height (m)">
                    <input type="number" step="0.01" className={inputClass} value={formData.typicalHeightM} onChange={e => set('typicalHeightM', e.target.value)} placeholder="3.8" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Max Height (KSA)" hint="KSA general limit: 4.8m">
                    <input type="number" step="0.01" className={inputClass} value={formData.maxHeightM} onChange={e => set('maxHeightM', e.target.value)} placeholder="4.8" />
                  </Field>
                  <Field label="Max Length (KSA)" hint="Saudi road law limit">
                    <input type="number" step="0.01" className={inputClass} value={formData.maxLengthM} onChange={e => set('maxLengthM', e.target.value)} placeholder="18.0" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Engine & Axle Tab ── */}
            {activeTab === 'Engine & Axle' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Axle & Wheel Configuration</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Axle Config">
                    <select className={selectClass} value={formData.axleConfig} onChange={e => set('axleConfig', e.target.value)}>
                      <option value="">Select</option>
                      {AXLE_CONFIGS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                  <Field label="Min Axles">
                    <input type="number" className={inputClass} value={formData.minAxles} onChange={e => set('minAxles', e.target.value)} placeholder="2" />
                  </Field>
                  <Field label="Max Axles">
                    <input type="number" className={inputClass} value={formData.maxAxles} onChange={e => set('maxAxles', e.target.value)} placeholder="5" />
                  </Field>
                  <Field label="Wheel Count">
                    <input type="number" className={inputClass} value={formData.typicalWheelCount} onChange={e => set('typicalWheelCount', e.target.value)} placeholder="6" />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Engine & Fuel</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Default Fuel Type">
                    <select className={selectClass} value={formData.defaultFuelType} onChange={e => set('defaultFuelType', e.target.value)}>
                      <option value="">Select</option>
                      {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Min Engine Power (HP)">
                    <input type="number" className={inputClass} value={formData.minEnginePowerHp} onChange={e => set('minEnginePowerHp', e.target.value)} placeholder="150" />
                  </Field>
                  <Field label="Max Engine Power (HP)">
                    <input type="number" className={inputClass} value={formData.maxEnginePowerHp} onChange={e => set('maxEnginePowerHp', e.target.value)} placeholder="450" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Transmission Types" hint="Comma-separated: MANUAL, AUTOMATIC, AMT">
                    <input className={inputClass} value={formData.transmissionTypes} onChange={e => set('transmissionTypes', e.target.value)} placeholder="MANUAL,AUTOMATIC" />
                  </Field>
                  <Field label="Fuel Consumption" hint="L/100km typical">
                    <input type="number" step="0.1" className={inputClass} value={formData.estimatedFuelConsumption} onChange={e => set('estimatedFuelConsumption', e.target.value)} placeholder="25" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Saudi Regulatory Tab ── */}
            {activeTab === 'Saudi Regulatory' && (
              <div className="space-y-5">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 mb-2">
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Configure Saudi-specific regulatory requirements for this vehicle type. These settings determine compliance checks, 
                    mandatory equipment, and driver qualification requirements per TGA / MOT / Muroor regulations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Equipment & Tracking</h3>
                    <Toggle label="TGA Operation Card" checked={formData.requiresTgaCard as boolean} onChange={v => set('requiresTgaCard', v)} description="Transport General Authority commercial operation card" />
                    <Toggle label="WASEL GPS Tracking" checked={formData.requiresWasel as boolean} onChange={v => set('requiresWasel', v)} description="MOT WASEL platform GPS tracking mandatory" />
                    <Toggle label="Speed Limiter" checked={formData.requiresSpeedLimiter as boolean} onChange={v => set('requiresSpeedLimiter', v)} description="Speed limiter device must be installed" />
                    <Toggle label="Hazmat Certification" checked={formData.requiresHazmatCert as boolean} onChange={v => set('requiresHazmatCert', v)} description="Driver must hold valid hazmat certification" />
                  </div>
                  <div className="space-y-4">
                    <Field label="Default Speed Limit (km/h)" hint="KSA road speed limit for this type">
                      <input type="number" className={inputClass} value={formData.defaultSpeedLimitKmh} onChange={e => set('defaultSpeedLimitKmh', e.target.value)} placeholder="90" />
                    </Field>
                    <Field label="Minimum Driver License" hint="Saudi Muroor license category">
                      <select className={selectClass} value={formData.minDriverLicenseType} onChange={e => set('minDriverLicenseType', e.target.value)}>
                        <option value="">Select license type</option>
                        {LICENSE_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </Field>
                    <Field label="MVPI Inspection Frequency" hint="Motor Vehicle Periodic Inspection">
                      <select className={selectClass} value={formData.requiresMvpiFrequency} onChange={e => set('requiresMvpiFrequency', e.target.value)}>
                        <option value="">Select</option>
                        <option value="ANNUAL">Annual</option>
                        <option value="BIANNUAL">Biannual (every 6 months)</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ── Operational Tab ── */}
            {activeTab === 'Operational' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Temperature Control</h3>
                <Toggle label="Temperature Controlled" checked={formData.temperatureControlled as boolean} onChange={v => set('temperatureControlled', v)} description="Reefer / cold chain vehicle" />
                {formData.temperatureControlled && (
                  <div className="grid grid-cols-2 gap-4 pl-12">
                    <Field label="Min Temp (°C)">
                      <input type="number" step="0.1" className={inputClass} value={formData.minTempCelsius} onChange={e => set('minTempCelsius', e.target.value)} placeholder="-25" />
                    </Field>
                    <Field label="Max Temp (°C)">
                      <input type="number" step="0.1" className={inputClass} value={formData.maxTempCelsius} onChange={e => set('maxTempCelsius', e.target.value)} placeholder="25" />
                    </Field>
                  </div>
                )}

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Cargo Capabilities</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <Toggle label="Hazmat Capable" checked={formData.canCarryHazmat as boolean} onChange={v => set('canCarryHazmat', v)} description="Can transport dangerous goods" />
                  <Toggle label="Livestock Transport" checked={formData.canCarryLivestock as boolean} onChange={v => set('canCarryLivestock', v)} description="Equipped for live animal transport" />
                  <Toggle label="Oversized Cargo" checked={formData.canCarryOversized as boolean} onChange={v => set('canCarryOversized', v)} description="Can carry oversized / out-of-gauge loads" />
                  <Toggle label="Onboard Crane" checked={formData.requiresCrane as boolean} onChange={v => set('requiresCrane', v)} description="Has or requires mounted crane (HIAB)" />
                  <Toggle label="Tail Lift" checked={formData.requiresTailLift as boolean} onChange={v => set('requiresTailLift', v)} description="Has or requires hydraulic tail lift" />
                </div>

                {formData.canCarryHazmat && (
                  <div className="grid grid-cols-2 gap-4 pl-12 pt-2">
                    <Field label="ADR / Dangerous Goods Class" hint="e.g. Class 3 (Flammable Liquids)">
                      <input className={inputClass} value={formData.adrClass} onChange={e => set('adrClass', e.target.value)} placeholder="Class 3" />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* ── Cost & Maintenance Tab ── */}
            {activeTab === 'Cost & Maintenance' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Cost Defaults</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Est. Daily Rate (SAR)" hint="Default daily operational/rental rate">
                    <input type="number" step="0.01" className={inputClass} value={formData.estimatedDailyRateSar} onChange={e => set('estimatedDailyRateSar', e.target.value)} placeholder="500" />
                  </Field>
                  <Field label="Insurance Category" hint="Insurance tier classification">
                    <input className={inputClass} value={formData.insuranceCategory} onChange={e => set('insuranceCategory', e.target.value)} placeholder="e.g. Heavy Commercial" />
                  </Field>
                  <Field label="Default Insurance Type">
                    <select className={selectClass} value={formData.defaultInsuranceType} onChange={e => set('defaultInsuranceType', e.target.value)}>
                      <option value="">Select</option>
                      {INSURANCE_TYPES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Maintenance Defaults</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Service Interval (km)">
                    <input type="number" className={inputClass} value={formData.typicalServiceIntervalKm} onChange={e => set('typicalServiceIntervalKm', e.target.value)} placeholder="15000" />
                  </Field>
                  <Field label="Service Interval (days)">
                    <input type="number" className={inputClass} value={formData.typicalServiceIntervalDays} onChange={e => set('typicalServiceIntervalDays', e.target.value)} placeholder="90" />
                  </Field>
                  <Field label="Fuel Consumption (L/100km)">
                    <input type="number" step="0.1" className={inputClass} value={formData.estimatedFuelConsumption} onChange={e => set('estimatedFuelConsumption', e.target.value)} placeholder="30" />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Tire Specification</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Tire Size Spec" hint="Standard tire specification">
                    <input className={inputClass} value={formData.tireSizeSpec} onChange={e => set('tireSizeSpec', e.target.value)} placeholder="315/80R22.5" />
                  </Field>
                  <Field label="Number of Tires">
                    <input type="number" className={inputClass} value={formData.numberOfTires} onChange={e => set('numberOfTires', e.target.value)} placeholder="6" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Form Actions ── */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border)]">
              <div className="flex gap-1">
                {TABS.map((tab, i) => (
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
                      const cat = categories.find(c => c.id === editingId);
                      if (!cat) return;
                      if (cat.isDefault) {
                        alert('Cannot delete a default category');
                        return;
                      }
                      if (deleteConfirm === editingId) {
                        handleDelete(cat);
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
                    {submitting ? 'Saving...' : editingId ? 'Update Vehicle Type' : 'Create Vehicle Type'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">⌕</span>
          <input
            className={inputClass + ' pl-8'}
            placeholder="Search types..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select className={selectClass + ' w-44'} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {VEHICLE_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <span className="text-xs text-[var(--muted)]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div className="text-center py-20 text-[var(--muted)] text-sm">Loading vehicle types...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-[var(--muted)] text-sm mb-2">{searchQuery || filterClass ? 'No matching vehicle types' : 'No vehicle types configured yet'}</p>
          <button onClick={() => { setIsFormOpen(true); setActiveTab('General'); }} className="text-sm text-[var(--accent)] hover:underline">Create your first type →</button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroupKeys.map(cls => {
            const classLabel = VEHICLE_CLASSES.find(c => c.value === cls)?.label || 'Unclassified';
            const color = CLASS_COLORS[cls] || 'var(--muted)';
            return (
              <div key={cls}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{classLabel}</h2>
                  <span className="text-[11px] text-[var(--muted)]">({grouped[cls].length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[cls].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleEdit(cat)}
                      className="text-left bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ backgroundColor: `${cat.colorHex || color}15`, border: `1px solid ${cat.colorHex || color}30`, color: cat.colorHex || color }}
                          >
                            {(() => {
                              const IconComp = ICONS_MAP[cat.icon || 'Truck'] || ICONS_MAP.Truck;
                              return <IconComp className="w-5 h-5" />;
                            })()}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold group-hover:text-[var(--accent)] transition-colors">{cat.name}</h3>
                            <p className="text-[11px] text-[var(--muted)] font-mono">{cat.slug}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {!cat.isActive && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--destructive)] bg-[var(--destructive)]/10 px-1.5 py-0.5 rounded">Off</span>
                          )}
                          {cat.isDefault && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">System</span>
                          )}
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-[var(--muted)] mb-3 line-clamp-2 leading-relaxed">{cat.description}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
                        {cat.maxPayloadTons && <span>⚖ {cat.maxPayloadTons}t</span>}
                        {cat.axleConfig && <span>⊞ {cat.axleConfig}</span>}
                        {cat.defaultFuelType && <span>⛽ {cat.defaultFuelType}</span>}
                        {cat.defaultSpeedLimitKmh && <span>◎ {cat.defaultSpeedLimitKmh} km/h</span>}
                        {cat.temperatureControlled && <span>❄️ Reefer</span>}
                        {cat.requiresTgaCard && <span>📋 TGA</span>}
                        {cat.requiresWasel && <span>📡 WASEL</span>}
                        {cat.canCarryHazmat && <span>☣ Hazmat</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
