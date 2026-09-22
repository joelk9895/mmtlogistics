import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
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

    // Fetch orders and leaves
    const orders = await prisma.order.findMany({
      where: { assignedDriverId: user.driverId },
      include: { customer: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const leaves = await prisma.driverLeave.findMany({
      where: { driverId: user.driverId },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ orders, leaves });
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
