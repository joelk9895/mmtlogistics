import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch orders and leaves for this driver
    const orders = await prisma.order.findMany({
      where: { assignedDriverId: id },
      include: { customer: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const leaves = await prisma.driverLeave.findMany({
      where: { driverId: id },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ orders, leaves });
  } catch (error) {
    console.error('Failed to fetch admin driver schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
