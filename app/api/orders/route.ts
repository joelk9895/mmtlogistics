import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    const driverId = searchParams.get('driverId') || '';
    const vehicleId = searchParams.get('vehicleId') || '';
    
    const where: any = {};
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { customerPoNumber: { contains: search, mode: 'insensitive' } },
        { waybillNumber: { contains: search, mode: 'insensitive' } },
        { deliveryNoteNumber: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { rfqNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { serviceProviderName: { contains: search, mode: 'insensitive' } },
        { externalDriverName: { contains: search, mode: 'insensitive' } },
        { externalVehicleNumber: { contains: search, mode: 'insensitive' } },
        { pickupLocation: { contains: search, mode: 'insensitive' } },
        { dropoffLocation: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (driverId) where.assignedDriverId = driverId;
    if (vehicleId) where.assignedVehicleId = vehicleId;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, companyName: true, accountNumber: true, email: true, phone: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        vehicle: { select: { id: true, licensePlate: true, vehicleType: true } },

        locations: { orderBy: { sequence: 'asc' } },
      }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

async function generateTrackingNumber(): Promise<string> {
  const last = await prisma.order.findFirst({
    orderBy: { trackingNumber: 'desc' },
    select: { trackingNumber: true },
  });
  if (!last || !last.trackingNumber) return 'TRK-100001';
  const lastNum = parseInt(last.trackingNumber.replace('TRK-', ''), 10);
  return isNaN(lastNum) ? 'TRK-100001' : `TRK-${(lastNum + 1)}`;
}

type ScheduledOrder = {
  scheduledPickup: Date | null;
  scheduledDelivery: Date | null;
  locations: { scheduledDate: Date | null }[];
};

function orderScheduleRange(order: ScheduledOrder): { start: Date; end: Date } | null {
  const stopDates = order.locations
    .map((location) => location.scheduledDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  const start = stopDates[0] || order.scheduledPickup;
  const end = stopDates.at(-1) || order.scheduledDelivery || start;
  return start && end ? { start, end } : null;
}

function schedulesOverlap(first: { start: Date; end: Date }, second: { start: Date; end: Date }) {
  return first.start <= second.end && first.end >= second.start;
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const providerType = body.serviceProvider;
    if (providerType !== 'COMPANY' && providerType !== 'OUTSOURCE') {
      return NextResponse.json({ error: 'Service provider must be COMPANY or OUTSOURCE' }, { status: 400 });
    }
    if (!String(body.customerId || '').trim()) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }
    if (!Array.isArray(body.locations) || body.locations.length < 2) {
      return NextResponse.json({ error: 'A pickup and drop-off location are required' }, { status: 400 });
    }
    if (body.locations.some((location: unknown) =>
      !location || typeof location !== 'object' || !String((location as { address?: unknown }).address || '').trim()
    )) {
      return NextResponse.json({ error: 'An address is required for every route stop' }, { status: 400 });
    }
    const isCompanyFleet = providerType === 'COMPANY';
    if (!isCompanyFleet && !String(body.serviceProviderName || '').trim()) {
      return NextResponse.json({ error: 'Provider name is required for outsourced orders' }, { status: 400 });
    }

    const scheduledStops = body.locations
      .map((location: { scheduledDate?: unknown }) => location.scheduledDate ? new Date(String(location.scheduledDate)) : null);
    const requiresAssignmentSchedule = isCompanyFleet && (body.assignedDriverId || body.assignedVehicleId);
    if (requiresAssignmentSchedule && (!scheduledStops[0] || !scheduledStops.at(-1) || scheduledStops.some((date: Date | null) => date && Number.isNaN(date.getTime())))) {
      return NextResponse.json({ error: 'Pickup and drop-off times are required before assigning a driver or vehicle.' }, { status: 400 });
    }
    const assignmentRange = requiresAssignmentSchedule
      ? { start: scheduledStops[0]!, end: scheduledStops.at(-1)! }
      : null;

    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      select: { status: true, division: true, brand: true },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }
    if (customer.status === 'BLACKLISTED' || customer.status === 'ON_HOLD') {
      return NextResponse.json({ error: `Customer is ${customer.status.toLowerCase().replace('_', ' ')} and cannot receive a new order` }, { status: 400 });
    }

    const scheduledLocation = Array.isArray(body.locations)
      ? body.locations.find((location: any) => location.scheduledDate)?.scheduledDate
      : undefined;
    const scheduledValue = body.scheduledPickup || body.requestedDate || scheduledLocation;
    const scheduledDate = scheduledValue ? new Date(String(scheduledValue)) : null;
    if (isCompanyFleet && body.assignedDriverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: body.assignedDriverId },
        select: { status: true, leaves: { where: { status: 'APPROVED' }, select: { startDate: true, endDate: true } } },
      });
      if (!driver || !['ACTIVE', 'ON_LEAVE'].includes(driver.status)) {
        return NextResponse.json({ error: 'Selected driver is not active' }, { status: 400 });
      }
      const assignmentDate = scheduledDate || new Date();
      if (driver.leaves.some(leave => assignmentDate >= leave.startDate && assignmentDate <= leave.endDate)) {
        return NextResponse.json({ error: 'Selected driver is on approved leave for the scheduled date' }, { status: 400 });
      }
    }
    if (isCompanyFleet && body.assignedVehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: body.assignedVehicleId }, select: { status: true } });
      if (!vehicle || vehicle.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Selected vehicle is not active' }, { status: 400 });
      }
    }

    if (assignmentRange) {
      const conflictSelect = {
        id: true,
        trackingNumber: true,
        scheduledPickup: true,
        scheduledDelivery: true,
        locations: { select: { scheduledDate: true } },
      } satisfies Prisma.OrderSelect;
      const findActiveAssignments = (where: Prisma.OrderWhereInput) => prisma.order.findMany({
        where: { ...where, status: { in: ['PENDING', 'IN_TRANSIT'] } },
        select: conflictSelect,
      });
      const [driverOrders, vehicleOrders] = await Promise.all([
        body.assignedDriverId ? findActiveAssignments({ assignedDriverId: body.assignedDriverId }) : [],
        body.assignedVehicleId ? findActiveAssignments({ assignedVehicleId: body.assignedVehicleId }) : [],
      ]);
      const driverConflict = driverOrders.find((order) => {
        const range = orderScheduleRange(order);
        return range && schedulesOverlap(assignmentRange, range);
      });
      const vehicleConflict = vehicleOrders.find((order) => {
        const range = orderScheduleRange(order);
        return range && schedulesOverlap(assignmentRange, range);
      });
      if (driverConflict) return NextResponse.json({ error: `Selected driver is already assigned to ${driverConflict.trackingNumber} at this time.` }, { status: 409 });
      if (vehicleConflict) return NextResponse.json({ error: `Selected vehicle is already assigned to ${vehicleConflict.trackingNumber} at this time.` }, { status: 409 });
    }
    const trackingNumber = await generateTrackingNumber();
    const asOptionalNumber = (value: unknown) =>
      value === '' || value === null || value === undefined ? null : Number(value);
    const asOptionalDate = (value: unknown) =>
      value ? new Date(String(value)) : null;

    // Check if we're using the new multi-location format
    const isMultiLocation = true;
    
    const data: any = {
      trackingNumber,
      customerId: body.customerId,
      
      // Reference
      customerPoNumber: body.customerPoNumber || null,
      referenceNumber: body.referenceNumber || null,
      waybillNumber: body.waybillNumber || null,
      deliveryNoteNumber: body.deliveryNoteNumber || null,
      invoiceNumber: body.invoiceNumber || null,
      rfqNumber: body.rfqNumber || null,
      attachmentReferences: body.attachmentReferences || null,
      division: body.division || customer.division || null,
      brand: body.brand || customer.brand || null,
      requestedBy: body.requestedBy || null,
      requestedDate: asOptionalDate(body.requestedDate),
      
      // Legacy routing fields - keep for backward compatibility
      pickupLocation: isMultiLocation ? null : body.pickupLocation,
      pickupCity: isMultiLocation ? null : body.pickupCity || null,
      pickupContactName: isMultiLocation ? null : body.pickupContactName || null,
      pickupContactPhone: isMultiLocation ? null : body.pickupContactPhone || null,
      
      dropoffLocation: isMultiLocation ? null : body.dropoffLocation,
      dropoffCity: isMultiLocation ? null : body.dropoffCity || null,
      dropoffContactName: isMultiLocation ? null : body.dropoffContactName || null,
      dropoffContactPhone: isMultiLocation ? null : body.dropoffContactPhone || null,
      
      // Cargo
      cargoDescription: body.cargoDescription || null,
      cargoType: body.cargoType || 'GENERAL',
      weightKg: asOptionalNumber(body.weightKg),
      volumeCbm: asOptionalNumber(body.volumeCbm),
      pallets: asOptionalNumber(body.pallets),
      
      // Financial
      totalAmount: asOptionalNumber(body.totalAmount),
      costAmount: asOptionalNumber(body.costAmount),
      driverTa: asOptionalNumber(body.driverTa),
      tripCost: asOptionalNumber(body.tripCost),
      currency: body.currency || 'SAR',
      paymentStatus: body.paymentStatus || 'UNPAID',

      // Provider, proof of delivery, and tracker audit fields
      serviceProvider: providerType,
      serviceProviderName: isCompanyFleet ? null : body.serviceProviderName || null,
      externalDriverName: isCompanyFleet ? null : body.externalDriverName || null,
      externalVehicleNumber: isCompanyFleet ? null : body.externalVehicleNumber || null,
      externalVehicleType: isCompanyFleet ? null : body.externalVehicleType || null,
      additionalComments: body.additionalComments || null,
      waitingLabor: body.waitingLabor || null,
      deliveryStatus: body.deliveryStatus || null,
      receiver: body.receiver || null,
      podStatus: body.podStatus || null,
      transitTime: body.transitTime || null,
      deliveryDurationHours: asOptionalNumber(body.deliveryDurationHours),
      unloadingFinishedAt: asOptionalDate(body.unloadingFinishedAt),
      handledBy: body.handledBy || null,
      confirmedBy: body.confirmedBy || null,
      auditPro: body.auditPro || null,
      
      // Dispatch
      assignedDriverId: isCompanyFleet ? body.assignedDriverId || null : null,
      assignedVehicleId: isCompanyFleet ? body.assignedVehicleId || null : null,
      status: body.status || 'PENDING',
      notes: body.notes || null,
    };
    
    if (body.scheduledPickup) data.scheduledPickup = new Date(body.scheduledPickup);
    if (body.scheduledDelivery) data.scheduledDelivery = new Date(body.scheduledDelivery);
    if (body.actualPickup) data.actualPickup = new Date(body.actualPickup);
    if (body.actualDelivery) data.actualDelivery = new Date(body.actualDelivery);

    // Create the order with locations if provided
    const order = await prisma.order.create({
      data: {
        ...data,
        // Create locations if provided
        ...(isMultiLocation && {
          locations: {
            create: body.locations.map((location: any, index: number) => ({
              type: location.type || 'INTERMEDIATE',
              sequence: location.sequence !== undefined ? location.sequence : index,
              address: location.address.trim(),
              city: location.city || null,
              region: location.region || null,
              postalCode: location.postalCode || null,
              country: location.country || 'SA',
              latitude: location.latitude ? parseFloat(location.latitude) : null,
              longitude: location.longitude ? parseFloat(location.longitude) : null,
              contactName: location.contactName || null,
              contactPhone: location.contactPhone || null,
              contactEmail: location.contactEmail || null,
              scheduledDate: location.scheduledDate ? new Date(location.scheduledDate) : null,
              instructions: location.instructions || null,
              notes: location.notes || null,
            }))
          }
        })
      },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        locations: true,
      }
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const asOptionalNumber = (value: unknown) =>
      value === '' || value === null || value === undefined ? null : Number(value);
    const asOptionalDate = (value: unknown) =>
      value ? new Date(String(value)) : null;

    const data: any = {};

    // Allow updating status
    if (updates.status) data.status = updates.status;

    // Core & Reference fields
    if (updates.customerId !== undefined) data.customerId = updates.customerId;
    if (updates.customerPoNumber !== undefined) data.customerPoNumber = updates.customerPoNumber || null;
    if (updates.referenceNumber !== undefined) data.referenceNumber = updates.referenceNumber || null;
    if (updates.waybillNumber !== undefined) data.waybillNumber = updates.waybillNumber || null;
    if (updates.deliveryNoteNumber !== undefined) data.deliveryNoteNumber = updates.deliveryNoteNumber || null;
    if (updates.invoiceNumber !== undefined) data.invoiceNumber = updates.invoiceNumber || null;
    if (updates.rfqNumber !== undefined) data.rfqNumber = updates.rfqNumber || null;
    if (updates.requestedDate !== undefined) data.requestedDate = asOptionalDate(updates.requestedDate);
    if (updates.requestedBy !== undefined) data.requestedBy = updates.requestedBy || null;
    if (updates.division !== undefined) data.division = updates.division || null;
    if (updates.brand !== undefined) data.brand = updates.brand || null;

    // Cargo fields
    if (updates.cargoDescription !== undefined) data.cargoDescription = updates.cargoDescription || null;
    if (updates.cargoType !== undefined) data.cargoType = updates.cargoType || 'GENERAL';
    if (updates.weightKg !== undefined) data.weightKg = asOptionalNumber(updates.weightKg);
    if (updates.volumeCbm !== undefined) data.volumeCbm = asOptionalNumber(updates.volumeCbm);
    if (updates.pallets !== undefined) data.pallets = asOptionalNumber(updates.pallets);

    // Allow updating dispatch assignments
    if (updates.assignedDriverId !== undefined) data.assignedDriverId = updates.assignedDriverId || null;
    if (updates.assignedVehicleId !== undefined) data.assignedVehicleId = updates.assignedVehicleId || null;

    // Allow updating service provider info
    if (updates.serviceProvider !== undefined) data.serviceProvider = updates.serviceProvider;
    if (updates.serviceProviderName !== undefined) data.serviceProviderName = updates.serviceProviderName || null;
    if (updates.externalDriverName !== undefined) data.externalDriverName = updates.externalDriverName || null;
    if (updates.externalVehicleNumber !== undefined) data.externalVehicleNumber = updates.externalVehicleNumber || null;
    if (updates.externalVehicleType !== undefined) data.externalVehicleType = updates.externalVehicleType || null;

    // Financial fields
    if (updates.totalAmount !== undefined) data.totalAmount = asOptionalNumber(updates.totalAmount);
    if (updates.costAmount !== undefined) data.costAmount = asOptionalNumber(updates.costAmount);
    if (updates.driverTa !== undefined) data.driverTa = asOptionalNumber(updates.driverTa);
    if (updates.tripCost !== undefined) data.tripCost = asOptionalNumber(updates.tripCost);
    if (updates.paymentStatus !== undefined) data.paymentStatus = updates.paymentStatus;

    // Delivery proof & audit fields
    if (updates.deliveryStatus !== undefined) data.deliveryStatus = updates.deliveryStatus || null;
    if (updates.receiver !== undefined) data.receiver = updates.receiver || null;
    if (updates.podStatus !== undefined) data.podStatus = updates.podStatus || null;
    if (updates.transitTime !== undefined) data.transitTime = updates.transitTime || null;
    if (updates.deliveryDurationHours !== undefined) data.deliveryDurationHours = asOptionalNumber(updates.deliveryDurationHours);
    if (updates.unloadingFinishedAt !== undefined) data.unloadingFinishedAt = asOptionalDate(updates.unloadingFinishedAt);
    if (updates.actualPickup !== undefined) data.actualPickup = asOptionalDate(updates.actualPickup);
    if (updates.actualDelivery !== undefined) data.actualDelivery = asOptionalDate(updates.actualDelivery);
    if (updates.handledBy !== undefined) data.handledBy = updates.handledBy || null;
    if (updates.confirmedBy !== undefined) data.confirmedBy = updates.confirmedBy || null;
    if (updates.auditPro !== undefined) data.auditPro = updates.auditPro || null;
    if (updates.notes !== undefined) data.notes = updates.notes || null;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, companyName: true, accountNumber: true, email: true, phone: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        vehicle: { select: { id: true, licensePlate: true, vehicleType: true } },
        locations: { orderBy: { sequence: 'asc' } },
      },
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
