import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { leaveBalance } from '@/lib/leave-balance';
import { getPlatformSettings } from '@/lib/platform-settings';

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

    const driver = await prisma.driver.findUnique({
      where: { id },
      select: { annualLeaveAllowance: true, usePlatformLeaveAllowance: true },
    });
    if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

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

    const settings = await getPlatformSettings();
    return NextResponse.json({ orders, leaves, leaveBalance: leaveBalance(leaves, driver.usePlatformLeaveAllowance ? settings.defaultAnnualLeaveDays : (driver.annualLeaveAllowance ?? settings.defaultAnnualLeaveDays)) });
  } catch (error) {
    console.error('Failed to fetch admin driver schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
