'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Truck, MapPin, Calendar, Search, Plus, X, FileText, Activity,
  Building2, ChevronDown, ChevronRight, Check, Trash2, ArrowUpDown,
  Clock, User, CreditCard, AlertTriangle, Copy, ExternalLink
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full bg-[var(--background)] rounded flex items-center justify-center text-sm text-[var(--muted)] border border-[var(--border)]">
      Loading map...
    </div>
  ),
});

/* ─── Constants ─── */

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  { value: 'IN_TRANSIT', label: 'In Transit', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  { value: 'DELIVERED', label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
];

const CARGO_TYPES = ['GENERAL', 'HAZMAT', 'COLD_CHAIN', 'FRAGILE'];

/* ─── Small Reusable Components ─── */

const Field = ({ label, children, required, className = '' }: any) => (
  <div className={className}>
    <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const s = ORDER_STATUSES.find(st => st.value === status) || ORDER_STATUSES[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.color} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface)]/30 hover:bg-[var(--surface)]/60 transition-colors"
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="uppercase tracking-wider text-[11px]">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-4 border-t border-[var(--border)]">{children}</div>}
    </div>
  );
};

/* ─── Customer Search Combobox ─── */

const CustomerSearch = ({ customers, value, onChange }: { customers: any[]; value: string; onChange: (id: string, customer: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = customers.find(c => c.id === value);
  const filtered = query
    ? customers.filter(c =>
        c.companyName.toLowerCase().includes(query.toLowerCase()) ||
        c.accountNumber.toLowerCase().includes(query.toLowerCase()) ||
        (c.contactPerson || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : customers.slice(0, 8);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-left hover:border-[var(--accent)]/50 transition-colors"
      >
        <Building2 className="w-4 h-4 text-[var(--muted)] shrink-0" />
        {selected ? (
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block">{selected.companyName}</span>
          </div>
        ) : (
          <span className="text-[var(--muted)] flex-1">Search customers…</span>
        )}
        <ChevronDown className={`w-4 h-4 text-[var(--muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-slide-down">
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type to search…"
                className="w-full bg-[var(--surface)] rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder:text-[var(--muted)]/50"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">No customers found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id, c); setOpen(false); setQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface)] transition-colors ${value === c.id ? 'bg-[var(--accent)]/5' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--muted)]">
                    {c.companyName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{c.companyName}</p>
                    <p className="text-[11px] text-[var(--muted)] truncate">{c.accountNumber} · {c.contactPerson || c.email}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {c.status || 'ACTIVE'}
                    </span>
                    {value === c.id && <Check className="w-4 h-4 text-[var(--accent)]" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Orders Page Content ─── */

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formStep, setFormStep] = useState(1);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  type LocationType = 'PICKUP' | 'DROPOFF' | 'INTERMEDIATE';

  const createInitialLocation = (type: LocationType = 'PICKUP') => ({
    type,
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'SA',
    latitude: null as number | null,
    longitude: null as number | null,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    scheduledDate: '',
    instructions: '',
  });

  const initialForm = {
    customerId: '', customerPoNumber: '', referenceNumber: '',
    requestedDate: '', requestedBy: '', division: '', brand: '',
    waybillNumber: '', deliveryNoteNumber: '', invoiceNumber: '', rfqNumber: '', attachmentReferences: '',
    locations: [createInitialLocation('PICKUP'), createInitialLocation('DROPOFF')],
    cargoDescription: '', cargoType: 'GENERAL', weightKg: '', volumeCbm: '', pallets: '',
    totalAmount: '', costAmount: '', driverTa: '', tripCost: '', currency: 'SAR', paymentStatus: 'UNPAID',
    serviceProvider: '', serviceProviderName: '', externalDriverName: '', externalVehicleNumber: '', externalVehicleType: '',
    deliveryStatus: '', podStatus: '', receiver: '', transitTime: '', deliveryDurationHours: '',
    actualPickup: '', actualDelivery: '', unloadingFinishedAt: '',
    waitingLabor: '', additionalComments: '', handledBy: '', confirmedBy: '', auditPro: '',
    assignedDriverId: '', assignedVehicleId: '', status: 'PENDING', notes: ''
  };
  const [formData, setFormData] = useState({ ...initialForm });
  const isCompanyFleet = formData.serviceProvider === 'COMPANY';
  const isOutsourced = formData.serviceProvider === 'OUTSOURCE';

  const workflowSteps = [
    { number: 1, label: 'Customer', icon: Building2 },
    { number: 2, label: 'Route & Cargo', icon: MapPin },
    { number: 3, label: 'Dispatch', icon: Truck },
    { number: 4, label: 'Confirm', icon: Check },
  ];

  const inputClass = "w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--muted)]/40";

  /* ─── Data Fetching ─── */

  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);
      if (customerFilter) params.set('customerId', customerFilter);
      if (driverFilter) params.set('driverId', driverFilter);
      if (vehicleFilter) params.set('vehicleId', vehicleFilter);

      const [ordersRes, customersRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/orders?' + params.toString()),
        fetch('/api/customers'), fetch('/api/drivers'), fetch('/api/vehicles')
      ]);
      const [ordersData, customersData, driversData, vehiclesData] = await Promise.all([
        ordersRes.json(), customersRes.json(), driversRes.json(), vehiclesRes.json(),
      ]);
      const asArray = (data: unknown) => Array.isArray(data) ? data : [];

      setOrders(asArray(ordersData));
      setCustomers(asArray(customersData));
      setDrivers(asArray(driversData));
      setVehicles(asArray(vehiclesData));
      setLoadError([ordersRes, customersRes, driversRes, vehiclesRes].every(r => r.ok)
        ? '' : 'Some data could not be loaded.');
    } catch {
      setOrders([]); setCustomers([]); setDrivers([]); setVehicles([]);
      setLoadError('Unable to load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, customerFilter, driverFilter, vehicleFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Handle URL-driven actions: ?create=1 opens form, ?customerId / ?driverId / ?vehicleId prefill or filter, ?status=X filters, ?view=id opens detail
  useEffect(() => {
    const isCreate = searchParams.get('create') === '1';
    const paramCustId = searchParams.get('customerId');
    const paramDriverId = searchParams.get('driverId');
    const paramVehicleId = searchParams.get('vehicleId');
    const urlStatus = searchParams.get('status');
    const viewId = searchParams.get('view');

    if (isCreate && !isFormOpen) {
      setEditingOrderId(null);
      const targetCustomer = customers.find(c => c.id === paramCustId);
      const targetDriver = drivers.find(d => d.id === paramDriverId);

      setFormData({
        ...initialForm,
        customerId: paramCustId || '',
        division: targetCustomer?.division || '',
        brand: targetCustomer?.brand || '',
        locations: [
          {
            ...createInitialLocation('PICKUP'),
            city: targetCustomer?.defaultPickupCity || '',
          },
          createInitialLocation('DROPOFF'),
        ],
        serviceProvider: (paramDriverId || paramVehicleId) ? 'COMPANY' : '',
        assignedDriverId: paramDriverId || '',
        assignedVehicleId: paramVehicleId || (targetDriver?.primaryVehicle?.id || ''),
      });
      setFormStep(1);
      setLoadError('');
      setIsFormOpen(true);
      router.replace('/admin/orders', { scroll: false });
    } else if (!isCreate) {
      if (paramCustId && paramCustId !== customerFilter) {
        setCustomerFilter(paramCustId);
      }
      if (paramDriverId && paramDriverId !== driverFilter) {
        setDriverFilter(paramDriverId);
      }
      if (paramVehicleId && paramVehicleId !== vehicleFilter) {
        setVehicleFilter(paramVehicleId);
      }
    }

    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    if (viewId && orders.length > 0) {
      const found = orders.find(o => o.id === viewId);
      if (found) setSelectedOrder(found);
      router.replace('/admin/orders', { scroll: false });
    }
  }, [searchParams, orders.length, customers.length, drivers.length]);

  /* ─── Form Handlers ─── */

  const handleStartEdit = (order: any) => {
    setEditingOrderId(order.id);
    setFormData({
      customerId: order.customerId || '',
      customerPoNumber: order.customerPoNumber || '',
      referenceNumber: order.referenceNumber || '',
      requestedDate: order.requestedDate ? order.requestedDate.slice(0, 10) : '',
      requestedBy: order.requestedBy || '',
      division: order.division || '',
      brand: order.brand || '',
      waybillNumber: order.waybillNumber || '',
      deliveryNoteNumber: order.deliveryNoteNumber || '',
      invoiceNumber: order.invoiceNumber || '',
      rfqNumber: order.rfqNumber || '',
      attachmentReferences: order.attachmentReferences || '',
      locations: order.locations?.length > 0 ? order.locations.map((l: any) => ({
        type: l.type,
        address: l.address || '',
        city: l.city || '',
        region: l.region || '',
        postalCode: l.postalCode || '',
        country: l.country || 'SA',
        latitude: l.latitude,
        longitude: l.longitude,
        contactName: l.contactName || '',
        contactPhone: l.contactPhone || '',
        contactEmail: l.contactEmail || '',
        scheduledDate: l.scheduledDate ? l.scheduledDate.slice(0, 10) : '',
        instructions: l.instructions || '',
      })) : [createInitialLocation('PICKUP'), createInitialLocation('DROPOFF')],
      cargoDescription: order.cargoDescription || '',
      cargoType: order.cargoType || 'GENERAL',
      weightKg: order.weightKg ? String(order.weightKg) : '',
      volumeCbm: order.volumeCbm ? String(order.volumeCbm) : '',
      pallets: order.pallets ? String(order.pallets) : '',
      totalAmount: order.totalAmount ? String(order.totalAmount) : '',
      costAmount: order.costAmount ? String(order.costAmount) : '',
      driverTa: order.driverTa ? String(order.driverTa) : '',
      tripCost: order.tripCost ? String(order.tripCost) : '',
      currency: order.currency || 'SAR',
      paymentStatus: order.paymentStatus || 'UNPAID',
      serviceProvider: order.serviceProvider || '',
      serviceProviderName: order.serviceProviderName || '',
      externalDriverName: order.externalDriverName || '',
      externalVehicleNumber: order.externalVehicleNumber || '',
      externalVehicleType: order.externalVehicleType || '',
      deliveryStatus: order.deliveryStatus || '',
      podStatus: order.podStatus || '',
      receiver: order.receiver || '',
      transitTime: order.transitTime || '',
      deliveryDurationHours: order.deliveryDurationHours ? String(order.deliveryDurationHours) : '',
      actualPickup: order.actualPickup ? order.actualPickup.slice(0, 10) : '',
      actualDelivery: order.actualDelivery ? order.actualDelivery.slice(0, 10) : '',
      unloadingFinishedAt: order.unloadingFinishedAt ? order.unloadingFinishedAt.slice(0, 10) : '',
      waitingLabor: order.waitingLabor || '',
      additionalComments: order.additionalComments || '',
      handledBy: order.handledBy || '',
      confirmedBy: order.confirmedBy || '',
      auditPro: order.auditPro || '',
      assignedDriverId: order.assignedDriverId || '',
      assignedVehicleId: order.assignedVehicleId || '',
      status: order.status || 'PENDING',
      notes: order.notes || '',
    });
    setFormStep(1);
    setLoadError('');
    setSelectedOrder(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) { setLoadError('Select a customer before confirming.'); setFormStep(1); return; }
    if (formData.locations.some(l => !l.address.trim())) { setLoadError('Add an address for every stop.'); setFormStep(2); return; }
    if (!formData.serviceProvider) { setLoadError('Choose a service provider.'); setFormStep(3); return; }
    if (isOutsourced && !formData.serviceProviderName.trim()) { setLoadError('Add the provider name.'); setFormStep(3); return; }

    setSubmitting(true);
    try {
      const locationsWithSequence = formData.locations.map((location, index) => ({
        ...location,
        type: index === 0 ? 'PICKUP' : index === formData.locations.length - 1 ? 'DROPOFF' : 'INTERMEDIATE',
        sequence: index,
      }));
      const cleanedLocations = locationsWithSequence.map(loc => {
        const clean: any = { ...loc };
        Object.keys(clean).forEach(key => { if (clean[key] === '' || clean[key] === null) delete clean[key]; });
        return clean;
      });

      if (editingOrderId) {
        const res = await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingOrderId,
            ...formData,
            locations: cleanedLocations,
          }),
        });
        if (res.ok) {
          setEditingOrderId(null);
          setFormData({ ...initialForm });
          setFormStep(1);
          setIsFormOpen(false);
          fetchAll();
        } else {
          const err = await res.json().catch(() => ({}));
          setLoadError(err.error || 'Order could not be updated.');
        }
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, locations: cleanedLocations }),
        });
        if (res.ok) {
          setFormData({ ...initialForm }); setFormStep(1); setIsFormOpen(false); fetchAll();
        } else {
          const err = await res.json().catch(() => ({}));
          setLoadError(err.error || 'Order could not be created.');
        }
      }
    } catch { setLoadError('Network error.'); } finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedOrder(updated);
        fetchAll();
      }
    } catch { /* silent */ } finally { setUpdatingStatus(false); }
  };

  /* ─── Address helpers ─── */

  const handleAddressSearch = (value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length > 2) {
      searchTimeoutRef.current = setTimeout(() => searchAddress(value), 300);
    } else {
      setSearchResults([]);
    }
  };

  const reverseGeocode = async (index: number, lat: number, lon: number) => {
    updateLocation(index, 'latitude', lat);
    updateLocation(index, 'longitude', lon);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data?.display_name) {
        updateLocation(index, 'address', data.display_name);
        updateLocation(index, 'city', data.address?.city || data.address?.town || data.address?.village || '');
        updateLocation(index, 'region', data.address?.state || '');
        updateLocation(index, 'postalCode', data.address?.postcode || '');
      }
    } catch { /* silent */ }
  };

  const searchAddress = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sa&limit=5&addressdetails=1`
      );
      setSearchResults(await response.json());
    } catch { setSearchResults([]); } finally { setSearchingAddress(false); }
  };

  /* ─── Location helpers ─── */

  const addLocation = () => {
    setFormData(prev => ({ ...prev, locations: [...prev.locations, createInitialLocation('INTERMEDIATE')] }));
  };

  const removeLocation = (index: number) => {
    setFormData(prev => {
      const newLocs = [...prev.locations];
      newLocs.splice(index, 1);
      return { ...prev, locations: newLocs };
    });
  };

  const updateLocation = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newLocs = [...prev.locations];
      newLocs[index] = { ...newLocs[index], [field]: value };
      return { ...prev, locations: newLocs };
    });
  };

  const moveLocation = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newLocs = [...prev.locations];
      const [moved] = newLocs.splice(fromIndex, 1);
      newLocs.splice(toIndex, 0, moved);
      return { ...prev, locations: newLocs };
    });
  };

  const getLocationType = (index: number): LocationType =>
    index === 0 ? 'PICKUP' : index === formData.locations.length - 1 ? 'DROPOFF' : 'INTERMEDIATE';

  const getStatus = (val: string) => ORDER_STATUSES.find(s => s.value === val) || ORDER_STATUSES[0];

  const changeProviderType = (serviceProvider: string) => {
    setFormData(prev => ({
      ...prev, serviceProvider,
      ...(serviceProvider === 'COMPANY'
        ? { serviceProviderName: '', externalDriverName: '', externalVehicleNumber: '', externalVehicleType: '' }
        : serviceProvider === 'OUTSOURCE'
          ? { assignedDriverId: '', assignedVehicleId: '' }
          : { serviceProviderName: '', externalDriverName: '', externalVehicleNumber: '', externalVehicleType: '', assignedDriverId: '', assignedVehicleId: '' }),
    }));
  };

  const selectedDriver = drivers.find(d => d.id === formData.assignedDriverId);
  const selectedVehicle = vehicles.find(v => v.id === formData.assignedVehicleId);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  // Auto-select primary vehicle when driver is selected
  const handleDriverSelect = (driverId: string) => {
    setFormData(prev => {
      const driver = drivers.find(d => d.id === driverId);
      const primaryVehicle = driver?.primaryVehicle;
      return {
        ...prev,
        assignedDriverId: driverId,
        ...(primaryVehicle && !prev.assignedVehicleId ? { assignedVehicleId: primaryVehicle.id } : {}),
      };
    });
  };

  const goToStep = (step: number) => { setFormStep(Math.min(4, Math.max(1, step))); setLoadError(''); };

  const advanceStep = () => {
    if (formStep === 1 && !formData.customerId) { setLoadError('Select a customer to continue.'); return; }
    if (formStep === 2 && formData.locations.some(l => !l.address.trim())) { setLoadError('Add an address for every stop.'); return; }
    if (formStep === 3 && (!formData.serviceProvider || (isOutsourced && !formData.serviceProviderName.trim()))) {
      setLoadError(isOutsourced ? 'Add the provider name.' : 'Choose a provider.'); return;
    }
    goToStep(formStep + 1);
  };

  const getRouteSummary = (order: any) => {
    const locations = order.locations || [];
    const pickup = locations.find((l: any) => l.type === 'PICKUP') || locations[0];
    const dropoff = [...locations].reverse().find((l: any) => l.type === 'DROPOFF') || locations[locations.length - 1];
    return {
      pickup: pickup?.city || pickup?.address?.split(',')[0] || order.pickupCity || '—',
      dropoff: dropoff?.city || dropoff?.address?.split(',')[0] || order.dropoffCity || '—',
      scheduled: pickup?.scheduledDate || order.scheduledPickup,
    };
  };

  /* ─── Render ─── */

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Orders & Dispatch</h1>
          <p className="text-sm text-[var(--muted)]">Manage orders, routing, and dispatch across your fleet.</p>
        </div>
        <button
          onClick={() => { setFormData({ ...initialForm }); setFormStep(1); setLoadError(''); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[var(--foreground)]/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2 animate-slide-down">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
          <button onClick={() => setLoadError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats Pipeline */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {ORDER_STATUSES.map(s => {
          const count = orders.filter(o => o.status === s.value).length;
          const isActive = statusFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(isActive ? '' : s.value)}
              className={`bg-[var(--card)] border rounded-xl p-5 shadow-sm text-left transition-all duration-200 group ${
                isActive ? `${s.border} ${s.bg}` : 'border-[var(--border)] hover:border-[var(--accent)]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-[var(--muted)]">{s.label}</h3>
                <div className={`w-2 h-2 rounded-full ${s.dot} ${isActive ? 'pulse-dot' : ''}`} />
              </div>
              <p className={`text-3xl font-bold tabular-nums ${isActive ? s.color : ''}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)]/30">
          <div className="flex items-center gap-3 flex-1 min-w-[280px] flex-wrap">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search tracking, customer, locations…"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-[var(--accent)] outline-none transition-colors"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Active filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {customerFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
                  <span className="text-[var(--muted)]">Customer:</span>
                  <span className="font-semibold truncate max-w-[120px]">
                    {customers.find(c => c.id === customerFilter)?.companyName || 'Selected'}
                  </span>
                  <button onClick={() => setCustomerFilter('')} className="hover:text-red-500 transition-colors" title="Clear customer filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {driverFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
                  <span className="text-[var(--muted)]">Driver:</span>
                  <span className="font-semibold truncate max-w-[120px]">
                    {drivers.find(d => d.id === driverFilter)?.firstName || 'Selected'}
                  </span>
                  <button onClick={() => setDriverFilter('')} className="hover:text-red-500 transition-colors" title="Clear driver filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {vehicleFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
                  <span className="text-[var(--muted)]">Vehicle:</span>
                  <span className="font-semibold">
                    {vehicles.find(v => v.id === vehicleFilter)?.licensePlate || 'Selected'}
                  </span>
                  <button onClick={() => setVehicleFilter('')} className="hover:text-red-500 transition-colors" title="Clear vehicle filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
                  <span className="text-[var(--muted)]">Status:</span>
                  <span className="font-semibold">{getStatus(statusFilter).label}</span>
                  <button onClick={() => setStatusFilter('')} className="hover:text-red-500 transition-colors" title="Clear status filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(customerFilter || driverFilter || vehicleFilter || statusFilter) && (
              <button
                onClick={() => { setStatusFilter(''); setCustomerFilter(''); setDriverFilter(''); setVehicleFilter(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
            <span className="text-xs text-[var(--muted)]">{orders.length} orders</span>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Tracking</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Route</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Schedule</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Driver</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="px-5 py-4"><Skeleton className="h-5 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-36" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center"><Package className="w-6 h-6 text-[var(--muted)]" /></div>
                    <p className="text-sm text-[var(--muted)]">{statusFilter ? `No ${getStatus(statusFilter).label.toLowerCase()} orders found.` : 'No orders found.'}</p>
                    <button onClick={() => { setFormData({ ...initialForm }); setFormStep(1); setIsFormOpen(true); }} className="text-xs font-medium text-[var(--accent)] hover:underline">
                      Create your first order →
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map(o => {
                const s = getStatus(o.status);
                const route = getRouteSummary(o);
                return (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-[var(--surface)] cursor-pointer transition-colors border-b border-[var(--border)] last:border-0 group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${s.bg} ${s.color} ${s.border}`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold">{o.trackingNumber}</p>
                          {o.customerPoNumber && <p className="text-[10px] text-[var(--muted)] font-mono">PO: {o.customerPoNumber}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{o.customer?.companyName || 'Unknown'}</p>
                      <p className="text-[10px] text-[var(--muted)] uppercase">{o.cargoType}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium truncate max-w-[80px]">{route.pickup}</span>
                        <ChevronRight className="w-3 h-3 text-[var(--muted)] shrink-0" />
                        <span className="font-medium truncate max-w-[80px]">{route.dropoff}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {route.scheduled ? (
                        <p className="text-sm text-[var(--muted)]">{new Date(route.scheduled).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm">{o.driver ? `${o.driver.firstName} ${o.driver.lastName}` : o.externalDriverName || <span className="text-[var(--muted)]">Unassigned</span>}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════ CREATE ORDER MODAL ═══════════════ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !submitting && setIsFormOpen(false)} />
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--foreground)] flex items-center justify-center text-[var(--background)]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">New Order</h2>
                  <p className="text-xs text-[var(--muted)]">Step {formStep} of 4 — {workflowSteps[formStep - 1].label}</p>
                </div>
              </div>
              <button onClick={() => !submitting && setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)]/20 shrink-0">
              <div className="flex items-center gap-1">
                {workflowSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isDone = formStep > step.number;
                  const isCurrent = formStep === step.number;
                  return (
                    <div key={step.number} className="flex items-center gap-1 flex-1">
                      <button
                        type="button"
                        onClick={() => goToStep(step.number)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isCurrent ? 'bg-[var(--foreground)] text-[var(--background)]' : isDone ? 'text-emerald-500' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        <span className="hidden sm:block">{step.label}</span>
                      </button>
                      {i < workflowSteps.length - 1 && <span className={`h-px flex-1 ${isDone ? 'bg-emerald-500/30' : 'bg-[var(--border)]'}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">

                {/* ── STEP 1: Customer & References ── */}
                <div className={formStep === 1 ? '' : 'hidden'}>
                  <div className="space-y-5">
                    <Field label="Customer" required>
                      <CustomerSearch
                        customers={customers}
                        value={formData.customerId}
                        onChange={(id, customer) => {
                          setFormData(prev => ({
                            ...prev,
                            customerId: id,
                            division: prev.division || customer?.division || '',
                            brand: prev.brand || customer?.brand || '',
                          }));
                        }}
                      />
                    </Field>

                    {selectedCustomer && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-4 animate-slide-down">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--muted)]">
                              {selectedCustomer.companyName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{selectedCustomer.companyName}</p>
                              <p className="text-xs text-[var(--muted)]">{selectedCustomer.accountNumber} · {selectedCustomer.paymentTerms?.replace('_', ' ') || 'NET 30'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCustomer.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {selectedCustomer.status || 'ACTIVE'}
                            </span>
                            {selectedCustomer._count?.orders !== undefined && (
                              <p className="text-[10px] text-[var(--muted)]">{selectedCustomer._count.orders} orders</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Customer PO">
                        <input className={inputClass} placeholder="PO-2023-991" value={formData.customerPoNumber} onChange={e => setFormData({ ...formData, customerPoNumber: e.target.value })} />
                      </Field>
                      <Field label="External Ref">
                        <input className={inputClass} placeholder="REF-88" value={formData.referenceNumber} onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })} />
                      </Field>
                      <Field label="Requested Date">
                        <input type="date" className={inputClass} value={formData.requestedDate} onChange={e => setFormData({ ...formData, requestedDate: e.target.value })} />
                      </Field>
                    </div>

                    {/* Collapsible reference numbers */}
                    <CollapsibleSection title="Additional References" icon={FileText}>
                      <div className="grid grid-cols-4 gap-4">
                        <Field label="Requested by"><input className={inputClass} placeholder="Requester" value={formData.requestedBy} onChange={e => setFormData({ ...formData, requestedBy: e.target.value })} /></Field>
                        <Field label="Division"><input className={inputClass} placeholder="Food, retail…" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} /></Field>
                        <Field label="Brand"><input className={inputClass} placeholder="Brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} /></Field>
                        <Field label="Way bill"><input className={inputClass} value={formData.waybillNumber} onChange={e => setFormData({ ...formData, waybillNumber: e.target.value })} /></Field>
                        <Field label="DN number"><input className={inputClass} value={formData.deliveryNoteNumber} onChange={e => setFormData({ ...formData, deliveryNoteNumber: e.target.value })} /></Field>
                        <Field label="Invoice"><input className={inputClass} value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} /></Field>
                        <Field label="RFQ / SO"><input className={inputClass} value={formData.rfqNumber} onChange={e => setFormData({ ...formData, rfqNumber: e.target.value })} /></Field>
                        <Field label="Attachments"><input className={inputClass} placeholder="URL or reference" value={formData.attachmentReferences} onChange={e => setFormData({ ...formData, attachmentReferences: e.target.value })} /></Field>
                      </div>
                    </CollapsibleSection>
                  </div>
                </div>

                {/* ── STEP 2: Route & Cargo ── */}
                <div className={formStep === 2 ? '' : 'hidden'}>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Route Stops
                      </h3>
                      <button
                        type="button"
                        onClick={addLocation}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Stop
                      </button>
                    </div>

                    {/* Route timeline */}
                    <div className="space-y-0">
                      {formData.locations.map((location, index) => {
                        const locType = getLocationType(index);
                        const colors = locType === 'PICKUP' ? 'border-amber-500/30 bg-amber-500/5' : locType === 'DROPOFF' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-blue-500/30 bg-blue-500/5';
                        const dotColor = locType === 'PICKUP' ? 'bg-amber-500' : locType === 'DROPOFF' ? 'bg-emerald-500' : 'bg-blue-500';

                        return (
                          <div key={index} className="relative">
                            {/* Timeline connector */}
                            {index > 0 && (
                              <div className="absolute left-5 -top-0 w-px h-0 border-l-2 border-dashed border-[var(--border)]" style={{ height: '0px' }} />
                            )}

                            <div className={`p-4 rounded-xl border ${colors} mb-3`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-[var(--background)]`} />
                                  <span className={`text-xs font-bold uppercase tracking-wider ${locType === 'PICKUP' ? 'text-amber-500' : locType === 'DROPOFF' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                    {locType === 'PICKUP' ? 'Pickup' : locType === 'DROPOFF' ? 'Drop-off' : `Stop ${index}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {index > 0 && (
                                    <button type="button" onClick={() => moveLocation(index, index - 1)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--surface)] text-[var(--muted)] transition-colors" title="Move up">
                                      <ArrowUpDown className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {formData.locations.length > 2 && (
                                    <button type="button" onClick={() => removeLocation(index)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {/* Address with search */}
                                <div className="col-span-2 relative">
                                  <Field label="Address" required>
                                    <div className="relative">
                                      <input
                                        className={inputClass}
                                        placeholder="Start typing to search…"
                                        value={location.address}
                                        onChange={e => {
                                          updateLocation(index, 'address', e.target.value);
                                          setActiveLocationIndex(index);
                                          handleAddressSearch(e.target.value);
                                        }}
                                        onFocus={() => setActiveLocationIndex(index)}
                                      />
                                      {searchingAddress && activeLocationIndex === index && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                          <div className="animate-spin w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
                                        </div>
                                      )}
                                    </div>
                                    {/* Search results dropdown */}
                                    {searchResults.length > 0 && activeLocationIndex === index && (
                                      <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto animate-slide-down">
                                        {searchResults.map((result, ri) => (
                                          <button
                                            key={ri}
                                            type="button"
                                            className="w-full text-left p-3 hover:bg-[var(--surface)] border-b border-[var(--border)] last:border-0 transition-colors"
                                            onClick={() => {
                                              updateLocation(index, 'address', result.display_name);
                                              updateLocation(index, 'city', result.address?.city || result.address?.town || '');
                                              updateLocation(index, 'region', result.address?.state || '');
                                              updateLocation(index, 'postalCode', result.address?.postcode || '');
                                              updateLocation(index, 'latitude', parseFloat(result.lat));
                                              updateLocation(index, 'longitude', parseFloat(result.lon));
                                              setSearchResults([]);
                                            }}
                                          >
                                            <div className="text-sm font-medium truncate">{result.display_name}</div>
                                            <div className="text-[10px] text-[var(--muted)] mt-0.5">{result.address?.city || result.address?.state || 'Unknown'}</div>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </Field>
                                </div>

                                <Field label="City">
                                  <input className={inputClass} placeholder="Riyadh" value={location.city} onChange={e => updateLocation(index, 'city', e.target.value)} />
                                </Field>
                                <Field label="Scheduled Date">
                                  <input type="datetime-local" className={inputClass} value={location.scheduledDate} onChange={e => updateLocation(index, 'scheduledDate', e.target.value)} />
                                </Field>

                                {/* Collapsed contact details */}
                                <CollapsibleSection title="Contact & Details" icon={User} className="col-span-2">
                                  <div className="grid grid-cols-3 gap-3">
                                    <Field label="Contact Name"><input className={inputClass} placeholder="Name" value={location.contactName} onChange={e => updateLocation(index, 'contactName', e.target.value)} /></Field>
                                    <Field label="Phone"><input className={inputClass} placeholder="0500000000" value={location.contactPhone} onChange={e => updateLocation(index, 'contactPhone', e.target.value)} /></Field>
                                    <Field label="Email"><input type="email" className={inputClass} placeholder="email@co.com" value={location.contactEmail} onChange={e => updateLocation(index, 'contactEmail', e.target.value)} /></Field>
                                    <Field label="Region"><input className={inputClass} placeholder="Region" value={location.region} onChange={e => updateLocation(index, 'region', e.target.value)} /></Field>
                                    <Field label="Postal Code"><input className={inputClass} placeholder="12345" value={location.postalCode} onChange={e => updateLocation(index, 'postalCode', e.target.value)} /></Field>
                                    <Field label="Country">
                                      <select className={inputClass} value={location.country} onChange={e => updateLocation(index, 'country', e.target.value)}>
                                        <option value="SA">Saudi Arabia</option><option value="AE">UAE</option><option value="QA">Qatar</option>
                                        <option value="BH">Bahrain</option><option value="OM">Oman</option><option value="KW">Kuwait</option>
                                      </select>
                                    </Field>
                                    <div className="col-span-3">
                                      <Field label="Instructions"><textarea className={`${inputClass} min-h-[50px] resize-none`} placeholder="Special instructions…" value={location.instructions} onChange={e => updateLocation(index, 'instructions', e.target.value)} /></Field>
                                    </div>
                                  </div>
                                </CollapsibleSection>

                                {/* Map on demand */}
                                {location.latitude && location.longitude && (
                                  <div className="col-span-2 mt-2">
                                    <MapDisplay
                                      latitude={location.latitude}
                                      longitude={location.longitude}
                                      address={location.address}
                                      height="150px"
                                      onLocationSelect={(lat, lng) => reverseGeocode(index, lat, lng)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cargo & Pricing */}
                    <CollapsibleSection title="Cargo & Financials" icon={CreditCard} defaultOpen>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2"><Field label="Cargo Description"><input className={inputClass} placeholder="Electronics, supplies…" value={formData.cargoDescription} onChange={e => setFormData({ ...formData, cargoDescription: e.target.value })} /></Field></div>
                        <Field label="Cargo Type">
                          <select className={inputClass} value={formData.cargoType} onChange={e => setFormData({ ...formData, cargoType: e.target.value })}>
                            {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </Field>
                        <Field label="Pallets"><input type="number" className={inputClass} placeholder="10" value={formData.pallets} onChange={e => setFormData({ ...formData, pallets: e.target.value })} /></Field>
                        <Field label="Weight (KG)"><input type="number" className={inputClass} placeholder="1500" value={formData.weightKg} onChange={e => setFormData({ ...formData, weightKg: e.target.value })} /></Field>
                        <Field label="Volume (CBM)"><input type="number" step="0.1" className={inputClass} placeholder="2.5" value={formData.volumeCbm} onChange={e => setFormData({ ...formData, volumeCbm: e.target.value })} /></Field>
                        <Field label="Amount (SAR)"><input type="number" className={inputClass} placeholder="5000" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} /></Field>
                        <Field label="Payment">
                          <select className={inputClass} value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                            <option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option>
                          </select>
                        </Field>
                      </div>
                      <CollapsibleSection title="Cost Breakdown" icon={CreditCard}>
                        <div className="grid grid-cols-4 gap-4">
                          <Field label="Provider cost"><input type="number" className={inputClass} value={formData.costAmount} onChange={e => setFormData({ ...formData, costAmount: e.target.value })} /></Field>
                          <Field label="Driver TA"><input type="number" className={inputClass} value={formData.driverTa} onChange={e => setFormData({ ...formData, driverTa: e.target.value })} /></Field>
                          <Field label="Trip cost"><input type="number" className={inputClass} value={formData.tripCost} onChange={e => setFormData({ ...formData, tripCost: e.target.value })} /></Field>
                          <Field label="Currency">
                            <select className={inputClass} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                              <option value="SAR">SAR</option><option value="USD">USD</option><option value="AED">AED</option>
                            </select>
                          </Field>
                        </div>
                      </CollapsibleSection>
                    </CollapsibleSection>
                  </div>
                </div>

                {/* ── STEP 3: Dispatch ── */}
                <div className={formStep === 3 ? '' : 'hidden'}>
                  <div className="space-y-5">
                    {/* Service Provider Toggle */}
                    <Field label="Service Provider" required>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => changeProviderType('COMPANY')}
                          className={`p-4 rounded-xl border text-left transition-all ${isCompanyFleet ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Truck className={`w-4 h-4 ${isCompanyFleet ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                            <span className="text-sm font-semibold">Company Fleet</span>
                          </div>
                          <p className="text-xs text-[var(--muted)]">Use internal drivers and vehicles</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => changeProviderType('OUTSOURCE')}
                          className={`p-4 rounded-xl border text-left transition-all ${isOutsourced ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <ExternalLink className={`w-4 h-4 ${isOutsourced ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                            <span className="text-sm font-semibold">Outsource</span>
                          </div>
                          <p className="text-xs text-[var(--muted)]">Third-party carrier or subcontractor</p>
                        </button>
                      </div>
                    </Field>

                    {/* Company Fleet Assignment */}
                    {isCompanyFleet && (
                      <div className="grid grid-cols-2 gap-4 animate-slide-down">
                        <Field label="Assign Driver">
                          <select className={inputClass} value={formData.assignedDriverId} onChange={e => handleDriverSelect(e.target.value)}>
                            <option value="">Unassigned</option>
                            {drivers.filter(d => d.status === 'ACTIVE').map(d => (
                              <option key={d.id} value={d.id}>{d.firstName} {d.lastName} ({d.employeeId})</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Assign Vehicle">
                          <select className={inputClass} value={formData.assignedVehicleId} onChange={e => setFormData({ ...formData, assignedVehicleId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {vehicles.filter(v => v.status === 'ACTIVE').map(v => (
                              <option key={v.id} value={v.id}>{v.licensePlate} · {v.make} {v.model} ({v.vehicleType})</option>
                            ))}
                          </select>
                        </Field>
                        {selectedDriver && selectedVehicle && (
                          <div className="col-span-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>{selectedDriver.firstName} will drive {selectedVehicle.licensePlate}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Outsource Fields */}
                    {isOutsourced && (
                      <div className="grid grid-cols-2 gap-4 animate-slide-down">
                        <Field label="Provider Name" required><input required className={inputClass} placeholder="Supplier name" value={formData.serviceProviderName} onChange={e => setFormData({ ...formData, serviceProviderName: e.target.value })} /></Field>
                        <Field label="External Driver"><input className={inputClass} placeholder="Driver name" value={formData.externalDriverName} onChange={e => setFormData({ ...formData, externalDriverName: e.target.value })} /></Field>
                        <Field label="Vehicle Number"><input className={inputClass} placeholder="License plate" value={formData.externalVehicleNumber} onChange={e => setFormData({ ...formData, externalVehicleNumber: e.target.value })} /></Field>
                        <Field label="Vehicle Type"><input className={inputClass} placeholder="Dyna, trailer…" value={formData.externalVehicleType} onChange={e => setFormData({ ...formData, externalVehicleType: e.target.value })} /></Field>
                      </div>
                    )}

                    {/* Trip timing */}
                    <CollapsibleSection title="Trip Timing" icon={Clock}>
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Departure (actual)"><input type="datetime-local" className={inputClass} value={formData.actualPickup} onChange={e => setFormData({ ...formData, actualPickup: e.target.value })} /></Field>
                        <Field label="Arrival (actual)"><input type="datetime-local" className={inputClass} value={formData.actualDelivery} onChange={e => setFormData({ ...formData, actualDelivery: e.target.value })} /></Field>
                        <Field label="Waiting / Labor"><input className={inputClass} placeholder="Hours or note" value={formData.waitingLabor} onChange={e => setFormData({ ...formData, waitingLabor: e.target.value })} /></Field>
                      </div>
                    </CollapsibleSection>

                    {/* Status + Notes */}
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Initial Status">
                        <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Internal Notes">
                      <textarea className={`${inputClass} min-h-[60px] resize-none`} placeholder="Dispatch notes…" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </Field>
                  </div>
                </div>

                {/* ── STEP 4: Confirm / Delivery Proof ── */}
                <div className={formStep === 4 ? '' : 'hidden'}>
                  <div className="space-y-5">
                    {/* Order summary card */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 p-5">
                      <h3 className="text-sm font-bold mb-4">Order Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--muted)] mb-0.5">Customer</span>
                          <span className="font-medium">{selectedCustomer?.companyName || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--muted)] mb-0.5">Stops</span>
                          <span className="font-medium">{formData.locations.length} locations</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--muted)] mb-0.5">Route</span>
                          <span className="font-medium">{formData.locations[0]?.city || '—'} → {formData.locations[formData.locations.length - 1]?.city || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--muted)] mb-0.5">Provider</span>
                          <span className="font-medium">{isCompanyFleet ? 'Company Fleet' : isOutsourced ? formData.serviceProviderName : '—'}</span>
                        </div>
                        {formData.totalAmount && (
                          <div>
                            <span className="block text-[10px] uppercase text-[var(--muted)] mb-0.5">Amount</span>
                            <span className="font-medium font-mono">{formData.totalAmount} {formData.currency}</span>
                          </div>
                        )}
                        {formData.cargoDescription && (
                          <div>
                            <span className="block text-[10px] uppercase text-[var(--muted)] mb-0.5">Cargo</span>
                            <span className="font-medium">{formData.cargoDescription}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery proof fields */}
                    <CollapsibleSection title="Delivery Proof & Audit" icon={Activity}>
                      <div className="grid grid-cols-4 gap-4">
                        <Field label="Delivery status"><input className={inputClass} placeholder="Delivered" value={formData.deliveryStatus} onChange={e => setFormData({ ...formData, deliveryStatus: e.target.value })} /></Field>
                        <Field label="Receiver"><input className={inputClass} value={formData.receiver} onChange={e => setFormData({ ...formData, receiver: e.target.value })} /></Field>
                        <Field label="POD status"><input className={inputClass} placeholder="Received" value={formData.podStatus} onChange={e => setFormData({ ...formData, podStatus: e.target.value })} /></Field>
                        <Field label="Transit time"><input className={inputClass} placeholder="8h 30m" value={formData.transitTime} onChange={e => setFormData({ ...formData, transitTime: e.target.value })} /></Field>
                        <Field label="Duration (hrs)"><input type="number" step="0.25" className={inputClass} value={formData.deliveryDurationHours} onChange={e => setFormData({ ...formData, deliveryDurationHours: e.target.value })} /></Field>
                        <Field label="Unloading finished"><input type="datetime-local" className={inputClass} value={formData.unloadingFinishedAt} onChange={e => setFormData({ ...formData, unloadingFinishedAt: e.target.value })} /></Field>
                        <Field label="Handled by"><input className={inputClass} value={formData.handledBy} onChange={e => setFormData({ ...formData, handledBy: e.target.value })} /></Field>
                        <Field label="Confirmed by"><input className={inputClass} value={formData.confirmedBy} onChange={e => setFormData({ ...formData, confirmedBy: e.target.value })} /></Field>
                        <Field label="Audit / PRO"><input className={inputClass} value={formData.auditPro} onChange={e => setFormData({ ...formData, auditPro: e.target.value })} /></Field>
                        <div className="col-span-3"><Field label="Comments"><textarea className={`${inputClass} min-h-[40px] resize-none`} value={formData.additionalComments} onChange={e => setFormData({ ...formData, additionalComments: e.target.value })} /></Field></div>
                      </div>
                    </CollapsibleSection>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 p-4 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-between z-10">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Cancel</button>
                <div className="flex items-center gap-3">
                  {formStep > 1 && (
                    <button type="button" onClick={() => goToStep(formStep - 1)} className="px-5 py-2.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] transition-colors">Back</button>
                  )}
                  {formStep < 4 ? (
                    <button type="button" onClick={advanceStep} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98]">Continue</button>
                  ) : (
                    <button type="submit" disabled={submitting} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 active:scale-[0.98]">
                      {submitting ? <><div className="animate-spin w-4 h-4 border-2 border-[var(--background)] border-t-transparent rounded-full" /> Creating…</> : <><Check className="w-4 h-4" /> Create Order</>}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ VIEW ORDER DETAIL ═══════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getStatus(selectedOrder.status).bg} ${getStatus(selectedOrder.status).color} ${getStatus(selectedOrder.status).border}`}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-mono tracking-tight">{selectedOrder.trackingNumber}</h2>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)] mt-0.5">
                    {selectedOrder.customer ? (
                      <Link
                        href={`/admin/customers?search=${encodeURIComponent(selectedOrder.customer.companyName)}`}
                        className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
                        onClick={() => setSelectedOrder(null)}
                      >
                        {selectedOrder.customer.companyName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span>Unknown Customer</span>
                    )}
                    {selectedOrder.customerPoNumber && <span>· PO: {selectedOrder.customerPoNumber}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--surface)] text-[var(--foreground)] transition-colors"
                  title="Edit Order"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--accent)]" /> Edit
                </button>

                {/* Status changer */}
                <select
                  value={selectedOrder.status}
                  disabled={updatingStatus}
                  onChange={e => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-[var(--accent)] transition-colors"
                >
                  {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOrder.trackingNumber);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  title="Copy tracking number"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
              {/* Status Timeline */}
              <div className="flex items-center gap-0 bg-[var(--surface)]/30 rounded-xl p-4">
                {ORDER_STATUSES.filter(s => s.value !== 'CANCELLED').map((s, i) => {
                  const currentIdx = ORDER_STATUSES.findIndex(st => st.value === selectedOrder.status);
                  const stepIdx = ORDER_STATUSES.findIndex(st => st.value === s.value);
                  const isDone = stepIdx <= currentIdx && selectedOrder.status !== 'CANCELLED';
                  const isCurrent = s.value === selectedOrder.status;
                  return (
                    <div key={s.value} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          isDone ? `${s.bg} ${s.color} ${s.border}` : 'border-[var(--border)] text-[var(--muted)]'
                        } ${isCurrent ? 'ring-4 ring-[var(--accent)]/10 scale-110' : ''}`}>
                          {isDone && !isCurrent ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-medium ${isDone ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>{s.label}</span>
                      </div>
                      {i < 2 && <span className={`h-0.5 flex-1 rounded-full ${stepIdx < currentIdx ? 'bg-emerald-500/40' : 'bg-[var(--border)]'}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Route */}
              {selectedOrder.locations?.length > 0 ? (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Route ({selectedOrder.locations.length} stops)</h3>
                  <div className="space-y-3">
                    {selectedOrder.locations.map((loc: any, i: number) => (
                      <div key={loc.id || i} className={`p-4 rounded-xl border ${
                        loc.type === 'PICKUP' ? 'border-amber-500/20 bg-amber-500/5' : loc.type === 'DROPOFF' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-blue-500/20 bg-blue-500/5'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${loc.type === 'PICKUP' ? 'bg-amber-500' : loc.type === 'DROPOFF' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{loc.type === 'PICKUP' ? 'Pickup' : loc.type === 'DROPOFF' ? 'Drop-off' : 'Stop'} #{i + 1}</span>
                          </div>
                          {loc.scheduledDate && <span className="text-xs text-[var(--muted)]">{new Date(loc.scheduledDate).toLocaleDateString()}</span>}
                        </div>
                        <p className="text-sm font-medium mb-1">{loc.address}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                          {loc.city && <span>{loc.city}</span>}
                          {loc.contactName && <span>📞 {loc.contactName} {loc.contactPhone ? `(${loc.contactPhone})` : ''}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <h3 className="text-xs font-bold uppercase text-[var(--muted)] mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Pickup</h3>
                    <p className="text-sm">{selectedOrder.pickupLocation || '—'}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{selectedOrder.pickupCity || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <h3 className="text-xs font-bold uppercase text-[var(--muted)] mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Drop-off</h3>
                    <p className="text-sm">{selectedOrder.dropoffLocation || '—'}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{selectedOrder.dropoffCity || '—'}</p>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Cargo</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Type</span><span className="font-medium">{selectedOrder.cargoType || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Description</span><span className="font-medium truncate max-w-[150px]">{selectedOrder.cargoDescription || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Weight</span><span className="font-medium">{selectedOrder.weightKg ? `${selectedOrder.weightKg} kg` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Volume</span><span className="font-medium">{selectedOrder.volumeCbm ? `${selectedOrder.volumeCbm} CBM` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Pallets</span><span className="font-medium">{selectedOrder.pallets || '—'}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Financial</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Amount</span><span className="font-medium font-mono">{selectedOrder.totalAmount ? `${selectedOrder.totalAmount} ${selectedOrder.currency}` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Cost</span><span className="font-medium font-mono">{selectedOrder.costAmount ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Driver TA</span><span className="font-medium font-mono">{selectedOrder.driverTa ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Trip Cost</span><span className="font-medium font-mono">{selectedOrder.tripCost ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Payment</span><span className="font-medium">{selectedOrder.paymentStatus || '—'}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Dispatch</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted)]">Driver</span>
                      {selectedOrder.driver ? (
                        <Link
                          href={`/admin/drivers?search=${encodeURIComponent(selectedOrder.driver.firstName)}`}
                          className="font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                          onClick={() => setSelectedOrder(null)}
                        >
                          {selectedOrder.driver.firstName} {selectedOrder.driver.lastName}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="font-medium">{selectedOrder.externalDriverName || 'Unassigned'}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted)]">Vehicle</span>
                      {selectedOrder.vehicle ? (
                        <Link
                          href={`/admin/vehicles?search=${encodeURIComponent(selectedOrder.vehicle.licensePlate)}`}
                          className="font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                          onClick={() => setSelectedOrder(null)}
                        >
                          {selectedOrder.vehicle.licensePlate}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="font-medium">{selectedOrder.externalVehicleNumber || 'Unassigned'}</span>
                      )}
                    </div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Provider</span><span className="font-medium">{selectedOrder.serviceProviderName || selectedOrder.serviceProvider || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Created</span><span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>

              {/* References + Delivery Proof */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">References</h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Way bill</span><span className="font-medium">{selectedOrder.waybillNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">DN</span><span className="font-medium">{selectedOrder.deliveryNoteNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Invoice</span><span className="font-medium">{selectedOrder.invoiceNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">RFQ / SO</span><span className="font-medium">{selectedOrder.rfqNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Division / Brand</span><span className="font-medium">{[selectedOrder.division, selectedOrder.brand].filter(Boolean).join(' / ') || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Requested by</span><span className="font-medium">{selectedOrder.requestedBy || '—'}</span></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Delivery & Proof</h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Delivery status</span><span className="font-medium">{selectedOrder.deliveryStatus || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">POD status</span><span className="font-medium">{selectedOrder.podStatus || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Receiver</span><span className="font-medium">{selectedOrder.receiver || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Transit</span><span className="font-medium">{selectedOrder.transitTime || (selectedOrder.deliveryDurationHours ? `${selectedOrder.deliveryDurationHours} hrs` : '—')}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Handled / Confirmed</span><span className="font-medium">{[selectedOrder.handledBy, selectedOrder.confirmedBy].filter(Boolean).join(' / ') || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Audit</span><span className="font-medium">{selectedOrder.auditPro || '—'}</span></div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-20 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-[var(--surface)] animate-pulse rounded-lg" />
              <div className="h-4 w-72 bg-[var(--surface)] animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-[var(--surface)] animate-pulse rounded-lg" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-[var(--surface)] animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-[var(--surface)] animate-pulse rounded-xl" />
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
