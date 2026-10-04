'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, MapPin, Calendar, DollarSign, Search, Plus, X, FileText, Activity, AlertCircle, Building2, User } from 'lucide-react';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { value: 'IN_TRANSIT', label: 'In Transit', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { value: 'DELIVERED', label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

const CARGO_TYPES = ['GENERAL', 'HAZMAT', 'COLD_CHAIN', 'FRAGILE'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Form State
  const [submitting, setSubmitting] = useState(false);
  const initialForm = {
    customerId: '', customerPoNumber: '', referenceNumber: '',
    pickupLocation: '', pickupCity: '', pickupContactName: '', pickupContactPhone: '',
    dropoffLocation: '', dropoffCity: '', dropoffContactName: '', dropoffContactPhone: '',
    cargoDescription: '', cargoType: 'GENERAL', weightKg: '', volumeCbm: '', pallets: '',
    totalAmount: '', currency: 'SAR', paymentStatus: 'UNPAID',
    scheduledPickup: '', scheduledDelivery: '',
    assignedDriverId: '', assignedVehicleId: '', status: 'PENDING', notes: ''
  };
  const [formData, setFormData] = useState({ ...initialForm });

  const fetchAll = async () => {
    try {
      const [ordersRes, customersRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/orders?search=' + encodeURIComponent(searchQuery)),
        fetch('/api/customers'), fetch('/api/drivers'), fetch('/api/vehicles')
      ]);
      setOrders(await ordersRes.json());
      setCustomers(await customersRes.json());
      setDrivers(await driversRes.json());
      setVehicles(await vehiclesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ ...initialForm });
        setIsFormOpen(false);
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = (val: string) => ORDER_STATUSES.find(s => s.value === val) || ORDER_STATUSES[0];

  const Field = ({ label, children, required }: any) => (
    <div>
      <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const inputClass = "w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]/40";

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Orders & Dispatch</h1>
          <p className="text-sm text-[var(--muted)]">Manage customer orders, routing, and dispatch.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[var(--foreground)]/10"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">Total Orders</h3>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4 text-[var(--foreground)]" />
            </div>
          </div>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">In Transit</h3>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{orders.filter(o => o.status === 'IN_TRANSIT').length}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">Pending Dispatch</h3>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{orders.filter(o => o.status === 'PENDING').length}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">Completed</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{orders.filter(o => o.status === 'DELIVERED').length}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/30">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search tracking, customer, locations..."
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-[var(--accent)] outline-none transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Tracking</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Route</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Schedule</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[var(--muted)]">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[var(--muted)]">No orders found.</td></tr>
            ) : (
              orders.map((o) => {
                const s = getStatus(o.status);
                return (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-[var(--surface)] cursor-pointer transition-colors border-b border-[var(--border)] last:border-0 group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${s.bg} ${s.color} ${s.border}`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold">{o.trackingNumber}</p>
                          <p className="text-[11px] text-[var(--muted)] uppercase">{o.cargoType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{o.customer?.companyName || 'Unknown'}</p>
                      {o.customerPoNumber && <p className="text-[11px] font-mono text-[var(--muted)]">PO: {o.customerPoNumber}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{o.pickupCity || o.pickupLocation.split(',')[0]}</span>
                        <Truck className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className="font-medium">{o.dropoffCity || o.dropoffLocation.split(',')[0]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {o.scheduledPickup ? (
                        <p className="text-sm text-[var(--muted)]">{new Date(o.scheduledPickup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.color} ${s.border}`}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setIsFormOpen(false)} />
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--foreground)] flex items-center justify-center text-[var(--background)]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">New Dispatch Order</h2>
                  <p className="text-xs text-[var(--muted)]">Create a new logistics order</p>
                </div>
              </div>
              <button onClick={() => !submitting && setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-8">
                {/* 1. Customer & Reference */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <Building2 className="w-4 h-4" /> Customer & Reference
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Customer" required>
                      <select required className={inputClass} value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                        <option value="">Select Customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName} ({c.accountNumber})</option>)}
                      </select>
                    </Field>
                    <Field label="Customer PO Number">
                      <input type="text" className={inputClass} placeholder="PO-2023-991" value={formData.customerPoNumber} onChange={e => setFormData({ ...formData, customerPoNumber: e.target.value })} />
                    </Field>
                    <Field label="External Ref">
                      <input type="text" className={inputClass} placeholder="REF-88" value={formData.referenceNumber} onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })} />
                    </Field>
                  </div>
                </div>

                {/* 2. Routing */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <MapPin className="w-4 h-4" /> Routing & Addresses
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    {/* Pickup */}
                    <div className="space-y-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                      <h4 className="font-semibold text-sm">Pickup Details</h4>
                      <Field label="Address" required><input required className={inputClass} placeholder="123 Warehouse St" value={formData.pickupLocation} onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })} /></Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="City"><input className={inputClass} placeholder="Riyadh" value={formData.pickupCity} onChange={e => setFormData({ ...formData, pickupCity: e.target.value })} /></Field>
                        <Field label="Contact Name"><input className={inputClass} placeholder="Ahmed" value={formData.pickupContactName} onChange={e => setFormData({ ...formData, pickupContactName: e.target.value })} /></Field>
                        <Field label="Contact Phone"><input className={inputClass} placeholder="0500000000" value={formData.pickupContactPhone} onChange={e => setFormData({ ...formData, pickupContactPhone: e.target.value })} /></Field>
                        <Field label="Scheduled Date"><input type="date" className={inputClass} value={formData.scheduledPickup} onChange={e => setFormData({ ...formData, scheduledPickup: e.target.value })} /></Field>
                      </div>
                    </div>
                    {/* Dropoff */}
                    <div className="space-y-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                      <h4 className="font-semibold text-sm">Drop-off Details</h4>
                      <Field label="Address" required><input required className={inputClass} placeholder="456 Retail Blvd" value={formData.dropoffLocation} onChange={e => setFormData({ ...formData, dropoffLocation: e.target.value })} /></Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="City"><input className={inputClass} placeholder="Jeddah" value={formData.dropoffCity} onChange={e => setFormData({ ...formData, dropoffCity: e.target.value })} /></Field>
                        <Field label="Contact Name"><input className={inputClass} placeholder="Sarah" value={formData.dropoffContactName} onChange={e => setFormData({ ...formData, dropoffContactName: e.target.value })} /></Field>
                        <Field label="Contact Phone"><input className={inputClass} placeholder="0500000000" value={formData.dropoffContactPhone} onChange={e => setFormData({ ...formData, dropoffContactPhone: e.target.value })} /></Field>
                        <Field label="Scheduled Date"><input type="date" className={inputClass} value={formData.scheduledDelivery} onChange={e => setFormData({ ...formData, scheduledDelivery: e.target.value })} /></Field>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Cargo & Pricing */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <FileText className="w-4 h-4" /> Cargo & Financials
                  </h3>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="col-span-2"><Field label="Description"><input className={inputClass} placeholder="Electronics, Medical Supplies, etc." value={formData.cargoDescription} onChange={e => setFormData({ ...formData, cargoDescription: e.target.value })} /></Field></div>
                    <Field label="Cargo Type">
                      <select className={inputClass} value={formData.cargoType} onChange={e => setFormData({ ...formData, cargoType: e.target.value })}>
                        {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Pallets"><input type="number" className={inputClass} placeholder="10" value={formData.pallets} onChange={e => setFormData({ ...formData, pallets: e.target.value })} /></Field>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="Weight (KG)"><input type="number" className={inputClass} placeholder="1500" value={formData.weightKg} onChange={e => setFormData({ ...formData, weightKg: e.target.value })} /></Field>
                    <Field label="Volume (CBM)"><input type="number" step="0.1" className={inputClass} placeholder="2.5" value={formData.volumeCbm} onChange={e => setFormData({ ...formData, volumeCbm: e.target.value })} /></Field>
                    <Field label="Amount"><input type="number" className={inputClass} placeholder="5000" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} /></Field>
                    <Field label="Payment Status">
                      <select className={inputClass} value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </Field>
                  </div>
                </div>

                {/* 4. Dispatch */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <Truck className="w-4 h-4" /> Dispatch (Optional)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Assign Driver">
                      <select className={inputClass} value={formData.assignedDriverId} onChange={e => setFormData({ ...formData, assignedDriverId: e.target.value })}>
                        <option value="">Unassigned</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                      </select>
                    </Field>
                    <Field label="Assign Vehicle">
                      <select className={inputClass} value={formData.assignedVehicleId} onChange={e => setFormData({ ...formData, assignedVehicleId: e.target.value })}>
                        <option value="">Unassigned</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} ({v.vehicleType})</option>)}
                      </select>
                    </Field>
                    <Field label="Initial Status">
                      <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label="Internal Notes">
                      <textarea className={`${inputClass} min-h-[80px] resize-none`} placeholder="Specific requirements or dispatch notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 p-6 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-end gap-3 z-10">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getStatus(selectedOrder.status).bg} ${getStatus(selectedOrder.status).color} ${getStatus(selectedOrder.status).border}`}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-mono tracking-tight">{selectedOrder.trackingNumber}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatus(selectedOrder.status).bg} ${getStatus(selectedOrder.status).color} ${getStatus(selectedOrder.status).border}`}>
                      {getStatus(selectedOrder.status).label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{selectedOrder.customer?.companyName} {selectedOrder.customerPoNumber ? `(PO: ${selectedOrder.customerPoNumber})` : ''}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Pickup</h3>
                  <p className="text-sm">{selectedOrder.pickupLocation}</p>
                  <div className="text-sm text-[var(--muted)] grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                    <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">City</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.pickupCity || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Scheduled</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.scheduledPickup ? new Date(selectedOrder.scheduledPickup).toLocaleDateString() : '—'}</span></div>
                    <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wider mb-0.5">Contact</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.pickupContactName || '—'} {selectedOrder.pickupContactPhone ? `(${selectedOrder.pickupContactPhone})` : ''}</span></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Drop-off</h3>
                  <p className="text-sm">{selectedOrder.dropoffLocation}</p>
                  <div className="text-sm text-[var(--muted)] grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                    <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">City</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.dropoffCity || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Scheduled</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.scheduledDelivery ? new Date(selectedOrder.scheduledDelivery).toLocaleDateString() : '—'}</span></div>
                    <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wider mb-0.5">Contact</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.dropoffContactName || '—'} {selectedOrder.dropoffContactPhone ? `(${selectedOrder.dropoffContactPhone})` : ''}</span></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Cargo</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Type</span><span className="font-medium">{selectedOrder.cargoType}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Description</span><span className="font-medium truncate max-w-[150px]">{selectedOrder.cargoDescription || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Weight</span><span className="font-medium">{selectedOrder.weightKg ? `${selectedOrder.weightKg} kg` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Volume</span><span className="font-medium">{selectedOrder.volumeCbm ? `${selectedOrder.volumeCbm} CBM` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Pallets</span><span className="font-medium">{selectedOrder.pallets || '—'}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Financial</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Amount</span><span className="font-medium font-mono">{selectedOrder.totalAmount ? `${selectedOrder.totalAmount} ${selectedOrder.currency}` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Payment Status</span><span className="font-medium">{selectedOrder.paymentStatus}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Ref Number</span><span className="font-medium">{selectedOrder.referenceNumber || '—'}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Dispatch</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Driver</span><span className="font-medium">{selectedOrder.driver ? `${selectedOrder.driver.firstName} ${selectedOrder.driver.lastName}` : 'Unassigned'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Vehicle</span><span className="font-medium">{selectedOrder.vehicle?.licensePlate || 'Unassigned'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Created At</span><span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
