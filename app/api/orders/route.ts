import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
      }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const order = await prisma.order.create({
      data: {
        customerId: body.customerId,
        pickupLocation: body.pickupLocation,
        dropoffLocation: body.dropoffLocation,
        assignedDriverId: body.assignedDriverId || null,
        assignedVehicleId: body.assignedVehicleId || null,
        status: body.status || 'PENDING',
      },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
      }
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
