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
    const trackingNumber = await generateTrackingNumber();
    
    const data: any = {
      trackingNumber,
      customerId: body.customerId,
      
      // Reference
      customerPoNumber: body.customerPoNumber || null,
      referenceNumber: body.referenceNumber || null,
      
      // Routing
      pickupLocation: body.pickupLocation,
      pickupCity: body.pickupCity || null,
      pickupContactName: body.pickupContactName || null,
      pickupContactPhone: body.pickupContactPhone || null,
      
      dropoffLocation: body.dropoffLocation,
      dropoffCity: body.dropoffCity || null,
      dropoffContactName: body.dropoffContactName || null,
      dropoffContactPhone: body.dropoffContactPhone || null,
      
      // Cargo
      cargoDescription: body.cargoDescription || null,
      cargoType: body.cargoType || 'GENERAL',
      weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
      volumeCbm: body.volumeCbm ? parseFloat(body.volumeCbm) : null,
      pallets: body.pallets ? parseInt(body.pallets) : null,
      
      // Financial
      totalAmount: body.totalAmount ? parseFloat(body.totalAmount) : null,
      currency: body.currency || 'SAR',
      paymentStatus: body.paymentStatus || 'UNPAID',
      
      // Dispatch
      assignedDriverId: body.assignedDriverId || null,
      assignedVehicleId: body.assignedVehicleId || null,
      status: body.status || 'PENDING',
      notes: body.notes || null,
    };
    
    if (body.scheduledPickup) data.scheduledPickup = new Date(body.scheduledPickup);
    if (body.scheduledDelivery) data.scheduledDelivery = new Date(body.scheduledDelivery);

    const order = await prisma.order.create({
      data,
      include: {
        customer: true,
        driver: true,
        vehicle: true,
      }
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

