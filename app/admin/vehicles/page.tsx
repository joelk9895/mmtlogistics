'use client';

import { useState, useEffect, Fragment } from 'react';

// ── Types ──────────────────────────────────────────────────

type VehicleCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  isDefault: boolean;
};

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  status?: string;
  leaves?: { id: string; startDate: string; endDate: string; reason: string; status?: string }[];
};

type MaintenanceRecord = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  scheduledDate: string | null;
  startDate: string | null;
  completedDate: string | null;
  odometerAtService: number | null;
  laborCostSar: number | null;
  partsCostSar: number | null;
  totalCostSar: number | null;
  vendor: string | null;
  invoiceNumber: string | null;
  warrantyUntil: string | null;
  partsReplaced: string | null;
  notes: string | null;
  createdAt: string;
};

type FuelLog = {
  id: string;
  date: string;
  fuelType: string;
  liters: number;
  costPerLiter: number | null;
  totalCostSar: number | null;
  odometerKm: number | null;
  station: string | null;
  driverName: string | null;
  fullTank: boolean;
  notes: string | null;
  createdAt: string;
};

type VehicleDocument = {
  id: string;
  documentType: string;
  title: string;
  fileUrl: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  issuedBy: string | null;
  referenceNo: string | null;
  notes: string | null;
  createdAt: string;
};

type VehicleInspection = {
  id: string;
  inspectionType: string;
  inspectedBy: string | null;
  date: string;
  overallResult: string;
  failReasons: string | null;
  odometerKm: number | null;
  notes: string | null;
  createdAt: string;
};

type Vehicle = {
  id: string;
  fleetNumber: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  vehicleType: string;
  status: string;
  photoUrl: string | null;
  licensePlate: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  istimaraNumber: string | null;
  istimaraExpiry: string | null;
  registrationCity: string | null;
  capacity: number;
  grossVehicleWeight: number | null;
  netWeight: number | null;
  numberOfAxles: number | null;
  lengthMeters: number | null;
  widthMeters: number | null;
  heightMeters: number | null;
  fuelType: string;
  tankCapacityLiters: number | null;
  engineCapacityCC: number | null;
  transmissionType: string | null;
  horsePower: number | null;
  tgaOperationCardNumber: string | null;
  tgaOperationCardExpiry: string | null;
  waselTrackerId: string | null;
  waselConnected: boolean;
  speedLimiterInstalled: boolean;
  speedLimitKmh: number | null;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  insuranceType: string | null;
  insuranceStartDate: string | null;
  insuranceExpiryDate: string | null;
  lastMvpiDate: string | null;
  nextMvpiDate: string | null;
  mvpiStation: string | null;
  mvpiResult: string | null;
  currentOdometerKm: number;
  lastOdometerUpdate: string | null;
  averageDailyKm: number | null;
  nextServiceDueKm: number | null;
  nextServiceDueDate: string | null;
  tireChangeKm: number | null;
  oilChangeKm: number | null;
  assignedDriverId: string | null;
  assignedDriver: Driver | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { maintenanceRecords: number; fuelLogs: number; orders: number };
  maintenanceRecords?: MaintenanceRecord[];
  fuelLogs?: FuelLog[];
  vehicleDocuments?: VehicleDocument[];
  inspections?: VehicleInspection[];
};

// ── Constants ──

const VEHICLE_TYPES: Record<string, string> = {
  RIGID_TRUCK: 'Rigid Truck', ARTICULATED_TRUCK: 'Articulated Truck',
  TANKER: 'Tanker', REFRIGERATED: 'Refrigerated', FLATBED: 'Flatbed',
  BOX_TRUCK: 'Box Truck', PICKUP: 'Pickup', VAN: 'Van',
  TRAILER: 'Trailer', LOWBED: 'Lowbed',
};

