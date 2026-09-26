'use client';

import { useState, useEffect, Fragment } from 'react';
import DriverCalendar from '@/components/DriverCalendar';
import MasterScheduleView from '@/components/MasterScheduleView';

// ── Types ──
const TABS = ['Personal', 'Residency & Passport', 'Contact', 'Employment', 'License & TGA', 'Medical', 'Compliance'] as const;
type Tab = typeof TABS[number];

const BLOOD_GROUPS = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'O_POS', 'O_NEG', 'AB_POS', 'AB_NEG'];
const BLOOD_LABELS: Record<string, string> = { A_POS: 'A+', A_NEG: 'A−', B_POS: 'B+', B_NEG: 'B−', O_POS: 'O+', O_NEG: 'O−', AB_POS: 'AB+', AB_NEG: 'AB−' };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-[var(--success)]', INACTIVE: 'text-[var(--muted)]', ON_LEAVE: 'text-[var(--warning)]',
  TERMINATED: 'text-[var(--destructive)]', SUSPENDED: 'text-[var(--destructive)]',
};

const initialForm = {
  // Personal
  firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '', nationality: '', profilePhotoUrl: '',
  // Residency
  residencyType: 'IQAMA_HOLDER', iqamaNumber: '', iqamaExpiryDate: '', nationalIdNumber: '', sponsorName: '', borderNumber: '',
  // Passport
  passportNumber: '', passportIssuingCountry: '', passportIssueDate: '', passportExpiryDate: '', visaType: '', visaExpiryDate: '',
  // Contact
  phone: '', alternatePhone: '', email: '', currentAddress: '', permanentAddress: '', city: '', region: '', postalCode: '',
  // Emergency
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  // Employment
  dateOfJoining: '', employmentType: 'FULL_TIME', status: 'ACTIVE', department: '', salary: '',
  bankName: '', ibanNumber: '', gosiNumber: '', notes: '',
  // License
  licenseNumber: '', licenseType: 'HEAVY_EQUIPMENT', licenseIssuingAuthority: '', licenseIssueDate: '', licenseExpiryDate: '',
  hazmatCertified: false, defensiveDrivingCert: false,
  // TGA
  waselRegistrationNumber: '', tgaCardNumber: '', tgaCardExpiry: '',
  // Medical
  medicalCertificateUrl: '', medicalCertExpiry: '', medicalFitness: 'PENDING', knownMedicalConditions: '',
  drugTestDate: '', drugTestResult: 'PENDING',
  // Compliance
  backgroundCheckStatus: 'PENDING', backgroundCheckDate: '', saudiPoliceCheck: 'PENDING', saudiPoliceCheckDate: '',
  homeCountryClearance: 'PENDING', homeCountryClearanceDate: '', saherViolations: '0',
};

// ── Reusable Input Components ──
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
const selectClass = inputClass;

