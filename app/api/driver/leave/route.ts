import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { driver: true },
    });

    if (!user || !user.driverId) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const leave = await prisma.driverLeave.create({
      data: {
        driverId: user.driverId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ leave });
  } catch (error) {
    console.error('Failed to request leave:', error);
    return NextResponse.json({ error: 'Failed to request leave' }, { status: 500 });
  }
}
