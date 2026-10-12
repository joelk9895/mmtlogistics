import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
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

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const providerType = body.serviceProvider;
    if (providerType !== 'COMPANY' && providerType !== 'OUTSOURCE') {
      return NextResponse.json({ error: 'Service provider must be COMPANY or OUTSOURCE' }, { status: 400 });
    }
    const isCompanyFleet = providerType === 'COMPANY';
    if (!isCompanyFleet && !String(body.serviceProviderName || '').trim()) {
      return NextResponse.json({ error: 'Provider name is required for outsourced orders' }, { status: 400 });
    }

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
      if (!driver || driver.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Selected driver is not active' }, { status: 400 });
      }
      if (scheduledDate && driver.leaves.some(leave => scheduledDate >= leave.startDate && scheduledDate <= leave.endDate)) {
        return NextResponse.json({ error: 'Selected driver is on approved leave for the scheduled date' }, { status: 400 });
      }
    }
    if (isCompanyFleet && body.assignedVehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: body.assignedVehicleId }, select: { status: true } });
      if (!vehicle || vehicle.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Selected vehicle is not active' }, { status: 400 });
      }
    }
    const trackingNumber = await generateTrackingNumber();
    const asOptionalNumber = (value: unknown) =>
      value === '' || value === null || value === undefined ? null : Number(value);
    const asOptionalDate = (value: unknown) =>
      value ? new Date(String(value)) : null;

    // Check if we're using the new multi-location format
    const isMultiLocation = Array.isArray(body.locations) && body.locations.length > 0;
    
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
              address: location.address || '',
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