// ── Detail Modal ──
function DriverDetail({ driver, onClose, onEdit }: { driver: any; onClose: () => void; onEdit: () => void }) {
  const [scheduleData, setScheduleData] = useState<{ orders: any[], leaves: any[] }>({ orders: [], leaves: [] });
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const fetchSchedule = () => {
    setLoadingSchedule(true);
    fetch(`/api/admin/drivers/${driver.id}/schedule`)
      .then(res => res.json())
      .then(data => {
        if (data.orders || data.leaves) {
          setScheduleData({ orders: data.orders || [], leaves: data.leaves || [] });
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSchedule(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, [driver.id]);

  const handleUpdateLeave = async (leaveId: string, status: string) => {
    try {
      await fetch(`/api/admin/leaves/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to update leave', error);
    }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const isExpiringSoon = (d: string | null) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // 30 days
  };
  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;

  const ExpiryBadge = ({ date }: { date: string | null }) => {
    if (isExpired(date)) return <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--destructive)] bg-[var(--destructive)]/10 px-1.5 py-0.5 rounded">Expired</span>;
    if (isExpiringSoon(date)) return <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--warning)] bg-[var(--warning)]/10 px-1.5 py-0.5 rounded">Expiring Soon</span>;
    return null;
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border)]">{title}</h3>
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">{children}</div>
    </div>
  );

  const Item = ({ label, value, mono, expiry }: { label: string; value: any; mono?: boolean; expiry?: boolean }) => (
    <div>
      <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono text-xs' : ''} ${!value || value === '—' ? 'text-[var(--muted)]' : ''}`}>
        {value || '—'}
        {expiry && <ExpiryBadge date={value !== '—' ? value : null} />}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {driver.profilePhotoUrl ? (
              <img src={driver.profilePhotoUrl} alt={`${driver.firstName} ${driver.lastName}`} className="w-10 h-10 rounded-full object-cover border border-[var(--border)]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-sm font-semibold">
                {driver.firstName?.[0]}{driver.lastName?.[0]}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{driver.firstName} {driver.lastName}</h2>
              <p className="text-xs text-[var(--muted)] font-mono">{driver.employeeId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${STATUS_COLORS[driver.status] || ''}`}>{driver.status?.replace('_', ' ')}</span>
            <button onClick={onEdit} className="text-[var(--accent)] hover:opacity-80 transition-opacity text-sm font-medium mr-2">Edit</button>
            <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-lg">✕</button>
          </div>
        </div>

        <div className="px-6 py-5">
          <Section title="Personal Information">
            <Item label="Full Name" value={`${driver.firstName} ${driver.lastName}`} />
            <Item label="Date of Birth" value={fmt(driver.dateOfBirth)} />
            <Item label="Gender" value={driver.gender} />
            <Item label="Blood Group" value={BLOOD_LABELS[driver.bloodGroup] || driver.bloodGroup} />
            <Item label="Nationality" value={driver.nationality} />
          </Section>

          <Section title="Saudi ID & Residency">
            <Item label="Residency Type" value={driver.residencyType?.replace('_', ' ')} />
            <Item label="Iqama Number" value={driver.iqamaNumber} mono />
            <Item label="Iqama Expiry" value={fmt(driver.iqamaExpiryDate)} />
            <Item label="National ID" value={driver.nationalIdNumber} mono />
            <Item label="Sponsor" value={driver.sponsorName} />
            <Item label="Border Number" value={driver.borderNumber} mono />
          </Section>

          <Section title="Passport & Visa">
            <Item label="Passport Number" value={driver.passportNumber} mono />
            <Item label="Issuing Country" value={driver.passportIssuingCountry} />
            <Item label="Passport Expiry" value={fmt(driver.passportExpiryDate)} />
            <Item label="Visa Type" value={driver.visaType?.replace('_', ' ')} />
            <Item label="Visa Expiry" value={fmt(driver.visaExpiryDate)} />
          </Section>

          <Section title="Contact">
            <Item label="Phone" value={driver.phone} />
            <Item label="Alternate Phone" value={driver.alternatePhone} />
            <Item label="Email" value={driver.email} />
            <Item label="Address (KSA)" value={driver.currentAddress} />
            <Item label="City" value={driver.city} />
            <Item label="Region" value={driver.region} />
          </Section>

          <Section title="Emergency Contact">
            <Item label="Name" value={driver.emergencyContactName} />
            <Item label="Phone" value={driver.emergencyContactPhone} />
            <Item label="Relation" value={driver.emergencyContactRelation} />
          </Section>

          <Section title="Employment">
            <Item label="Date of Joining" value={fmt(driver.dateOfJoining)} />
            <Item label="Type" value={driver.employmentType?.replace('_', ' ')} />
            <Item label="Department" value={driver.department} />
            <Item label="Salary (SAR)" value={driver.salary ? `${driver.salary.toLocaleString()} SAR` : null} />
            <Item label="Bank" value={driver.bankName} />
            <Item label="IBAN" value={driver.ibanNumber} mono />
            <Item label="GOSI Number" value={driver.gosiNumber} mono />
          </Section>

          <Section title="License & Transport Authority">
            <Item label="License Number" value={driver.licenseNumber} mono />
            <Item label="License Type" value={driver.licenseType?.replace('_', ' ')} />
            <Item label="Issuing Authority" value={driver.licenseIssuingAuthority} />
            <Item label="Issue Date" value={fmt(driver.licenseIssueDate)} />
            <Item label="Expiry Date" value={fmt(driver.licenseExpiryDate)} />
            <Item label="Hazmat Certified" value={driver.hazmatCertified ? 'Yes' : 'No'} />
            <Item label="Defensive Driving" value={driver.defensiveDrivingCert ? 'Yes' : 'No'} />
            <Item label="WASEL Reg." value={driver.waselRegistrationNumber} mono />
            <Item label="TGA Card" value={driver.tgaCardNumber} mono />
            <Item label="TGA Card Expiry" value={fmt(driver.tgaCardExpiry)} />
          </Section>

          <Section title="Medical & Drug Testing">
            <Item label="Medical Fitness" value={driver.medicalFitness} />
            <Item label="Medical Cert Expiry" value={fmt(driver.medicalCertExpiry)} />
            <Item label="Known Conditions" value={driver.knownMedicalConditions} />
            <Item label="Drug Test Date" value={fmt(driver.drugTestDate)} />
            <Item label="Drug Test Result" value={driver.drugTestResult} />
          </Section>

          <Section title="Compliance">
            <Item label="Background Check" value={driver.backgroundCheckStatus} />
            <Item label="Saudi Police Check" value={driver.saudiPoliceCheck} />
            <Item label="Home Country Clearance" value={driver.homeCountryClearance} />
            <Item label="SAHER Violations" value={driver.saherViolations?.toString()} />
          </Section>

          {driver.notes && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border)]">Notes</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{driver.notes}</p>
            </div>
          )}

          {/* Leave Management & Calendar */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border)]">Schedule & Leave</h3>

            {loadingSchedule ? (
              <div className="text-sm text-[var(--muted)]">Loading schedule...</div>
            ) : (
              <div className="space-y-6">
                {scheduleData.leaves.filter(l => l.status === 'PENDING').length > 0 && (
                  <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-[var(--warning)] mb-3">Pending Leave Requests</h4>
                    <div className="space-y-2">
                      {scheduleData.leaves.filter(l => l.status === 'PENDING').map(leave => (
                        <div key={leave.id} className="flex items-center justify-between bg-[var(--background)] p-3 rounded-md border border-[var(--warning)]/20">
                          <div>
                            <p className="text-xs font-medium">
                              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-[var(--muted)] mt-1">{leave.reason}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateLeave(leave.id, 'APPROVED')}
                              className="px-3 py-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded text-xs font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateLeave(leave.id, 'REJECTED')}
                              className="px-3 py-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded text-xs font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DriverCalendar orders={scheduleData.orders} leaves={scheduleData.leaves} />
              </div>
            )}
          </div>

          {/* Trip History */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border)]">Recent Trip History</h3>
            {driver.orders && driver.orders.length > 0 ? (
              <>
                <div className="flex gap-4 mb-4">
                  <div className="bg-[var(--surface)] rounded-md px-3 py-2">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Total Trips</p>
                    <p className="text-lg font-semibold tabular-nums">{driver.orders.length}</p>
                  </div>
                  <div className="bg-[var(--surface)] rounded-md px-3 py-2">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Delivered</p>
                    <p className="text-lg font-semibold tabular-nums text-[var(--success)]">{driver.orders.filter((o: any) => o.status === 'DELIVERED').length}</p>
                  </div>
                  <div className="bg-[var(--surface)] rounded-md px-3 py-2">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Completion Rate</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {driver.orders.length > 0 ? Math.round((driver.orders.filter((o: any) => o.status === 'DELIVERED').length / driver.orders.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
                <div className="border border-[var(--border)] rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                        <th className="text-left px-3 py-2 text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">Date</th>
                        <th className="text-left px-3 py-2 text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">Route</th>
                        <th className="text-left px-3 py-2 text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">Vehicle</th>
                        <th className="text-left px-3 py-2 text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driver.orders.slice(0, 5).map((order: any) => (
                        <tr key={order.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-3 py-2 text-[var(--muted)] tabular-nums text-xs">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className="text-[var(--foreground)]">{order.pickupLocation}</span>
                            <span className="text-[var(--muted)] mx-1">→</span>
                            <span className="text-[var(--foreground)]">{order.dropoffLocation}</span>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[var(--muted)]">{order.vehicle?.licensePlate || '—'}</td>
                          <td className={`px-3 py-2 text-[10px] font-medium uppercase tracking-wider ${order.status === 'DELIVERED' ? 'text-[var(--success)]' : order.status === 'IN_TRANSIT' ? 'text-[var(--accent)]' : order.status === 'CANCELLED' ? 'text-[var(--destructive)]' : 'text-[var(--warning)]'
                            }`}>{order.status?.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--muted)]">No trips assigned yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function DriversPage() {
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Personal');
  const [formData, setFormData] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const res = await fetch('/api/drivers');
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value ?? '' }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let uploadedPhotoUrl = formData.profilePhotoUrl;

      if (photoFile) {
        const uploadData = new FormData();
        uploadData.append('file', photoFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          uploadedPhotoUrl = uploadResult.url;
        } else {
          setError(uploadResult.error || 'Failed to upload photo');
          setSubmitting(false);
          return;
        }
      }

      const submitData = { ...formData, profilePhotoUrl: uploadedPhotoUrl };

      const url = editingDriverId ? `/api/drivers/${editingDriverId}` : '/api/drivers';
      const method = editingDriverId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      if (res.ok) {
        setFormData({ ...initialForm });
        setPhotoFile(null);
        setEditingDriverId(null);
        setIsFormOpen(false);
        setActiveTab('Personal');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save driver');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (driver: any) => {
    setSelectedDriver(null);
    setEditingDriverId(driver.id);

    // Format dates to YYYY-MM-DD for input[type="date"]
    const toDateStr = (d: any) => d ? new Date(d).toISOString().split('T')[0] : '';

    // Sanitize driver so null fields fallback to initialForm default or empty string
    const sanitized = { ...initialForm };
    for (const key of Object.keys(initialForm) as (keyof typeof initialForm)[]) {
      const val = driver[key];
      if (val !== null && val !== undefined) {
        if (typeof initialForm[key] === 'boolean') {
          (sanitized as any)[key] = Boolean(val);
        } else {
          (sanitized as any)[key] = String(val);
        }
      }
    }

    setFormData({
      ...sanitized,
      dateOfBirth: toDateStr(driver.dateOfBirth),
      iqamaExpiryDate: toDateStr(driver.iqamaExpiryDate),
      passportIssueDate: toDateStr(driver.passportIssueDate),
      passportExpiryDate: toDateStr(driver.passportExpiryDate),
      visaExpiryDate: toDateStr(driver.visaExpiryDate),
      dateOfJoining: toDateStr(driver.dateOfJoining),
      licenseIssueDate: toDateStr(driver.licenseIssueDate),
      licenseExpiryDate: toDateStr(driver.licenseExpiryDate),
      tgaCardExpiry: toDateStr(driver.tgaCardExpiry),
      medicalCertExpiry: toDateStr(driver.medicalCertExpiry),
      drugTestDate: toDateStr(driver.drugTestDate),
      backgroundCheckDate: toDateStr(driver.backgroundCheckDate),
      saudiPoliceCheckDate: toDateStr(driver.saudiPoliceCheckDate),
      homeCountryClearanceDate: toDateStr(driver.homeCountryClearanceDate),
    });

    setIsFormOpen(true);
    setActiveTab('Personal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Compliance Helpers ──
  const _isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  const _isExpiring30 = (d: string | null) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  type ComplianceLevel = 'clear' | 'warning' | 'critical';

  const getComplianceIssues = (d: any): string[] => {
    const issues: string[] = [];
    // Expired documents
    if (_isExpired(d.licenseExpiryDate)) issues.push('License expired');
    if (_isExpired(d.iqamaExpiryDate)) issues.push('Iqama expired');
    if (_isExpired(d.passportExpiryDate)) issues.push('Passport expired');
    if (_isExpired(d.visaExpiryDate)) issues.push('Visa expired');
    if (_isExpired(d.tgaCardExpiry)) issues.push('TGA card expired');
    if (_isExpired(d.medicalCertExpiry)) issues.push('Medical cert expired');
    // Expiring soon
    if (_isExpiring30(d.licenseExpiryDate)) issues.push('License expiring soon');
    if (_isExpiring30(d.iqamaExpiryDate)) issues.push('Iqama expiring soon');
    if (_isExpiring30(d.passportExpiryDate)) issues.push('Passport expiring soon');
    if (_isExpiring30(d.visaExpiryDate)) issues.push('Visa expiring soon');
    if (_isExpiring30(d.tgaCardExpiry)) issues.push('TGA card expiring soon');
    if (_isExpiring30(d.medicalCertExpiry)) issues.push('Medical cert expiring soon');
    // Failed checks
    if (d.backgroundCheckStatus === 'FAILED') issues.push('Background check failed');
    if (d.saudiPoliceCheck === 'FAILED') issues.push('Saudi police check failed');
    if (d.homeCountryClearance === 'FAILED') issues.push('Home country clearance failed');
    if (d.drugTestResult === 'FAILED') issues.push('Drug test failed');
    // Pending checks
    if (d.backgroundCheckStatus === 'PENDING') issues.push('Background check pending');
    if (d.saudiPoliceCheck === 'PENDING') issues.push('Saudi police check pending');
    if (d.homeCountryClearance === 'PENDING') issues.push('Home country clearance pending');
    return issues;
  };

  const getComplianceLevel = (d: any): ComplianceLevel => {
    const issues = getComplianceIssues(d);
    if (issues.some(i => i.includes('expired') || i.includes('failed'))) return 'critical';
    if (issues.length > 0) return 'warning';
    return 'clear';
  };

  const getTenure = (dateOfJoining: string | null): string => {
    if (!dateOfJoining) return '—';
    const start = new Date(dateOfJoining);
    const now = new Date();
    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) return `${months}m`;
    return months > 0 ? `${years}y ${months}m` : `${years}y`;
  };

  // ── Computed Stats ──
  const activeDriversCount = drivers.filter(d => d.status === 'ACTIVE').length;
  const unavailableCount = drivers.filter(d => d.status === 'ON_LEAVE' || d.status === 'SUSPENDED').length;
  const expiringDocsCount = drivers.filter(d => {
    return _isExpiring30(d.licenseExpiryDate) || _isExpired(d.licenseExpiryDate) ||
      _isExpiring30(d.iqamaExpiryDate) || _isExpired(d.iqamaExpiryDate) ||
      _isExpiring30(d.passportExpiryDate) || _isExpired(d.passportExpiryDate) ||
      _isExpiring30(d.visaExpiryDate) || _isExpired(d.visaExpiryDate) ||
      _isExpiring30(d.tgaCardExpiry) || _isExpired(d.tgaCardExpiry) ||
      _isExpiring30(d.medicalCertExpiry) || _isExpired(d.medicalCertExpiry);
  }).length;
  const complianceAlertDrivers = drivers.filter(d => {
    return d.backgroundCheckStatus === 'FAILED' || d.backgroundCheckStatus === 'PENDING' ||
      d.saudiPoliceCheck === 'FAILED' || d.saudiPoliceCheck === 'PENDING' ||
      d.homeCountryClearance === 'FAILED' || d.homeCountryClearance === 'PENDING' ||
      d.drugTestResult === 'FAILED';
  });

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Phone', 'Status', 'Nationality', 'License Expiry', 'Iqama Expiry', 'Compliance'];
    const rows = filteredDrivers.map(d => [
      d.employeeId,
      `${d.firstName} ${d.lastName}`,
      d.phone,
      d.status,
      d.nationality || '',
      d.licenseExpiryDate ? new Date(d.licenseExpiryDate).toISOString().split('T')[0] : '',
      d.iqamaExpiryDate ? new Date(d.iqamaExpiryDate).toISOString().split('T')[0] : '',
      getComplianceLevel(d).toUpperCase(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drivers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filter & Sort & Paginate ──
  let filteredDrivers = drivers.filter(d => {
    const matchesSearch = (d.firstName + ' ' + d.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.iqamaNumber && d.iqamaNumber.includes(searchQuery)) ||
      (d.phone && d.phone.includes(searchQuery)) ||
      (d.nationality && d.nationality.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (sortConfig) {
    filteredDrivers.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'name') {
        aVal = (a.firstName + ' ' + a.lastName).toLowerCase();
        bVal = (b.firstName + ' ' + b.lastName).toLowerCase();
      }
      if (sortConfig.key === 'compliance') {
        const order = { critical: 0, warning: 1, clear: 2 };
        aVal = order[getComplianceLevel(a)];
        bVal = order[getComplianceLevel(b)];
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Drivers</h1>
          <p className="text-sm text-[var(--muted)]">{drivers.length} registered driver{drivers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isFormOpen && (
            <div className="flex bg-[var(--surface)] p-1 rounded-md border border-[var(--border)]">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'list' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('schedule')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'schedule' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              >
                Schedule View
              </button>
            </div>
          )}
          <button
            onClick={() => {
              if (isFormOpen) {
                setIsFormOpen(false);
                setEditingDriverId(null);
                setFormData({ ...initialForm });
              } else {
                setIsFormOpen(true);
                setActiveTab('Personal');
                setError('');
                setEditingDriverId(null);
                setFormData({ ...initialForm });
              }
            }}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 ${isFormOpen ? 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]' : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
              }`}
          >
            {isFormOpen ? 'Cancel' : 'Add Driver'}
          </button>
        </div>
      </div>

      {/* ── Stats & Filters ── */}
      {!isFormOpen && viewMode === 'list' && (
        <div className="mb-8 space-y-5">
          {/* 5-Card Stats */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider mb-1">Total Drivers</p>
              <p className="text-2xl font-semibold tabular-nums">{drivers.length}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider mb-1">Active / Available</p>
              <p className="text-2xl font-semibold text-[var(--success)] tabular-nums">{activeDriversCount}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider mb-1">On Leave / Suspended</p>
              <p className="text-2xl font-semibold text-[var(--secondary)] tabular-nums">{unavailableCount}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider mb-1">Expiring Docs (30d)</p>
              <p className="text-2xl font-semibold text-[var(--warning)] tabular-nums">{expiringDocsCount}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider mb-1">Compliance Alerts</p>
              <p className="text-2xl font-semibold text-[var(--destructive)] tabular-nums">{complianceAlertDrivers.length}</p>
            </div>
          </div>

          {/* Compliance Alerts Panel */}
          {complianceAlertDrivers.length > 0 && (
            <div className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 rounded-lg overflow-hidden">
              <button
                onClick={() => setAlertsExpanded(!alertsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--destructive)]/10 transition-colors"
              >
                <span className="text-xs font-semibold text-[var(--destructive)] uppercase tracking-wider">
                  ⚠ {complianceAlertDrivers.length} driver{complianceAlertDrivers.length !== 1 ? 's' : ''} with compliance issues
                </span>
                <span className="text-[var(--muted)] text-xs">{alertsExpanded ? '▲ Collapse' : '▼ Expand'}</span>
              </button>
              {alertsExpanded && (
                <div className="border-t border-[var(--destructive)]/10 px-4 py-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {complianceAlertDrivers.map(d => (
                    <div key={d.id} className="flex items-start gap-3 py-1.5 text-sm">
                      <span className="font-mono text-xs text-[var(--accent)] shrink-0 pt-0.5">{d.employeeId}</span>
                      <span className="font-medium shrink-0">{d.firstName} {d.lastName}</span>
                      <span className="text-[var(--muted)] text-xs leading-relaxed">
                        {getComplianceIssues(d).map((issue, i) => (
                          <span key={i} className={`inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${issue.includes('expired') || issue.includes('failed')
                              ? 'text-[var(--destructive)] bg-[var(--destructive)]/10'
                              : 'text-[var(--warning)] bg-[var(--warning)]/10'
                            }`}>
                            {issue}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search, Filter, Export */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by name, ID, Iqama, phone, nationality..."
              className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 outline-none focus:border-[var(--accent)] transition-colors"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            <select
              className="bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
            <button
              onClick={exportCSV}
              className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors whitespace-nowrap"
            >
              ↓ Export CSV
            </button>
          </div>
        </div>
      )}

      {/* ── Creation Form ── */}
      {isFormOpen && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] mb-8 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)] overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab
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

            {/* ── Personal ── */}
            {activeTab === 'Personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="First Name" required>
                    <input required className={inputClass} value={formData.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Mohammed" />
                  </Field>
                  <Field label="Last Name" required>
                    <input required className={inputClass} value={formData.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Al-Rashidi" />
                  </Field>
                  <Field label="Date of Birth" required>
                    <input required type="date" className={inputClass} value={formData.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Profile Photo">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--surface)] file:text-[var(--foreground)] hover:file:bg-[var(--border)] cursor-pointer"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setPhotoFile(file);
                      }}
                    />
                  </Field>
                  <Field label="Gender">
                    <select className={selectClass} value={formData.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </Field>
                  <Field label="Blood Group">
                    <select className={selectClass} value={formData.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{BLOOD_LABELS[bg]}</option>)}
                    </select>
                  </Field>
                  <Field label="Nationality">
                    <input className={inputClass} value={formData.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Indian, Pakistani, Saudi" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Residency & Passport ── */}
            {activeTab === 'Residency & Passport' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Saudi Residency</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Residency Type" required>
                    <select className={selectClass} value={formData.residencyType} onChange={e => set('residencyType', e.target.value)}>
                      <option value="IQAMA_HOLDER">Iqama Holder (Expat)</option>
                      <option value="SAUDI_NATIONAL">Saudi National</option>
                      <option value="VISIT_VISA">Visit Visa</option>
                      <option value="TRANSIT">Transit</option>
                    </select>
                  </Field>
                  <Field label="Iqama Number">
                    <input className={inputClass} value={formData.iqamaNumber} onChange={e => set('iqamaNumber', e.target.value)} placeholder="2xxxxxxxxx" />
                  </Field>
                  <Field label="Iqama Expiry">
                    <input type="date" className={inputClass} value={formData.iqamaExpiryDate} onChange={e => set('iqamaExpiryDate', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="National ID (Saudi Citizens)">
                    <input className={inputClass} value={formData.nationalIdNumber} onChange={e => set('nationalIdNumber', e.target.value)} placeholder="1xxxxxxxxx" />
                  </Field>
                  <Field label="Sponsor / Kafeel">
                    <input className={inputClass} value={formData.sponsorName} onChange={e => set('sponsorName', e.target.value)} placeholder="Company or individual" />
                  </Field>
                  <Field label="Border Number">
                    <input className={inputClass} value={formData.borderNumber} onChange={e => set('borderNumber', e.target.value)} placeholder="Entry border number" />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Passport & Visa</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Passport Number">
                    <input className={inputClass} value={formData.passportNumber} onChange={e => set('passportNumber', e.target.value)} placeholder="Passport number" />
                  </Field>
                  <Field label="Issuing Country">
                    <input className={inputClass} value={formData.passportIssuingCountry} onChange={e => set('passportIssuingCountry', e.target.value)} placeholder="e.g. India" />
                  </Field>
                  <Field label="Passport Expiry">
                    <input type="date" className={inputClass} value={formData.passportExpiryDate} onChange={e => set('passportExpiryDate', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Visa Type">
                    <select className={selectClass} value={formData.visaType} onChange={e => set('visaType', e.target.value)}>
                      <option value="">Select</option>
                      <option value="WORK_VISA">Work Visa</option>
                      <option value="VISIT_VISA">Visit Visa</option>
                      <option value="TRANSIT_VISA">Transit Visa</option>
                      <option value="HAJJ_UMRAH">Hajj / Umrah</option>
                      <option value="PREMIUM_RESIDENCY">Premium Residency</option>
                    </select>
                  </Field>
                  <Field label="Visa Expiry">
                    <input type="date" className={inputClass} value={formData.visaExpiryDate} onChange={e => set('visaExpiryDate', e.target.value)} />
                  </Field>
                  <div />
                </div>
              </div>
            )}

            {/* ── Contact ── */}
            {activeTab === 'Contact' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Phone & Email</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Phone (KSA)" required>
                    <input required className={inputClass} value={formData.phone} onChange={e => set('phone', e.target.value)} placeholder="+966 5x xxx xxxx" />
                  </Field>
                  <Field label="Alternate Phone">
                    <input className={inputClass} value={formData.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} placeholder="Home country number" />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputClass} value={formData.email} onChange={e => set('email', e.target.value)} placeholder="driver@email.com" />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Address (KSA)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Current Address" required>
                    <input required className={inputClass} value={formData.currentAddress} onChange={e => set('currentAddress', e.target.value)} placeholder="Street, Building, Apt" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="City">
                    <select className={selectClass} value={formData.city} onChange={e => set('city', e.target.value)}>
                      <option value="">Select</option>
                      {['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Tabuk', 'Abha', 'Jizan', 'Hail', 'Al Khobar', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Region">
                    <input className={inputClass} value={formData.region} onChange={e => set('region', e.target.value)} placeholder="e.g. Eastern Province" />
                  </Field>
                  <Field label="Postal Code">
                    <input className={inputClass} value={formData.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="5-digit code" maxLength={5} />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Home Country Address</h3>
                <Field label="Permanent Address">
                  <input className={inputClass} value={formData.permanentAddress} onChange={e => set('permanentAddress', e.target.value)} placeholder="Home country address" />
                </Field>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Contact Name" required>
                    <input required className={inputClass} value={formData.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} placeholder="Full name" />
                  </Field>
                  <Field label="Contact Phone" required>
                    <input required className={inputClass} value={formData.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} placeholder="Phone number" />
                  </Field>
                  <Field label="Relationship" required>
                    <input required className={inputClass} value={formData.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} placeholder="e.g. Spouse, Brother" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Employment ── */}
            {activeTab === 'Employment' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Date of Joining" required>
                    <input required type="date" className={inputClass} value={formData.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} />
                  </Field>
                  <Field label="Employment Type" required>
                    <select className={selectClass} value={formData.employmentType} onChange={e => set('employmentType', e.target.value)}>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className={selectClass} value={formData.status} onChange={e => set('status', e.target.value)}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Department">
                    <input className={inputClass} value={formData.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Long Haul, Last Mile" />
                  </Field>
                  <Field label="Monthly Salary (SAR)">
                    <input type="number" className={inputClass} value={formData.salary} onChange={e => set('salary', e.target.value)} placeholder="3500" />
                  </Field>
                  <Field label="GOSI Number">
                    <input className={inputClass} value={formData.gosiNumber} onChange={e => set('gosiNumber', e.target.value)} placeholder="Social insurance number" />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank Name">
                    <select className={selectClass} value={formData.bankName} onChange={e => set('bankName', e.target.value)}>
                      <option value="">Select</option>
                      {['Al Rajhi Bank', 'Saudi National Bank (SNB)', 'Alinma Bank', 'Riyad Bank', 'Bank Albilad', 'Saudi Awwal Bank (SAB)', 'Arab National Bank', 'Banque Saudi Fransi', 'Other'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="IBAN">
                    <input className={inputClass} value={formData.ibanNumber} onChange={e => set('ibanNumber', e.target.value)} placeholder="SA + 22 digits" maxLength={24} />
                  </Field>
                </div>

                <Field label="Admin Notes">
                  <textarea className={inputClass + ' min-h-[80px] resize-y'} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes about this driver..." />
                </Field>
              </div>
            )}

            {/* ── License & TGA ── */}
            {activeTab === 'License & TGA' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Saudi Driving License (Muroor)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="License Number" required>
                    <input required className={inputClass} value={formData.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="License number" />
                  </Field>
                  <Field label="License Type" required>
                    <select className={selectClass} value={formData.licenseType} onChange={e => set('licenseType', e.target.value)}>
                      <option value="PRIVATE">Private (Light Vehicles)</option>
                      <option value="PUBLIC_LIGHT">Public Light (Taxi)</option>
                      <option value="PUBLIC_HEAVY">Public Heavy (Bus)</option>
                      <option value="HEAVY_EQUIPMENT">Heavy Equipment (Trucks)</option>
                      <option value="MOTORCYCLE">Motorcycle</option>
                    </select>
                  </Field>
                  <Field label="Issuing Authority (Muroor)">
                    <input className={inputClass} value={formData.licenseIssuingAuthority} onChange={e => set('licenseIssuingAuthority', e.target.value)} placeholder="e.g. Riyadh Muroor" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Issue Date" required>
                    <input required type="date" className={inputClass} value={formData.licenseIssueDate} onChange={e => set('licenseIssueDate', e.target.value)} />
                  </Field>
                  <Field label="Expiry Date" required>
                    <input required type="date" className={inputClass} value={formData.licenseExpiryDate} onChange={e => set('licenseExpiryDate', e.target.value)} />
                  </Field>
                  <div />
                </div>
                <div className="flex gap-6 py-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.hazmatCertified as boolean} onChange={e => set('hazmatCertified', e.target.checked)} className="rounded border-[var(--border)] accent-[var(--accent)]" />
                    <span className="text-[var(--muted)]">Hazmat Certified</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.defensiveDrivingCert as boolean} onChange={e => set('defensiveDrivingCert', e.target.checked)} className="rounded border-[var(--border)] accent-[var(--accent)]" />
                    <span className="text-[var(--muted)]">Defensive Driving Certificate</span>
                  </label>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Transport General Authority (TGA)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="WASEL Registration">
                    <input className={inputClass} value={formData.waselRegistrationNumber} onChange={e => set('waselRegistrationNumber', e.target.value)} placeholder="MOT WASEL number" />
                  </Field>
                  <Field label="TGA Card Number">
                    <input className={inputClass} value={formData.tgaCardNumber} onChange={e => set('tgaCardNumber', e.target.value)} placeholder="TGA professional card" />
                  </Field>
                  <Field label="TGA Card Expiry">
                    <input type="date" className={inputClass} value={formData.tgaCardExpiry} onChange={e => set('tgaCardExpiry', e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Medical ── */}
            {activeTab === 'Medical' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Medical Fitness">
                    <select className={selectClass} value={formData.medicalFitness} onChange={e => set('medicalFitness', e.target.value)}>
                      <option value="PENDING">Pending</option>
                      <option value="FIT">Fit</option>
                      <option value="UNFIT">Unfit</option>
                    </select>
                  </Field>
                  <Field label="Medical Certificate Expiry">
                    <input type="date" className={inputClass} value={formData.medicalCertExpiry} onChange={e => set('medicalCertExpiry', e.target.value)} />
                  </Field>
                  <Field label="Certificate URL">
                    <input className={inputClass} value={formData.medicalCertificateUrl} onChange={e => set('medicalCertificateUrl', e.target.value)} placeholder="URL to certificate" />
                  </Field>
                </div>
                <Field label="Known Medical Conditions">
                  <textarea className={inputClass + ' min-h-[60px] resize-y'} value={formData.knownMedicalConditions} onChange={e => set('knownMedicalConditions', e.target.value)} placeholder="Any known conditions..." />
                </Field>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Drug & Substance Testing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Last Drug Test Date">
                    <input type="date" className={inputClass} value={formData.drugTestDate} onChange={e => set('drugTestDate', e.target.value)} />
                  </Field>
                  <Field label="Drug Test Result">
                    <select className={selectClass} value={formData.drugTestResult} onChange={e => set('drugTestResult', e.target.value)}>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Passed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Compliance ── */}
            {activeTab === 'Compliance' && (
              <div className="space-y-5">
                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Background Verification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Background Check Status">
                    <select className={selectClass} value={formData.backgroundCheckStatus} onChange={e => set('backgroundCheckStatus', e.target.value)}>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </Field>
                  <Field label="Background Check Date">
                    <input type="date" className={inputClass} value={formData.backgroundCheckDate} onChange={e => set('backgroundCheckDate', e.target.value)} />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Police Clearance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Saudi Police Clearance">
                    <select className={selectClass} value={formData.saudiPoliceCheck} onChange={e => set('saudiPoliceCheck', e.target.value)}>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </Field>
                  <Field label="Saudi Police Check Date">
                    <input type="date" className={inputClass} value={formData.saudiPoliceCheckDate} onChange={e => set('saudiPoliceCheckDate', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Home Country Police Clearance">
                    <select className={selectClass} value={formData.homeCountryClearance} onChange={e => set('homeCountryClearance', e.target.value)}>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </Field>
                  <Field label="Home Country Clearance Date">
                    <input type="date" className={inputClass} value={formData.homeCountryClearanceDate} onChange={e => set('homeCountryClearanceDate', e.target.value)} />
                  </Field>
                </div>

                <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider pt-2">Traffic</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SAHER Violations Count">
                    <input type="number" className={inputClass} value={formData.saherViolations} onChange={e => set('saherViolations', e.target.value)} placeholder="0" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                {TABS.indexOf(activeTab) > 0 && (
                  <button type="button" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1])} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-2 rounded-md hover:bg-[var(--surface)] transition-colors">
                    ← Previous
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {TABS.indexOf(activeTab) < TABS.length - 1 ? (
                  <button type="button" onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                    Next →
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
                    {submitting ? 'Saving...' : editingDriverId ? 'Update Driver' : 'Create Driver'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Main View ── */}
      {!isFormOpen && viewMode === 'schedule' && (
        <MasterScheduleView drivers={paginatedDrivers} />
      )}

      {!isFormOpen && viewMode === 'list' && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] select-none" onClick={() => handleSort('employeeId')}>ID {sortConfig?.key === 'employeeId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] select-none" onClick={() => handleSort('name')}>Driver {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] select-none" onClick={() => handleSort('nationality')}>Nationality {sortConfig?.key === 'nationality' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Tenure</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] select-none" onClick={() => handleSort('licenseExpiryDate')}>License Exp. {sortConfig?.key === 'licenseExpiryDate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] select-none" onClick={() => handleSort('status')}>Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] select-none" onClick={() => handleSort('compliance')}>Compliance {sortConfig?.key === 'compliance' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--muted)]">Loading...</td></tr>
              ) : paginatedDrivers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--muted)]">{drivers.length === 0 ? 'No drivers registered. Click "Add Driver" to get started.' : 'No drivers match your search.'}</td></tr>
              ) : (
                paginatedDrivers.map((driver, i) => {
                  const compliance = getComplianceLevel(driver);
                  const complianceDotColor = compliance === 'critical' ? 'bg-[var(--destructive)]' : compliance === 'warning' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]';
                  const complianceLabel = compliance === 'critical' ? 'Critical' : compliance === 'warning' ? 'Warning' : 'Clear';
                  return (
                    <tr
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      className={`hover:bg-[var(--surface)] transition-colors duration-100 cursor-pointer ${i < paginatedDrivers.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-xs text-[var(--accent)]">{driver.employeeId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {driver.profilePhotoUrl ? (
                            <img src={driver.profilePhotoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--border)]" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--muted)]">
                              {driver.firstName?.[0]}{driver.lastName?.[0]}
                            </div>
                          )}
                          <span className="text-sm font-medium">{driver.firstName} {driver.lastName}</span>
                          {driver._count?.leaves > 0 && (
                            <span
                              title={`${driver._count.leaves} pending leave request(s)`}
                              className="bg-[var(--warning)] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm"
                            >
                              {driver._count.leaves}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)] tabular-nums">{driver.phone}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">{driver.nationality || '—'}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)] tabular-nums">{getTenure(driver.dateOfJoining)}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        <span className={_isExpired(driver.licenseExpiryDate) ? 'text-[var(--destructive)]' : _isExpiring30(driver.licenseExpiryDate) ? 'text-[var(--warning)]' : 'text-[var(--muted)]'}>
                          {new Date(driver.licenseExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium uppercase tracking-wider ${STATUS_COLORS[driver.status] || ''}`}>
                        {driver.status?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5" title={getComplianceIssues(driver).join(', ') || 'All clear'}>
                          <span className={`w-2 h-2 rounded-full ${complianceDotColor}`} />
                          <span className={`text-[10px] font-medium uppercase tracking-wider ${compliance === 'critical' ? 'text-[var(--destructive)]' : compliance === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--success)]'
                            }`}>{complianceLabel}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="border-t border-[var(--border)] px-4 py-3 flex items-center justify-between bg-[var(--surface)]">
              <p className="text-xs text-[var(--muted)]">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} of {filteredDrivers.length} drivers
              </p>
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2.5 py-1 border border-[var(--border)] rounded text-xs disabled:opacity-50 hover:bg-[var(--border)] transition-colors">← Prev</button>
                <span className="px-2.5 py-1 text-xs text-[var(--muted)] tabular-nums">{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2.5 py-1 border border-[var(--border)] rounded text-xs disabled:opacity-50 hover:bg-[var(--border)] transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedDriver && <DriverDetail driver={selectedDriver} onClose={() => setSelectedDriver(null)} onEdit={() => handleEdit(selectedDriver)} />}
    </div>
  );
}
