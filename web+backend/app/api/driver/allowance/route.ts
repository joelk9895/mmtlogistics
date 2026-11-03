import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getPlatformSettings } from '@/lib/platform-settings';

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

    const [driver, settings, completedOrders, expenses] = await Promise.all([
      prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          salary: true,
          monthlyAllowance: true,
        },
      }),
      getPlatformSettings(),
      prisma.order.findMany({
        where: {
          assignedDriverId: driverId,
          status: 'DELIVERED',
        },
        select: {
          id: true,
          trackingNumber: true,
          driverTa: true,
          actualDelivery: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driverExpense.findMany({
        where: { driverId },
        orderBy: { date: 'desc' },
      }),
    ]);

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const baseAllowance = driver.monthlyAllowance ?? settings.defaultMonthlyAllowance ?? 0;
    const totalTripTa = completedOrders.reduce((sum, order) => sum + (order.driverTa || 0), 0);
    const approvedExpenses = expenses
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = expenses
      .filter(e => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      summary: {
        currency: 'SAR',
        baseMonthlyAllowance: baseAllowance,
        totalTripTa,
        approvedExpensesReimbursable: approvedExpenses,
        pendingExpenses,
        totalNetEarnings: baseAllowance + totalTripTa + approvedExpenses,
      },
      completedTripsWithTa: completedOrders.slice(0, 15),
      recentExpenses: expenses.slice(0, 15),
    });
  } catch (error) {
    console.error('Failed to fetch driver allowance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