const VEHICLE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  IN_MAINTENANCE: { label: 'In Maintenance', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  OUT_OF_SERVICE: { label: 'Out of Service', color: 'text-red-400', bg: 'bg-red-500/10' },
  DECOMMISSIONED: { label: 'Decommissioned', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  RESERVED: { label: 'Reserved', color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const FUEL_TYPES: Record<string, string> = {
  DIESEL: 'Diesel', PETROL: 'Petrol', HYBRID: 'Hybrid',
  ELECTRIC: 'Electric', CNG: 'CNG', LPG: 'LPG',
};

const MAINTENANCE_TYPES: Record<string, string> = {
  PREVENTIVE: 'Preventive', CORRECTIVE: 'Corrective',
  EMERGENCY: 'Emergency', SCHEDULED: 'Scheduled', OVERHAUL: 'Overhaul',
};

const MAINTENANCE_STATUS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-zinc-500' },
  OVERDUE: { label: 'Overdue', color: 'text-red-400' },
};

const DOCUMENT_TYPES: Record<string, string> = {
  ISTIMARA: 'Istimara', INSURANCE_POLICY: 'Insurance Policy',
  TGA_OPERATION_CARD: 'TGA Operation Card', MVPI_CERTIFICATE: 'MVPI Certificate',
  WASEL_CERTIFICATE: 'WASEL Certificate', CUSTOMS_CLEARANCE: 'Customs Clearance',
  WEIGHT_CERTIFICATE: 'Weight Certificate', HAZMAT_PERMIT: 'HAZMAT Permit',
  ROUTE_PERMIT: 'Route Permit', SPEED_LIMITER_CERT: 'Speed Limiter Cert', OTHER: 'Other',
};

const INSURANCE_TYPES: Record<string, string> = {
  COMPREHENSIVE: 'Comprehensive', THIRD_PARTY: 'Third Party', AGAINST_OTHERS: 'Against Others',
};

const FORM_TABS = ['Identity', 'Registration', 'Specs & Fuel', 'Regulatory', 'Insurance & MVPI', 'Maintenance'] as const;
type FormTab = typeof FORM_TABS[number];

const DETAIL_TABS = ['Overview', 'Maintenance', 'Fuel', 'Documents', 'Inspections'] as const;
type DetailTab = typeof DETAIL_TABS[number];

// ── Reusable Components ──

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-[var(--destructive)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 outline-none focus:border-[var(--accent)] transition-colors";

function Badge({ children, color = 'text-[var(--muted)]', bg = 'bg-[var(--surface)]' }: { children: React.ReactNode; color?: string; bg?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${color} ${bg}`}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const s = VEHICLE_STATUS[status] || { label: status, color: 'text-[var(--muted)]', bg: 'bg-[var(--surface)]' };
  return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
}

function isExpiringSoon(dateStr: string | null, days = 30): 'expired' | 'warning' | 'ok' {
  if (!dateStr) return 'ok';
  const d = new Date(dateStr);
  const now = new Date();
  if (d < now) return 'expired';
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days ? 'warning' : 'ok';
}

function ExpiryIndicator({ date, label }: { date: string | null; label: string }) {
  if (!date) return <span className="text-xs text-[var(--muted)]">—</span>;
  const status = isExpiringSoon(date);
  const formatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'expired' ? 'bg-red-500 animate-pulse' : status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
      <span className={`text-xs ${status === 'expired' ? 'text-red-400 font-medium' : status === 'warning' ? 'text-amber-400' : 'text-[var(--muted)]'}`}>
        {label}: {formatted}
      </span>
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatNumber(n: number | null, suffix = '') {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString() + suffix;
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Vehicle Detail Panel ──
// ══════════════════════════════════════════════════════════════

function VehicleDetail({ vehicle: initialVehicle, onClose, onRefresh }: { vehicle: Vehicle; onClose: () => void; onRefresh: () => void }) {
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const [loading, setLoading] = useState(false);

  // Sub-data
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);

  // Modals
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  const fetchVehicleDetail = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`);
      const data = await res.json();
      setVehicle(data);
      if (data.maintenanceRecords) setMaintenance(data.maintenanceRecords);
      if (data.fuelLogs) setFuelLogs(data.fuelLogs);
      if (data.vehicleDocuments) setDocuments(data.vehicleDocuments);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setLoading(true);
    fetchVehicleDetail().finally(() => setLoading(false));
  }, [initialVehicle.id]);

  // ── Maintenance Form Handler ──
  const [mForm, setMForm] = useState({ title: '', type: 'PREVENTIVE', description: '', scheduledDate: '', vendor: '', totalCostSar: '', odometerAtService: '', notes: '' });
  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mForm),
      });
      if (res.ok) {
        setShowMaintenanceForm(false);
        setMForm({ title: '', type: 'PREVENTIVE', description: '', scheduledDate: '', vendor: '', totalCostSar: '', odometerAtService: '', notes: '' });
        fetchVehicleDetail();
      }
    } catch (e) { console.error(e); }
  };

  // ── Fuel Form Handler ──
  const [fForm, setFForm] = useState({ date: '', liters: '', costPerLiter: '', odometerKm: '', station: '', driverName: '', notes: '' });
  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fForm),
      });
      if (res.ok) {
        setShowFuelForm(false);
        setFForm({ date: '', liters: '', costPerLiter: '', odometerKm: '', station: '', driverName: '', notes: '' });
        fetchVehicleDetail();
        onRefresh();
      }
    } catch (e) { console.error(e); }
  };

  // ── Document Form Handler ──
  const [dForm, setDForm] = useState({ documentType: 'ISTIMARA', title: '', issueDate: '', expiryDate: '', issuedBy: '', referenceNo: '', notes: '' });
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dForm),
      });
      if (res.ok) {
        setShowDocumentForm(false);
        setDForm({ documentType: 'ISTIMARA', title: '', issueDate: '', expiryDate: '', issuedBy: '', referenceNo: '', notes: '' });
        fetchVehicleDetail();
      }
    } catch (e) { console.error(e); }
  };

  // ── Total maintenance cost ──
  const totalMaintenanceCost = maintenance.reduce((s, m) => s + (m.totalCostSar || 0), 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.totalCostSar || 0), 0);
  const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-5xl my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-lg">🚛</div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{vehicle.make} {vehicle.model}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-[var(--muted)]">{vehicle.fleetNumber}</span>
                <span className="text-[var(--border)]">·</span>
                <span className="text-xs font-mono text-[var(--muted)]">{vehicle.licensePlate}</span>
                <span className="text-[var(--border)]">·</span>
                <StatusBadge status={vehicle.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-6 overflow-x-auto">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab}
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

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-[var(--muted)]">Loading vehicle details...</div>
        ) : (
          <div className="px-6 py-5">
            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard icon="⏱" label="Odometer" value={formatNumber(vehicle.currentOdometerKm, ' km')} sub={vehicle.lastOdometerUpdate ? `Updated ${formatDate(vehicle.lastOdometerUpdate)}` : undefined} />
                  <StatCard icon="🔧" label="Maintenance" value={`${maintenance.length}`} sub={`SAR ${totalMaintenanceCost.toLocaleString()} total`} />
                  <StatCard icon="⛽" label="Fuel" value={`${totalFuelLiters.toLocaleString()} L`} sub={`SAR ${totalFuelCost.toLocaleString()} total`} />
                  <StatCard icon="📦" label="Orders" value={`${vehicle._count?.orders || 0}`} sub={vehicle.assignedDriver ? `Assigned to ${vehicle.assignedDriver.firstName}` : 'Unassigned'} />
                </div>

                {/* Compliance Alerts */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">⚠ Compliance & Expiry Tracker</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <ExpiryIndicator date={vehicle.istimaraExpiry} label="Istimara" />
                    <ExpiryIndicator date={vehicle.insuranceExpiryDate} label="Insurance" />
                    <ExpiryIndicator date={vehicle.tgaOperationCardExpiry} label="TGA Card" />
                    <ExpiryIndicator date={vehicle.nextMvpiDate} label="Next MVPI" />
                    <ExpiryIndicator date={vehicle.nextServiceDueDate} label="Next Service" />
                  </div>
                </div>

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Left: Identification & Specs */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Identification</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Type</span><span>{VEHICLE_TYPES[vehicle.vehicleType] || vehicle.vehicleType}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Year</span><span>{vehicle.year || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Color</span><span>{vehicle.color || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Chassis / VIN</span><span className="font-mono text-xs">{vehicle.chassisNumber || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Engine No.</span><span className="font-mono text-xs">{vehicle.engineNumber || '—'}</span></div>
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pt-2">Capacity & Dimensions</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Payload</span><span>{vehicle.capacity}t</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">GVW</span><span>{formatNumber(vehicle.grossVehicleWeight, ' kg')}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Tare Weight</span><span>{formatNumber(vehicle.netWeight, ' kg')}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Axles</span><span>{vehicle.numberOfAxles || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">L × W × H</span><span>{vehicle.lengthMeters || '—'} × {vehicle.widthMeters || '—'} × {vehicle.heightMeters || '—'} m</span></div>
                    </div>
                  </div>

                  {/* Right: Regulatory & Engine */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Engine & Fuel</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Fuel Type</span><span>{FUEL_TYPES[vehicle.fuelType] || vehicle.fuelType}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Tank</span><span>{formatNumber(vehicle.tankCapacityLiters, ' L')}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Engine CC</span><span>{formatNumber(vehicle.engineCapacityCC)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Horsepower</span><span>{formatNumber(vehicle.horsePower, ' HP')}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Transmission</span><span>{vehicle.transmissionType || '—'}</span></div>
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pt-2">Saudi Regulatory</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Istimara No.</span><span className="font-mono text-xs">{vehicle.istimaraNumber || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Registration City</span><span>{vehicle.registrationCity || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">TGA Card</span><span className="font-mono text-xs">{vehicle.tgaOperationCardNumber || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">WASEL Tracker</span><span>{vehicle.waselConnected ? '✓ Connected' : '✗ Not connected'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Speed Limiter</span><span>{vehicle.speedLimiterInstalled ? `✓ ${vehicle.speedLimitKmh || '—'} km/h` : '✗ Not installed'}</span></div>
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pt-2">Insurance</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Provider</span><span>{vehicle.insuranceProvider || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Type</span><span>{vehicle.insuranceType ? INSURANCE_TYPES[vehicle.insuranceType] || vehicle.insuranceType : '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Policy No.</span><span className="font-mono text-xs">{vehicle.insurancePolicyNo || '—'}</span></div>
                    </div>
                  </div>
                </div>

                {/* MVPI & Assignment */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">🔍 MVPI (Fahes) Inspection</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Last Inspection</span><span>{formatDate(vehicle.lastMvpiDate)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Result</span><span className={vehicle.mvpiResult === 'PASS' ? 'text-emerald-400 font-medium' : vehicle.mvpiResult === 'FAIL' ? 'text-red-400 font-medium' : ''}>{vehicle.mvpiResult || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--muted)]">Station</span><span>{vehicle.mvpiStation || '—'}</span></div>
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">👤 Assignment</h3>
                    {vehicle.assignedDriver ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Driver</span>
                          <span className="font-medium">{vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Employee ID</span>
                          <span className="font-mono text-xs">{vehicle.assignedDriver.employeeId}</span>
                        </div>
                        {vehicle.assignedDriver.phone && (
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Phone</span>
                            <span>{vehicle.assignedDriver.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-[var(--border)]">
                          <span className="text-[var(--muted)]">Duty Status</span>
                          {vehicle.assignedDriver.status === 'ON_LEAVE' || (vehicle.assignedDriver.leaves && vehicle.assignedDriver.leaves.length > 0) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🏖️ On Leave
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ● On Duty
                            </span>
                          )}
                        </div>
                        {(vehicle.assignedDriver.status === 'ON_LEAVE' || (vehicle.assignedDriver.leaves && vehicle.assignedDriver.leaves.length > 0)) && (
                          <div className="mt-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                            ⚠️ <strong>Primary driver on leave:</strong> Vehicle is temporarily available for a relief driver until primary driver returns.
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted)]">No driver assigned</p>
                    )}
                  </div>
                </div>

                {vehicle.notes && (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">📝 Notes</h3>
                    <p className="text-sm">{vehicle.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ MAINTENANCE TAB ═══ */}
            {activeTab === 'Maintenance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Maintenance Records</h3>
                  <button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="text-xs font-medium px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 transition-opacity">
                    {showMaintenanceForm ? 'Cancel' : '+ Add Record'}
                  </button>
                </div>

                {showMaintenanceForm && (
                  <form onSubmit={handleAddMaintenance} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Title" required>
                        <input required value={mForm.title} onChange={e => setMForm({ ...mForm, title: e.target.value })} className={inputClass} placeholder="Oil change" />
                      </Field>
                      <Field label="Type">
                        <select value={mForm.type} onChange={e => setMForm({ ...mForm, type: e.target.value })} className={inputClass}>
                          {Object.entries(MAINTENANCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </Field>
                      <Field label="Scheduled Date">
                        <input type="date" value={mForm.scheduledDate} onChange={e => setMForm({ ...mForm, scheduledDate: e.target.value })} className={inputClass} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Vendor">
                        <input value={mForm.vendor} onChange={e => setMForm({ ...mForm, vendor: e.target.value })} className={inputClass} placeholder="Workshop name" />
                      </Field>
                      <Field label="Total Cost (SAR)">
                        <input type="number" step="0.01" value={mForm.totalCostSar} onChange={e => setMForm({ ...mForm, totalCostSar: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Odometer (km)">
                        <input type="number" value={mForm.odometerAtService} onChange={e => setMForm({ ...mForm, odometerAtService: e.target.value })} className={inputClass} />
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea value={mForm.description} onChange={e => setMForm({ ...mForm, description: e.target.value })} className={`${inputClass} h-16 resize-none`} placeholder="Work details..." />
                    </Field>
                    <button type="submit" className="text-xs font-medium px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90">Save Record</button>
                  </form>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon="🔧" label="Total Records" value={`${maintenance.length}`} />
                  <StatCard icon="💰" label="Total Cost" value={`SAR ${totalMaintenanceCost.toLocaleString()}`} />
                  <StatCard icon="📅" label="Last Service" value={maintenance[0] ? formatDate(maintenance[0].scheduledDate || maintenance[0].createdAt) : '—'} />
                </div>

                {/* Records Table */}
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Title</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Date</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Cost</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Vendor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenance.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-sm text-[var(--muted)]">No maintenance records yet.</td></tr>
                      ) : maintenance.map((m) => (
                        <tr key={m.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
                          <td className="px-3 py-2.5 text-sm font-medium">{m.title}</td>
                          <td className="px-3 py-2.5 text-xs">{MAINTENANCE_TYPES[m.type] || m.type}</td>
                          <td className="px-3 py-2.5"><span className={`text-xs font-medium ${MAINTENANCE_STATUS[m.status]?.color || ''}`}>{MAINTENANCE_STATUS[m.status]?.label || m.status}</span></td>
                          <td className="px-3 py-2.5 text-xs text-[var(--muted)] tabular-nums">{formatDate(m.scheduledDate || m.createdAt)}</td>
                          <td className="px-3 py-2.5 text-xs text-right tabular-nums">{m.totalCostSar ? `SAR ${m.totalCostSar.toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{m.vendor || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══ FUEL TAB ═══ */}
            {activeTab === 'Fuel' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Fuel Logs</h3>
                  <button onClick={() => setShowFuelForm(!showFuelForm)} className="text-xs font-medium px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 transition-opacity">
                    {showFuelForm ? 'Cancel' : '+ Log Fuel'}
                  </button>
                </div>

                {showFuelForm && (
                  <form onSubmit={handleAddFuel} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Date" required>
                        <input required type="date" value={fForm.date} onChange={e => setFForm({ ...fForm, date: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Liters" required>
                        <input required type="number" step="0.1" value={fForm.liters} onChange={e => setFForm({ ...fForm, liters: e.target.value })} className={inputClass} placeholder="120" />
                      </Field>
                      <Field label="Cost / Liter (SAR)">
                        <input type="number" step="0.01" value={fForm.costPerLiter} onChange={e => setFForm({ ...fForm, costPerLiter: e.target.value })} className={inputClass} placeholder="2.18" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Odometer (km)">
                        <input type="number" value={fForm.odometerKm} onChange={e => setFForm({ ...fForm, odometerKm: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Station">
                        <input value={fForm.station} onChange={e => setFForm({ ...fForm, station: e.target.value })} className={inputClass} placeholder="Saudi Aramco Station" />
                      </Field>
                      <Field label="Driver">
                        <input value={fForm.driverName} onChange={e => setFForm({ ...fForm, driverName: e.target.value })} className={inputClass} />
                      </Field>
                    </div>
                    <button type="submit" className="text-xs font-medium px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90">Save Log</button>
                  </form>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard icon="⛽" label="Total Fills" value={`${fuelLogs.length}`} />
                  <StatCard icon="🛢" label="Total Liters" value={`${totalFuelLiters.toLocaleString()} L`} />
                  <StatCard icon="💰" label="Total Cost" value={`SAR ${totalFuelCost.toLocaleString()}`} />
                  <StatCard icon="📊" label="Avg Cost/Liter" value={totalFuelLiters > 0 ? `SAR ${(totalFuelCost / totalFuelLiters).toFixed(2)}` : '—'} />
                </div>

                {/* Logs Table */}
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Date</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Liters</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">SAR/L</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Total</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Odometer</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Station</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelLogs.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-sm text-[var(--muted)]">No fuel logs yet.</td></tr>
                      ) : fuelLogs.map((f) => (
                        <tr key={f.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
                          <td className="px-3 py-2.5 text-xs tabular-nums">{formatDate(f.date)}</td>
                          <td className="px-3 py-2.5 text-xs text-right tabular-nums">{f.liters.toLocaleString()} L</td>
                          <td className="px-3 py-2.5 text-xs text-right tabular-nums">{f.costPerLiter?.toFixed(2) || '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-right tabular-nums font-medium">{f.totalCostSar ? `SAR ${f.totalCostSar.toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-right tabular-nums">{f.odometerKm?.toLocaleString() || '—'} km</td>
                          <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{f.station || '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{f.driverName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══ DOCUMENTS TAB ═══ */}
            {activeTab === 'Documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Vehicle Documents</h3>
                  <button onClick={() => setShowDocumentForm(!showDocumentForm)} className="text-xs font-medium px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 transition-opacity">
                    {showDocumentForm ? 'Cancel' : '+ Add Document'}
                  </button>
                </div>

                {showDocumentForm && (
                  <form onSubmit={handleAddDocument} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Document Type" required>
                        <select value={dForm.documentType} onChange={e => setDForm({ ...dForm, documentType: e.target.value })} className={inputClass}>
                          {Object.entries(DOCUMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </Field>
                      <Field label="Title" required>
                        <input required value={dForm.title} onChange={e => setDForm({ ...dForm, title: e.target.value })} className={inputClass} placeholder="2024 Istimara Renewal" />
                      </Field>
                      <Field label="Reference No.">
                        <input value={dForm.referenceNo} onChange={e => setDForm({ ...dForm, referenceNo: e.target.value })} className={inputClass} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Issue Date">
                        <input type="date" value={dForm.issueDate} onChange={e => setDForm({ ...dForm, issueDate: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Expiry Date">
                        <input type="date" value={dForm.expiryDate} onChange={e => setDForm({ ...dForm, expiryDate: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Issued By">
                        <input value={dForm.issuedBy} onChange={e => setDForm({ ...dForm, issuedBy: e.target.value })} className={inputClass} placeholder="Muroor" />
                      </Field>
                    </div>
                    <button type="submit" className="text-xs font-medium px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90">Save Document</button>
                  </form>
                )}

                {/* Documents Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {documents.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-sm text-[var(--muted)]">No documents uploaded yet.</div>
                  ) : documents.map((doc) => {
                    const expStatus = isExpiringSoon(doc.expiryDate);
                    return (
                      <div key={doc.id} className={`bg-[var(--surface)] border rounded-lg p-4 ${expStatus === 'expired' ? 'border-red-500/30' : expStatus === 'warning' ? 'border-amber-500/30' : 'border-[var(--border)]'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge>{DOCUMENT_TYPES[doc.documentType] || doc.documentType}</Badge>
                            <h4 className="text-sm font-medium mt-1.5">{doc.title}</h4>
                            {doc.referenceNo && <p className="text-xs font-mono text-[var(--muted)] mt-0.5">Ref: {doc.referenceNo}</p>}
                          </div>
                          {expStatus !== 'ok' && (
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${expStatus === 'expired' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {expStatus === 'expired' ? 'EXPIRED' : 'EXPIRING SOON'}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-3 text-xs text-[var(--muted)]">
                          <span>Issued: {formatDate(doc.issueDate)}</span>
                          <span>Expires: {formatDate(doc.expiryDate)}</span>
                        </div>
                        {doc.issuedBy && <p className="text-xs text-[var(--muted)] mt-1">By: {doc.issuedBy}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ INSPECTIONS TAB ═══ */}
            {activeTab === 'Inspections' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Pre-trip / Post-trip Inspections</h3>
                {(vehicle.inspections || []).length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--muted)]">No inspections recorded yet.</div>
                ) : (
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                          <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Date</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Type</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Inspector</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Result</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Odometer</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted)] uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vehicle.inspections || []).map((insp) => (
                          <tr key={insp.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
                            <td className="px-3 py-2.5 text-xs tabular-nums">{formatDate(insp.date)}</td>
                            <td className="px-3 py-2.5 text-xs">{insp.inspectionType.replace('_', ' ')}</td>
                            <td className="px-3 py-2.5 text-xs">{insp.inspectedBy || '—'}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs font-medium ${insp.overallResult === 'PASS' ? 'text-emerald-400' : insp.overallResult === 'FAIL' ? 'text-red-400' : 'text-amber-400'}`}>
                                {insp.overallResult}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-right tabular-nums">{insp.odometerKm?.toLocaleString() || '—'} km</td>
                            <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{insp.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Main Vehicles Page ──
// ══════════════════════════════════════════════════════════════

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTab, setFormTab] = useState<FormTab>('Identity');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detail
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Drivers for assignment
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Vehicle Categories
  const [categories, setCategories] = useState<VehicleCategory[]>([]);

  const initialForm: Record<string, string | boolean> = {
    make: '', model: '', year: '', color: '', vehicleType: 'RIGID_TRUCK', photoUrl: '',
    licensePlate: '', chassisNumber: '', engineNumber: '', istimaraNumber: '', istimaraExpiry: '', registrationCity: '',
    capacity: '', grossVehicleWeight: '', netWeight: '', numberOfAxles: '', lengthMeters: '', widthMeters: '', heightMeters: '',
    fuelType: 'DIESEL', tankCapacityLiters: '', engineCapacityCC: '', transmissionType: '', horsePower: '',
    tgaOperationCardNumber: '', tgaOperationCardExpiry: '', waselTrackerId: '', waselConnected: false, speedLimiterInstalled: false, speedLimitKmh: '',
    insuranceProvider: '', insurancePolicyNo: '', insuranceType: 'COMPREHENSIVE', insuranceStartDate: '', insuranceExpiryDate: '',
    lastMvpiDate: '', nextMvpiDate: '', mvpiStation: '', mvpiResult: '',
    currentOdometerKm: '', nextServiceDueKm: '', nextServiceDueDate: '', tireChangeKm: '', oilChangeKm: '',
    assignedDriverId: '', notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/vehicles?${params.toString()}`);
      const data = await res.json();
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      const data = await res.json();
      if (Array.isArray(data)) setDrivers(data);
    } catch (e) { console.error(e); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/vehicles/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchCategories();
  }, []);
  useEffect(() => { setLoading(true); fetchVehicles(); }, [searchQuery, filterStatus, filterType]);

  const typeDisplayMap: Record<string, string> = {
    ...VEHICLE_TYPES,
    ...Object.fromEntries(categories.map(c => [c.slug, `${c.icon ? c.icon + ' ' : ''}${c.name}`])),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save vehicle');
      }
      setFormData(initialForm);
      setIsFormOpen(false);
      setEditingId(null);
      setFormTab('Identity');
      fetchVehicles();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    const fd: Record<string, string | boolean> = { ...initialForm };
    // Populate form from vehicle
    const stringFields = ['make', 'model', 'color', 'vehicleType', 'photoUrl', 'licensePlate', 'chassisNumber', 'engineNumber',
      'istimaraNumber', 'registrationCity', 'fuelType', 'transmissionType', 'tgaOperationCardNumber', 'waselTrackerId',
      'insuranceProvider', 'insurancePolicyNo', 'insuranceType', 'mvpiStation', 'mvpiResult', 'assignedDriverId', 'notes', 'fleetNumber'];
    for (const f of stringFields) {
      const val = vehicle[f as keyof Vehicle];
      fd[f] = (val as string) || '';
    }
    const numFields = ['year', 'numberOfAxles', 'engineCapacityCC', 'horsePower', 'speedLimitKmh', 'capacity', 'grossVehicleWeight',
      'netWeight', 'lengthMeters', 'widthMeters', 'heightMeters', 'tankCapacityLiters', 'currentOdometerKm', 'averageDailyKm',
      'nextServiceDueKm', 'tireChangeKm', 'oilChangeKm'];
    for (const f of numFields) {
      const val = vehicle[f as keyof Vehicle];
      fd[f] = val !== null && val !== undefined ? String(val) : '';
    }
    const dateFields = ['istimaraExpiry', 'tgaOperationCardExpiry', 'insuranceStartDate', 'insuranceExpiryDate', 'lastMvpiDate', 'nextMvpiDate', 'nextServiceDueDate'];
    for (const f of dateFields) {
      const val = vehicle[f as keyof Vehicle];
      fd[f] = val ? new Date(val as string).toISOString().split('T')[0] : '';
    }
    fd.waselConnected = vehicle.waselConnected;
    fd.speedLimiterInstalled = vehicle.speedLimiterInstalled;

    setFormData(fd);
    setEditingId(vehicle.id);
    setIsFormOpen(true);
    setFormTab('Identity');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This will also delete all maintenance records, fuel logs, and documents.')) return;
    try {
      await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      fetchVehicles();
    } catch (e) { console.error(e); }
  };

  const setField = (field: string, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));

  // ── Compliance summary ──
  const complianceAlerts = vehicles.reduce((acc, v) => {
    if (isExpiringSoon(v.istimaraExpiry) !== 'ok') acc++;
    if (isExpiringSoon(v.insuranceExpiryDate) !== 'ok') acc++;
    if (isExpiringSoon(v.tgaOperationCardExpiry) !== 'ok') acc++;
    if (isExpiringSoon(v.nextMvpiDate) !== 'ok') acc++;
    return acc;
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Fleet Management</h1>
          <p className="text-sm text-[var(--muted)]">
            {vehicles.length} vehicles
            {complianceAlerts > 0 && (
              <span className="ml-2 text-amber-400">· {complianceAlerts} compliance alert{complianceAlerts > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setIsFormOpen(!isFormOpen); if (isFormOpen) { setEditingId(null); setFormData(initialForm); setFormTab('Identity'); } }}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${
              isFormOpen
                ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]'
                : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
            }`}
          >
            {isFormOpen ? 'Cancel' : '+ Add Vehicle'}
          </button>
        </div>
      </div>

      {/* ── Fleet Stats ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard icon="🚛" label="Total Fleet" value={`${vehicles.length}`} />
        <StatCard icon="✓" label="Active" value={`${vehicles.filter(v => v.status === 'ACTIVE').length}`} />
        <StatCard icon="🔧" label="In Maintenance" value={`${vehicles.filter(v => v.status === 'IN_MAINTENANCE').length}`} />
        <StatCard icon="⚠" label="Out of Service" value={`${vehicles.filter(v => v.status === 'OUT_OF_SERVICE').length}`} />
        <StatCard icon="🔴" label="Compliance Alerts" value={`${complianceAlerts}`} />
      </div>

      {/* ── Add/Edit Form ── */}
      {isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-medium">{editingId ? 'Edit Vehicle' : 'Register New Vehicle'}</h2>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-[var(--border)] px-6 overflow-x-auto">
            {FORM_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFormTab(tab)}
                className={`px-4 py-3 text-xs font-medium tracking-wider transition-colors whitespace-nowrap ${
                  formTab === tab ? 'text-[var(--foreground)] border-b-2 border-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Identity Tab */}
            {formTab === 'Identity' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Make" required>
                    <input required value={formData.make as string} onChange={e => setField('make', e.target.value)} className={inputClass} placeholder="Mercedes-Benz" />
                  </Field>
                  <Field label="Model" required>
                    <input required value={formData.model as string} onChange={e => setField('model', e.target.value)} className={inputClass} placeholder="Actros 2645" />
                  </Field>
                  <Field label="Year">
                    <input type="number" value={formData.year as string} onChange={e => setField('year', e.target.value)} className={inputClass} placeholder="2024" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Vehicle Type" required>
                    <select value={formData.vehicleType as string} onChange={e => setField('vehicleType', e.target.value)} className={inputClass}>
                      {categories.length > 0
                        ? categories.map(c => <option key={c.slug} value={c.slug}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)
                        : Object.entries(VEHICLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Color">
                    <input value={formData.color as string} onChange={e => setField('color', e.target.value)} className={inputClass} placeholder="White" />
                  </Field>
                  <Field label="Assigned Driver">
                    <select value={formData.assignedDriverId as string} onChange={e => setField('assignedDriverId', e.target.value)} className={inputClass}>
                      <option value="">— None (Unassigned) —</option>
                      {drivers.map(d => {
                        const isOnLeave = d.status === 'ON_LEAVE' || (d.leaves && d.leaves.length > 0);
                        return (
                          <option key={d.id} value={d.id}>
                            {d.firstName} {d.lastName} ({d.employeeId}){isOnLeave ? ' ⚠️ [ON LEAVE]' : ' ✓'}
                          </option>
                        );
                      })}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* Registration Tab */}
            {formTab === 'Registration' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="License Plate" required>
                    <input required value={formData.licensePlate as string} onChange={e => setField('licensePlate', e.target.value)} className={inputClass} placeholder="أ ب ج 1234" />
                  </Field>
                  <Field label="Chassis / VIN">
                    <input value={formData.chassisNumber as string} onChange={e => setField('chassisNumber', e.target.value)} className={inputClass} placeholder="WDB9634031L123456" />
                  </Field>
                  <Field label="Engine Number">
                    <input value={formData.engineNumber as string} onChange={e => setField('engineNumber', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Istimara Number">
                    <input value={formData.istimaraNumber as string} onChange={e => setField('istimaraNumber', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Istimara Expiry">
                    <input type="date" value={formData.istimaraExpiry as string} onChange={e => setField('istimaraExpiry', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Registration City">
                    <input value={formData.registrationCity as string} onChange={e => setField('registrationCity', e.target.value)} className={inputClass} placeholder="Riyadh" />
                  </Field>
                </div>
              </div>
            )}

            {/* Specs & Fuel Tab */}
            {formTab === 'Specs & Fuel' && (
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Capacity & Dimensions</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Payload (tons)" required>
                    <input required type="number" step="0.1" value={formData.capacity as string} onChange={e => setField('capacity', e.target.value)} className={inputClass} placeholder="25" />
                  </Field>
                  <Field label="GVW (kg)">
                    <input type="number" value={formData.grossVehicleWeight as string} onChange={e => setField('grossVehicleWeight', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Tare Weight (kg)">
                    <input type="number" value={formData.netWeight as string} onChange={e => setField('netWeight', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Axles">
                    <input type="number" value={formData.numberOfAxles as string} onChange={e => setField('numberOfAxles', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Length (m)">
                    <input type="number" step="0.1" value={formData.lengthMeters as string} onChange={e => setField('lengthMeters', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Width (m)">
                    <input type="number" step="0.1" value={formData.widthMeters as string} onChange={e => setField('widthMeters', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Height (m)">
                    <input type="number" step="0.1" value={formData.heightMeters as string} onChange={e => setField('heightMeters', e.target.value)} className={inputClass} placeholder="Max 4.8m in KSA" />
                  </Field>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pt-2">Engine & Fuel</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Fuel Type">
                    <select value={formData.fuelType as string} onChange={e => setField('fuelType', e.target.value)} className={inputClass}>
                      {Object.entries(FUEL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Tank (liters)">
                    <input type="number" value={formData.tankCapacityLiters as string} onChange={e => setField('tankCapacityLiters', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Engine CC">
                    <input type="number" value={formData.engineCapacityCC as string} onChange={e => setField('engineCapacityCC', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Horsepower">
                    <input type="number" value={formData.horsePower as string} onChange={e => setField('horsePower', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Transmission">
                    <select value={formData.transmissionType as string} onChange={e => setField('transmissionType', e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                      <option value="AMT">AMT</option>
                    </select>
                  </Field>
                  <Field label="Odometer (km)">
                    <input type="number" value={formData.currentOdometerKm as string} onChange={e => setField('currentOdometerKm', e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </div>
            )}

            {/* Regulatory Tab */}
            {formTab === 'Regulatory' && (
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">TGA & WASEL Compliance</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="TGA Operation Card No.">
                    <input value={formData.tgaOperationCardNumber as string} onChange={e => setField('tgaOperationCardNumber', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="TGA Card Expiry">
                    <input type="date" value={formData.tgaOperationCardExpiry as string} onChange={e => setField('tgaOperationCardExpiry', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="WASEL Tracker ID">
                    <input value={formData.waselTrackerId as string} onChange={e => setField('waselTrackerId', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="WASEL Connected">
                    <label className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={formData.waselConnected as boolean} onChange={e => setField('waselConnected', e.target.checked)} className="accent-[var(--accent)]" />
                      <span className="text-sm">GPS tracker connected</span>
                    </label>
                  </Field>
                  <Field label="Speed Limiter Installed">
                    <label className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={formData.speedLimiterInstalled as boolean} onChange={e => setField('speedLimiterInstalled', e.target.checked)} className="accent-[var(--accent)]" />
                      <span className="text-sm">Speed limiter installed</span>
                    </label>
                  </Field>
                  <Field label="Speed Limit (km/h)">
                    <input type="number" value={formData.speedLimitKmh as string} onChange={e => setField('speedLimitKmh', e.target.value)} className={inputClass} placeholder="90 (articulated) / 100 (rigid) / 80 (tanker)" />
                  </Field>
                </div>
              </div>
            )}

            {/* Insurance & MVPI Tab */}
            {formTab === 'Insurance & MVPI' && (
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Insurance</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Insurance Provider">
                    <input value={formData.insuranceProvider as string} onChange={e => setField('insuranceProvider', e.target.value)} className={inputClass} placeholder="Tawuniya" />
                  </Field>
                  <Field label="Policy Number">
                    <input value={formData.insurancePolicyNo as string} onChange={e => setField('insurancePolicyNo', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Insurance Type">
                    <select value={formData.insuranceType as string} onChange={e => setField('insuranceType', e.target.value)} className={inputClass}>
                      {Object.entries(INSURANCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Date">
                    <input type="date" value={formData.insuranceStartDate as string} onChange={e => setField('insuranceStartDate', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Expiry Date">
                    <input type="date" value={formData.insuranceExpiryDate as string} onChange={e => setField('insuranceExpiryDate', e.target.value)} className={inputClass} />
                  </Field>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pt-2">MVPI (Fahes) Periodic Inspection</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Last Inspection">
                    <input type="date" value={formData.lastMvpiDate as string} onChange={e => setField('lastMvpiDate', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Next Due">
                    <input type="date" value={formData.nextMvpiDate as string} onChange={e => setField('nextMvpiDate', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Station">
                    <input value={formData.mvpiStation as string} onChange={e => setField('mvpiStation', e.target.value)} className={inputClass} placeholder="Fahes Riyadh" />
                  </Field>
                  <Field label="Result">
                    <select value={formData.mvpiResult as string} onChange={e => setField('mvpiResult', e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {formTab === 'Maintenance' && (
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Service Schedule</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Next Service Due (km)">
                    <input type="number" value={formData.nextServiceDueKm as string} onChange={e => setField('nextServiceDueKm', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Next Service Due Date">
                    <input type="date" value={formData.nextServiceDueDate as string} onChange={e => setField('nextServiceDueDate', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Tire Change (km)">
                    <input type="number" value={formData.tireChangeKm as string} onChange={e => setField('tireChangeKm', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Oil Change (km)">
                    <input type="number" value={formData.oilChangeKm as string} onChange={e => setField('oilChangeKm', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea value={formData.notes as string} onChange={e => setField('notes', e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Any additional notes about this vehicle..." />
                </Field>
              </div>
            )}

            {/* Submit Area */}
            {submitError && <p className="text-sm text-red-500 mt-4">{submitError}</p>}

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border)]">
              <div className="flex gap-2">
                {FORM_TABS.indexOf(formTab) > 0 && (
                  <button type="button" onClick={() => setFormTab(FORM_TABS[FORM_TABS.indexOf(formTab) - 1])} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-2 border border-[var(--border)] rounded-md transition-colors">
                    ← Previous
                  </button>
                )}
                {FORM_TABS.indexOf(formTab) < FORM_TABS.length - 1 && (
                  <button type="button" onClick={() => setFormTab(FORM_TABS[FORM_TABS.indexOf(formTab) + 1])} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-2 border border-[var(--border)] rounded-md transition-colors">
                    Next →
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData(initialForm); }} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by fleet number, make, model, plate, or VIN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`${inputClass} pl-9`}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">⌕</span>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputClass} w-40`}>
          <option value="">All Status</option>
          {Object.entries(VEHICLE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`${inputClass} w-44`}>
          <option value="">All Types</option>
          {categories.length > 0
            ? categories.map(c => <option key={c.slug} value={c.slug}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)
            : Object.entries(VEHICLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* ── Vehicles Table ── */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Plate</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Driver</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Compliance</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Odometer</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--muted)]">Loading fleet data...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--muted)]">No vehicles found. Click &quot;Add Vehicle&quot; to register your first vehicle.</td></tr>
            ) : (
              vehicles.map((vehicle, i) => {
                // Calculate compliance alerts for this vehicle
                const alerts: string[] = [];
                if (isExpiringSoon(vehicle.istimaraExpiry) === 'expired') alerts.push('Istimara expired');
                else if (isExpiringSoon(vehicle.istimaraExpiry) === 'warning') alerts.push('Istimara expiring');
                if (isExpiringSoon(vehicle.insuranceExpiryDate) === 'expired') alerts.push('Insurance expired');
                else if (isExpiringSoon(vehicle.insuranceExpiryDate) === 'warning') alerts.push('Insurance expiring');
                if (isExpiringSoon(vehicle.tgaOperationCardExpiry) !== 'ok') alerts.push('TGA');
                if (isExpiringSoon(vehicle.nextMvpiDate) !== 'ok') alerts.push('MVPI');

                return (
                  <tr
                    key={vehicle.id}
                    className={`hover:bg-[var(--surface)] transition-colors duration-100 cursor-pointer ${i < vehicles.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted)] font-bold">
                          {vehicle.fleetNumber.slice(-3)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-[var(--muted)] font-mono">{vehicle.fleetNumber}{vehicle.year ? ` · ${vehicle.year}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs text-[var(--muted)]">{vehicle.licensePlate}</td>
                    <td className="px-4 py-3 text-xs">{typeDisplayMap[vehicle.vehicleType] || vehicle.vehicleType}</td>
                    <td className="px-4 py-3"><StatusBadge status={vehicle.status} /></td>
                    <td className="px-4 py-3 text-xs">
                      {vehicle.assignedDriver ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-[var(--foreground)]">
                            {vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}
                          </span>
                          {vehicle.assignedDriver.status === 'ON_LEAVE' || (vehicle.assignedDriver.leaves && vehicle.assignedDriver.leaves.length > 0) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold" title="Driver is currently away on leave">
                              🏖️ On Leave
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-medium">● Dedicated Driver</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--muted)]/50 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {alerts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {alerts.map((a, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{a}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">All clear</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums text-[var(--muted)]">{vehicle.currentOdometerKm.toLocaleString()} km</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-xs text-[var(--muted)] hover:text-[var(--destructive)] px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors"
                        >
                          Delete
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

      {/* ── Detail Modal ── */}
      {selectedVehicle && <VehicleDetail vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onRefresh={fetchVehicles} />}
    </div>
  );
}
