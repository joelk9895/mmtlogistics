import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let driverId = session.driverId;
    if (!driverId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { driverId: true },
      });
      driverId = user?.driverId || undefined;
    }

    if (!driverId) {
      return NextResponse.json({ error: 'No associated driver account' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      assignedDriverId: driverId,
    };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
          },
        },
        locations: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch driver jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
