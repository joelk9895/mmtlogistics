'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Truck, MapPin, Calendar, DollarSign, Search, Plus, X, FileText, Activity, AlertCircle, Building2, User, Map, GripVertical, Trash2, ArrowUpDown, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import MapDisplay to avoid SSR issues with Leaflet
const MapDisplay = dynamic(() => import('@/components/MapDisplay'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full bg-[var(--background)] rounded flex items-center justify-center text-sm text-[var(--muted)] border border-[var(--border)]">
      Loading map...
    </div>
  ),
});

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { value: 'IN_TRANSIT', label: 'In Transit', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { value: 'DELIVERED', label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

const CARGO_TYPES = ['GENERAL', 'HAZMAT', 'COLD_CHAIN', 'FRAGILE'];

const Field = ({ label, children, required }: any) => (
  <div>
    <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formStep, setFormStep] = useState(1);
  
  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
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
  
  const initialLocation = createInitialLocation('PICKUP');
  
  const initialForm = {
    customerId: '', customerPoNumber: '', referenceNumber: '',
    requestedDate: '', requestedBy: '', division: '', brand: '',
    waybillNumber: '', deliveryNoteNumber: '', invoiceNumber: '', rfqNumber: '', attachmentReferences: '',
    // Use multi-location array instead of single pickup/dropoff
    locations: [createInitialLocation('PICKUP'), createInitialLocation('DROPOFF')],
    // Keep legacy fields for backward compatibility when needed
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
    { number: 1, label: 'Request', description: 'Customer and references' },
    { number: 2, label: 'Route & cargo', description: 'Stops and load' },
    { number: 3, label: 'Plan dispatch', description: 'Provider and resources' },
    { number: 4, label: 'Confirm', description: 'Proof and ownership' },
  ];

  const fetchAll = async () => {
    try {
      const [ordersRes, customersRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/orders?search=' + encodeURIComponent(searchQuery)),
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
      setLoadError([ordersRes, customersRes, driversRes, vehiclesRes].every(response => response.ok)
        ? ''
        : 'Some order data could not be loaded. Refresh the page or check the server logs.');
    } catch (e) {
      console.error(e);
      setOrders([]);
      setCustomers([]);
      setDrivers([]);
      setVehicles([]);
      setLoadError('Unable to load order data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setLoadError('Select a customer before confirming the order.');
      setFormStep(1);
      return;
    }
    if (formData.locations.some(location => !location.address.trim())) {
      setLoadError('Add an address for every route stop before confirming the order.');
      setFormStep(2);
      return;
    }
    if (!formData.serviceProvider) {
      setLoadError('Choose a service provider before creating the order.');
      setFormStep(3);
      return;
    }
    if (isOutsourced && !formData.serviceProviderName.trim()) {
      setLoadError('Add the outsourced provider name before confirming the order.');
      setFormStep(3);
      return;
    }
    setSubmitting(true);
    try {
      // Prepare locations with sequence
      const locationsWithSequence = formData.locations.map((location, index) => ({
        ...location,
        type: index === 0 ? 'PICKUP' : index === formData.locations.length - 1 ? 'DROPOFF' : 'INTERMEDIATE',
        sequence: index,
      }));
      
      // Remove any empty location values
      const cleanedLocations = locationsWithSequence.map(loc => {
        const cleanLoc: any = { ...loc };
        // Remove empty string values
        Object.keys(cleanLoc).forEach(key => {
          if (cleanLoc[key] === '' || cleanLoc[key] === null) {
            delete cleanLoc[key];
          }
        });
        return cleanLoc;
      });
      
      const orderData = {
        ...formData,
        locations: cleanedLocations,
      };
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        setFormData({ ...initialForm });
        setFormStep(1);
        setIsFormOpen(false);
        fetchAll();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setLoadError(errorData.error || 'Order could not be created. Review the required fields.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddressSearch = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(value);
      }, 300);
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
      
      if (data && data.display_name) {
        updateLocation(index, 'address', data.display_name);
        updateLocation(index, 'city', data.address?.city || data.address?.town || data.address?.village || data.address?.county || '');
        updateLocation(index, 'region', data.address?.state || '');
        updateLocation(index, 'postalCode', data.address?.postcode || '');
      }
    } catch (err) {
      console.error('Failed to reverse geocode:', err);
    }
  };

  // Address search using OpenStreetMap Nominatim API
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchingAddress(true);
    try {
      // Using OpenStreetMap Nominatim API - completely free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sa&limit=5&addressdetails=1`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Helper functions for multi-location management
  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, createInitialLocation('INTERMEDIATE')]
    }));
  };

  const removeLocation = (index: number) => {
    setFormData(prev => {
      const newLocations = [...prev.locations];
      newLocations.splice(index, 1);
      return { ...prev, locations: newLocations };
    });
  };

  const updateLocation = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newLocations = [...prev.locations];
      newLocations[index] = { ...newLocations[index], [field]: value };
      return { ...prev, locations: newLocations };
    });
  };

  const moveLocation = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newLocations = [...prev.locations];
      const [movedLocation] = newLocations.splice(fromIndex, 1);
      newLocations.splice(toIndex, 0, movedLocation);
      return { ...prev, locations: newLocations };
    });
  };

  const getFormLocationType = (index: number): LocationType =>
    index === 0 ? 'PICKUP' : index === formData.locations.length - 1 ? 'DROPOFF' : 'INTERMEDIATE';

  const getStatus = (val: string) => ORDER_STATUSES.find(s => s.value === val) || ORDER_STATUSES[0];

  const changeProviderType = (serviceProvider: string) => {
    setFormData(prev => ({
      ...prev,
      serviceProvider,
      ...(serviceProvider === 'COMPANY'
        ? {
            serviceProviderName: '',
            externalDriverName: '',
            externalVehicleNumber: '',
            externalVehicleType: '',
          }
        : serviceProvider === 'OUTSOURCE'
          ? { assignedDriverId: '', assignedVehicleId: '' }
          : {
              serviceProviderName: '',
              externalDriverName: '',
              externalVehicleNumber: '',
              externalVehicleType: '',
              assignedDriverId: '',
              assignedVehicleId: '',
            }),
    }));
  };

  const selectedDriver = drivers.find(driver => driver.id === formData.assignedDriverId);
  const selectedVehicle = vehicles.find(vehicle => vehicle.id === formData.assignedVehicleId);
  const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
  const selectedDriverOnLeave = selectedDriver?.leaves?.some((leave: any) =>
    leave.status === 'APPROVED' && formData.locations.some(location => {
      if (!location.scheduledDate) return false;
      const scheduled = new Date(location.scheduledDate);
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return scheduled >= start && scheduled <= end;
    })
  );

  const goToStep = (step: number) => {
    setFormStep(Math.min(4, Math.max(1, step)));
    setLoadError('');
  };

  const advanceStep = () => {
    if (formStep === 1 && !formData.customerId) {
      setLoadError('Select a customer to continue.');
      return;
    }
    if (formStep === 2 && formData.locations.some(location => !location.address.trim())) {
      setLoadError('Add an address for every route stop to continue.');
      return;
    }
    if (formStep === 3 && (!formData.serviceProvider || (isOutsourced && !formData.serviceProviderName.trim()))) {
      setLoadError(isOutsourced ? 'Add the outsourced provider name to continue.' : 'Choose a service provider to continue.');
      return;
    }
    goToStep(formStep + 1);
  };

  const getRouteSummary = (order: any) => {
    const locations = order.locations || [];
    const pickup = locations.find((location: any) => location.type === 'PICKUP') || locations[0];
    const dropoff = [...locations].reverse().find((location: any) => location.type === 'DROPOFF') || locations[locations.length - 1];
    return {
      pickup: pickup?.city || pickup?.address?.split(',')[0] || order.pickupCity || order.pickupLocation?.split(',')[0] || '—',
      dropoff: dropoff?.city || dropoff?.address?.split(',')[0] || order.dropoffCity || order.dropoffLocation?.split(',')[0] || '—',
      scheduled: pickup?.scheduledDate || order.scheduledPickup,
    };
  };

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
          onClick={() => { setFormData({ ...initialForm }); setFormStep(1); setLoadError(''); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[var(--foreground)]/10"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {loadError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">Total Orders</h3>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4 text-[var(--foreground)]" />
            </div>
          </div>
          <p className="text-3xl font-bold">{Array.isArray(orders) ? orders.length : 0}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">In Transit</h3>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{Array.isArray(orders) ? orders.filter(o => o.status === 'IN_TRANSIT').length : 0}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">Pending Dispatch</h3>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{Array.isArray(orders) ? orders.filter(o => o.status === 'PENDING').length : 0}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--muted)]">Completed</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{Array.isArray(orders) ? orders.filter(o => o.status === 'DELIVERED').length : 0}</p>
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
            ) : !Array.isArray(orders) || orders.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[var(--muted)]">No orders found.</td></tr>
            ) : (
              orders.map((o) => {
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
                        <span className="font-medium">{route.pickup}</span>
                        <Truck className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className="font-medium">{route.dropoff}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {route.scheduled ? (
                        <p className="text-sm text-[var(--muted)]">{new Date(route.scheduled).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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

            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]/20">
              <div className="flex items-center gap-2">
                {workflowSteps.map((step, index) => (
                  <div key={step.number} className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => goToStep(step.number)}
                      className={`flex items-center gap-2 text-left ${formStep === step.number ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${formStep === step.number ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]' : formStep > step.number ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'border-[var(--border)]'}`}>{formStep > step.number ? '✓' : step.number}</span>
                      <span className="hidden sm:block"><span className="block text-xs font-semibold">{step.label}</span><span className="block text-[10px] text-[var(--muted)]">{step.description}</span></span>
                    </button>
                    {index < workflowSteps.length - 1 && <span className="h-px flex-1 bg-[var(--border)]" />}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-8">
                {/* 1. Customer & Reference */}
                <div className={formStep === 1 ? '' : 'hidden'}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <Building2 className="w-4 h-4" /> Customer & Reference
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Customer" required>
                      <select required={formStep === 1} className={inputClass} value={formData.customerId} onChange={e => {
                        const customer = customers.find(item => item.id === e.target.value);
                        setFormData({
                          ...formData,
                          customerId: e.target.value,
                          division: formData.division || customer?.division || '',
                          brand: formData.brand || customer?.brand || '',
                        });
                      }}>
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
                  {selectedCustomer && (
                    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">{selectedCustomer.companyName}</p>
                          <p className="text-xs text-[var(--muted)]">{selectedCustomer.accountNumber} · {selectedCustomer.email || selectedCustomer.phone || 'No contact on file'}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCustomer.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedCustomer.status || 'ACTIVE'}</span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">Customer data is linked from the customer workflow. Division and brand will be used as defaults unless overridden above.</p>
                    </div>
                  )}
                </div>

                {/* 2. Commercial references */}
                <div className={formStep === 1 ? '' : 'hidden'}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <FileText className="w-4 h-4" /> Commercial references
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="Requested date"><input type="date" className={inputClass} value={formData.requestedDate} onChange={e => setFormData({ ...formData, requestedDate: e.target.value })} /></Field>
                    <Field label="Requested by"><input className={inputClass} placeholder="Requester name" value={formData.requestedBy} onChange={e => setFormData({ ...formData, requestedBy: e.target.value })} /></Field>
                    <Field label="Division"><input className={inputClass} placeholder="Food, retail…" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} /></Field>
                    <Field label="Brand"><input className={inputClass} placeholder="Brand or project" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} /></Field>
                    <Field label="Way bill number"><input className={inputClass} value={formData.waybillNumber} onChange={e => setFormData({ ...formData, waybillNumber: e.target.value })} /></Field>
                    <Field label="DN number"><input className={inputClass} value={formData.deliveryNoteNumber} onChange={e => setFormData({ ...formData, deliveryNoteNumber: e.target.value })} /></Field>
                    <Field label="Invoice number"><input className={inputClass} value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} /></Field>
                    <Field label="RFQ / SO number"><input className={inputClass} value={formData.rfqNumber} onChange={e => setFormData({ ...formData, rfqNumber: e.target.value })} /></Field>
                    <div className="col-span-4"><Field label="Attachment references"><input className={inputClass} placeholder="POD, quote, email, or uploaded file URL" value={formData.attachmentReferences} onChange={e => setFormData({ ...formData, attachmentReferences: e.target.value })} /></Field></div>
                  </div>
                </div>

                {/* 3. Routing - Multi-location */}
                <div className={formStep === 2 ? '' : 'hidden'}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 border-b border-[var(--border)] pb-2">
                      <MapPin className="w-4 h-4" /> Multi-location Routing
                    </h3>
                    <button
                      type="button"
                      onClick={addLocation}
                      className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors border border-[var(--border)]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stop
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.locations.map((location, index) => (
                      <div key={index} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-[var(--muted)] cursor-move" />
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                getFormLocationType(index) === 'PICKUP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                getFormLocationType(index) === 'DROPOFF' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              }`}>
                                {getFormLocationType(index) === 'PICKUP' ? 'Pickup' : getFormLocationType(index) === 'DROPOFF' ? 'Drop-off' : 'Stop'} #{index + 1}
                              </span>
                              {formData.locations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeLocation(index)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Field label="Type">
                              <select
                                className={`${inputClass} text-xs`}
                                value={index === 0 ? 'PICKUP' : index === formData.locations.length - 1 ? 'DROPOFF' : 'INTERMEDIATE'}
                                disabled
                              >
                                <option value="PICKUP">Pickup</option>
                                <option value="DROPOFF">Drop-off</option>
                                <option value="INTERMEDIATE">Intermediate Stop</option>
                              </select>
                            </Field>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveLocation(index, index - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                title="Move up"
                              >
                                <ArrowUpDown className="w-4 h-4 rotate-90" />
                              </button>
                            )}
                            {index < formData.locations.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveLocation(index, index + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                title="Move down"
                              >
                                <ArrowUpDown className="w-4 h-4 -rotate-90" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Field label="Address" required>
                              <div className="relative">
                                <input
                                  required={formStep === 2}
                                  className={inputClass}
                                  placeholder="Start typing to search for an address..."
                                  value={location.address}
                                  onChange={e => {
                                    updateLocation(index, 'address', e.target.value);
                                    handleAddressSearch(e.target.value);
                                  }}
                                />
                                {searchingAddress && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Address Search Results Dropdown */}
                              {searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {searchResults.map((result, resultIndex) => (
                                    <button
                                      key={resultIndex}
                                      type="button"
                                      className="w-full text-left p-3 hover:bg-[var(--surface)] border-b border-[var(--border)] last:border-0 transition-colors"
                                      onClick={() => {
                                        updateLocation(index, 'address', result.display_name);
                                        updateLocation(index, 'city', result.address?.city || result.address?.town || result.address?.village || result.address?.county || '');
                                        updateLocation(index, 'region', result.address?.state || '');
                                        updateLocation(index, 'postalCode', result.address?.postcode || '');
                                        updateLocation(index, 'latitude', parseFloat(result.lat));
                                        updateLocation(index, 'longitude', parseFloat(result.lon));
                                        setSearchResults([]);
                                      }}
                                    >
                                      <div className="font-medium text-sm">{result.display_name}</div>
                                      <div className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 bg-[var(--surface)] rounded text-[10px] uppercase">{result.type}</span>
                                        <span>{result.address?.city || result.address?.town || result.address?.state || 'Unknown location'}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </Field>
                            
                            {/* Interactive Map Preview */}
                            <div className="mt-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Location Preview</span>
                                <span className="text-xs text-[var(--muted)]">
                                  {location.latitude && location.longitude 
                                    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                                    : 'Click map to set location'}
                                </span>
                              </div>
                              <MapDisplay 
                                latitude={location.latitude} 
                                longitude={location.longitude} 
                                address={location.address}
                                height="200px"
                                onLocationSelect={(lat, lng) => reverseGeocode(index, lat, lng)}
                              />
                            </div>
                          </div>
                          
                          <Field label="City">
                            <input
                              className={inputClass}
                              placeholder="Riyadh"
                              value={location.city}
                              onChange={e => updateLocation(index, 'city', e.target.value)}
                            />
                          </Field>
                          <Field label="Region">
                            <input
                              className={inputClass}
                              placeholder="Riyadh Region"
                              value={location.region}
                              onChange={e => updateLocation(index, 'region', e.target.value)}
                            />
                          </Field>
                          <Field label="Postal Code">
                            <input
                              className={inputClass}
                              placeholder="12345"
                              value={location.postalCode}
                              onChange={e => updateLocation(index, 'postalCode', e.target.value)}
                            />
                          </Field>
                          <Field label="Country">
                            <select
                              className={inputClass}
                              value={location.country}
                              onChange={e => updateLocation(index, 'country', e.target.value)}
                            >
                              <option value="SA">Saudi Arabia</option>
                              <option value="AE">United Arab Emirates</option>
                              <option value="QA">Qatar</option>
                              <option value="BH">Bahrain</option>
                              <option value="OM">Oman</option>
                              <option value="KW">Kuwait</option>
                            </select>
                          </Field>
                          <Field label="Contact Name">
                            <input
                              className={inputClass}
                              placeholder="Name"
                              value={location.contactName}
                              onChange={e => updateLocation(index, 'contactName', e.target.value)}
                            />
                          </Field>
                          <Field label="Contact Phone">
                            <input
                              className={inputClass}
                              placeholder="0500000000"
                              value={location.contactPhone}
                              onChange={e => updateLocation(index, 'contactPhone', e.target.value)}
                            />
                          </Field>
                          <Field label="Contact Email">
                            <input
                              type="email"
                              className={inputClass}
                              placeholder="contact@example.com"
                              value={location.contactEmail}
                              onChange={e => updateLocation(index, 'contactEmail', e.target.value)}
                            />
                          </Field>
                          <Field label="Scheduled Date">
                            <input
                              type="datetime-local"
                              className={inputClass}
                              value={location.scheduledDate}
                              onChange={e => updateLocation(index, 'scheduledDate', e.target.value)}
                            />
                          </Field>
                          <div className="col-span-2">
                            <Field label="Instructions">
                              <textarea
                                className={`${inputClass} min-h-[60px] resize-none`}
                                placeholder="Special instructions for this location..."
                                value={location.instructions}
                                onChange={e => updateLocation(index, 'instructions', e.target.value)}
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Provider & trip record */}
                <div className={formStep === 3 ? '' : 'hidden'}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <Truck className="w-4 h-4" /> Provider & trip record
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="Service provider" required><select required={formStep === 3} className={inputClass} value={formData.serviceProvider} onChange={e => changeProviderType(e.target.value)}><option value="">Select…</option><option value="COMPANY">Company fleet</option><option value="OUTSOURCE">Outsource</option></select></Field>
                    {isOutsourced && <Field label="Provider name" required><input required={formStep === 3} className={inputClass} placeholder="Supplier or subcontractor" value={formData.serviceProviderName} onChange={e => setFormData({ ...formData, serviceProviderName: e.target.value })} /></Field>}
                    {isOutsourced && <Field label="External driver"><input className={inputClass} placeholder="Driver name" value={formData.externalDriverName} onChange={e => setFormData({ ...formData, externalDriverName: e.target.value })} /></Field>}
                    {isOutsourced && <Field label="External vehicle no."><input className={inputClass} placeholder="License plate" value={formData.externalVehicleNumber} onChange={e => setFormData({ ...formData, externalVehicleNumber: e.target.value })} /></Field>}
                    {isOutsourced && <Field label="External vehicle type"><input className={inputClass} placeholder="Dyna, trailer…" value={formData.externalVehicleType} onChange={e => setFormData({ ...formData, externalVehicleType: e.target.value })} /></Field>}
                    {!formData.serviceProvider && <div className="col-span-3 flex items-center text-sm text-[var(--muted)]">Choose the provider first to see the relevant assignment fields.</div>}
                    {isCompanyFleet && <div className="col-span-3 flex items-center text-sm text-[var(--muted)]">Company fleet selected. Assign an internal driver and vehicle in Dispatch below. Outsource-only fields are hidden.</div>}
                    <Field label="Waiting / labor"><input className={inputClass} placeholder="Hours, cost, or note" value={formData.waitingLabor} onChange={e => setFormData({ ...formData, waitingLabor: e.target.value })} /></Field>
                    <Field label="Departure actual"><input type="datetime-local" className={inputClass} value={formData.actualPickup} onChange={e => setFormData({ ...formData, actualPickup: e.target.value })} /></Field>
                    <Field label="Arrival actual"><input type="datetime-local" className={inputClass} value={formData.actualDelivery} onChange={e => setFormData({ ...formData, actualDelivery: e.target.value })} /></Field>
                  </div>
                </div>

                {/* 5. Cargo & Pricing */}
                <div className={formStep === 2 ? '' : 'hidden'}>
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
                    <Field label="Quoted / billed amount"><input type="number" className={inputClass} placeholder="5000" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} /></Field>
                    <Field label="Payment Status">
                      <select className={inputClass} value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </Field>
                    <Field label="Provider cost"><input type="number" className={inputClass} value={formData.costAmount} onChange={e => setFormData({ ...formData, costAmount: e.target.value })} /></Field>
                    <Field label="Driver TA"><input type="number" className={inputClass} value={formData.driverTa} onChange={e => setFormData({ ...formData, driverTa: e.target.value })} /></Field>
                    <Field label="Trip cost"><input type="number" className={inputClass} value={formData.tripCost} onChange={e => setFormData({ ...formData, tripCost: e.target.value })} /></Field>
                    <Field label="Currency"><select className={inputClass} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}><option value="SAR">SAR</option><option value="USD">USD</option><option value="AED">AED</option></select></Field>
                  </div>
                </div>

                {/* 6. Delivery proof & audit */}
                <div className={formStep === 4 ? '' : 'hidden'}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <Activity className="w-4 h-4" /> Delivery proof & audit
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="Delivery status"><input className={inputClass} placeholder="Delivered, pending…" value={formData.deliveryStatus} onChange={e => setFormData({ ...formData, deliveryStatus: e.target.value })} /></Field>
                    <Field label="Receiver"><input className={inputClass} value={formData.receiver} onChange={e => setFormData({ ...formData, receiver: e.target.value })} /></Field>
                    <Field label="POD status"><input className={inputClass} placeholder="Received, pending…" value={formData.podStatus} onChange={e => setFormData({ ...formData, podStatus: e.target.value })} /></Field>
                    <Field label="Transit time"><input className={inputClass} placeholder="e.g. 8h 30m" value={formData.transitTime} onChange={e => setFormData({ ...formData, transitTime: e.target.value })} /></Field>
                    <Field label="Delivery duration (hours)"><input type="number" step="0.25" className={inputClass} value={formData.deliveryDurationHours} onChange={e => setFormData({ ...formData, deliveryDurationHours: e.target.value })} /></Field>
                    <Field label="Unloading finished"><input type="datetime-local" className={inputClass} value={formData.unloadingFinishedAt} onChange={e => setFormData({ ...formData, unloadingFinishedAt: e.target.value })} /></Field>
                    <Field label="Handled by"><input className={inputClass} value={formData.handledBy} onChange={e => setFormData({ ...formData, handledBy: e.target.value })} /></Field>
                    <Field label="Confirmed by"><input className={inputClass} value={formData.confirmedBy} onChange={e => setFormData({ ...formData, confirmedBy: e.target.value })} /></Field>
                    <Field label="Audit / PRO"><input className={inputClass} value={formData.auditPro} onChange={e => setFormData({ ...formData, auditPro: e.target.value })} /></Field>
                    <div className="col-span-3"><Field label="Additional comments"><textarea className={`${inputClass} min-h-[40px] resize-none`} value={formData.additionalComments} onChange={e => setFormData({ ...formData, additionalComments: e.target.value })} /></Field></div>
                  </div>
                </div>

                {/* 7. Dispatch */}
                <div className={formStep === 3 ? '' : 'hidden'}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                    <Truck className="w-4 h-4" /> Dispatch (Optional)
                  </h3>
                  {isCompanyFleet ? (
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Assign internal driver">
                        <select className={inputClass} value={formData.assignedDriverId} onChange={e => setFormData({ ...formData, assignedDriverId: e.target.value })}>
                          <option value="">Unassigned</option>
                          {drivers.filter(d => d.status === 'ACTIVE').map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                        </select>
                      </Field>
                      <Field label="Assign fleet vehicle">
                        <select className={inputClass} value={formData.assignedVehicleId} onChange={e => setFormData({ ...formData, assignedVehicleId: e.target.value })}>
                          <option value="">Unassigned</option>
                          {vehicles.filter(v => v.status === 'ACTIVE').map(v => <option key={v.id} value={v.id}>{v.licensePlate} ({v.vehicleType})</option>)}
                        </select>
                      </Field>
                      <div className="flex items-end pb-2 text-xs text-[var(--muted)]">Only company fleet resources can be assigned here.</div>
                    </div>
                  ) : isOutsourced ? (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                      This is an outsourced trip. Use the provider and external driver/vehicle fields above; internal fleet assignment is not applicable.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
                      Select Company fleet or Outsource above to configure dispatch.
                    </div>
                  )}
                  {isCompanyFleet && (selectedDriverOnLeave || selectedVehicle?.status !== 'ACTIVE') && (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                      {selectedDriverOnLeave && <p>The selected driver has approved leave during a scheduled stop.</p>}
                      {selectedVehicle && selectedVehicle.status !== 'ACTIVE' && <p>The selected vehicle is not currently active.</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 mt-4">
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
                {formStep > 1 && <button type="button" onClick={() => goToStep(formStep - 1)} className="px-5 py-2.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] transition-colors">Back</button>}
                {formStep < 4 ? (
                  <button type="button" onClick={advanceStep} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">Continue</button>
                ) : (
                  <button type="submit" disabled={submitting} className="bg-[var(--foreground)] text-[var(--background)] text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Confirm & create order'}
                  </button>
                )}
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
              {/* Locations - Show multi-locations if available, otherwise fallback to legacy fields */}
              {(selectedOrder.locations && selectedOrder.locations.length > 0) ? (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Route ({selectedOrder.locations.length} stops)</h3>
                  <div className="space-y-4">
                    {selectedOrder.locations.map((location: any, index: number) => (
                      <div key={location.id || index} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              location.type === 'PICKUP' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              location.type === 'DROPOFF' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {location.type === 'PICKUP' ? 'Pickup' : location.type === 'DROPOFF' ? 'Drop-off' : 'Stop'} #{index + 1}
                            </span>
                            {location.sequence !== undefined && <span className="text-xs text-[var(--muted)]">(Order: {location.sequence + 1})</span>}
                          </h4>
                          {location.scheduledDate && (
                            <span className="text-xs text-[var(--muted)]">
                              {new Date(location.scheduledDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{location.address}</p>
                        <div className="text-sm text-[var(--muted)] grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                          <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">City</span><span className="font-medium text-[var(--foreground)]">{location.city || '—'}</span></div>
                          <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Region</span><span className="font-medium text-[var(--foreground)]">{location.region || '—'}</span></div>
                          <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wider mb-0.5">Contact</span><span className="font-medium text-[var(--foreground)]">{location.contactName || '—'} {location.contactPhone ? `(${location.contactPhone})` : ''}</span></div>
                          {location.instructions && (
                            <div className="col-span-2 mt-2">
                              <span className="block text-[10px] uppercase tracking-wider mb-0.5">Instructions</span>
                              <span className="font-medium text-[var(--foreground)] text-xs">{location.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Pickup</h3>
                    <p className="text-sm">{selectedOrder.pickupLocation || '—'}</p>
                    <div className="text-sm text-[var(--muted)] grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                      <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">City</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.pickupCity || '—'}</span></div>
                      <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Scheduled</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.scheduledPickup ? new Date(selectedOrder.scheduledPickup).toLocaleDateString() : '—'}</span></div>
                      <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wider mb-0.5">Contact</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.pickupContactName || '—'} {selectedOrder.pickupContactPhone ? `(${selectedOrder.pickupContactPhone})` : ''}</span></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Drop-off</h3>
                    <p className="text-sm">{selectedOrder.dropoffLocation || '—'}</p>
                    <div className="text-sm text-[var(--muted)] grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                      <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">City</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.dropoffCity || '—'}</span></div>
                      <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Scheduled</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.scheduledDelivery ? new Date(selectedOrder.scheduledDelivery).toLocaleDateString() : '—'}</span></div>
                      <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wider mb-0.5">Contact</span><span className="font-medium text-[var(--foreground)]">{selectedOrder.dropoffContactName || '—'} {selectedOrder.dropoffContactPhone ? `(${selectedOrder.dropoffContactPhone})` : ''}</span></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Commercial references</h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Way bill</span><span className="font-medium">{selectedOrder.waybillNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">DN</span><span className="font-medium">{selectedOrder.deliveryNoteNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Invoice</span><span className="font-medium">{selectedOrder.invoiceNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">RFQ / SO</span><span className="font-medium">{selectedOrder.rfqNumber || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Attachments</span><span className="font-medium">{selectedOrder.attachmentReferences || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Division / brand</span><span className="font-medium">{[selectedOrder.division, selectedOrder.brand].filter(Boolean).join(' / ') || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Requested by</span><span className="font-medium">{selectedOrder.requestedBy || '—'}</span></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Delivery & proof</h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Delivery status</span><span className="font-medium">{selectedOrder.deliveryStatus || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">POD status</span><span className="font-medium">{selectedOrder.podStatus || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Receiver</span><span className="font-medium">{selectedOrder.receiver || '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Transit / duration</span><span className="font-medium">{selectedOrder.transitTime || (selectedOrder.deliveryDurationHours ? `${selectedOrder.deliveryDurationHours} hours` : '—')}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Arrival</span><span className="font-medium">{selectedOrder.actualDelivery ? new Date(selectedOrder.actualDelivery).toLocaleString() : '—'}</span></div>
                    <div><span className="block text-[10px] uppercase text-[var(--muted)]">Unloading finished</span><span className="font-medium">{selectedOrder.unloadingFinishedAt ? new Date(selectedOrder.unloadingFinishedAt).toLocaleString() : '—'}</span></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Cargo</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Type</span><span className="font-medium">{selectedOrder.cargoType || '—'}</span></div>
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
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Provider cost</span><span className="font-medium font-mono">{selectedOrder.costAmount ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Driver TA</span><span className="font-medium font-mono">{selectedOrder.driverTa ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Trip cost</span><span className="font-medium font-mono">{selectedOrder.tripCost ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Payment Status</span><span className="font-medium">{selectedOrder.paymentStatus || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Ref Number</span><span className="font-medium">{selectedOrder.referenceNumber || '—'}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Dispatch</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Driver</span><span className="font-medium">{selectedOrder.driver ? `${selectedOrder.driver.firstName} ${selectedOrder.driver.lastName}` : 'Unassigned'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Vehicle</span><span className="font-medium">{selectedOrder.vehicle?.licensePlate || 'Unassigned'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Provider</span><span className="font-medium">{selectedOrder.serviceProviderName || selectedOrder.serviceProvider || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Audit</span><span className="font-medium">{[selectedOrder.handledBy, selectedOrder.confirmedBy, selectedOrder.auditPro].filter(Boolean).join(' / ') || '—'}</span></div>
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
