import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const [
      totalDrivers,
      activeDrivers,
      totalVehicles,
      activeVehicles,
      totalCustomers,
      activeCustomers,
      totalOrders,
      pendingOrders,
      inTransitOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { companyName: true, accountNumber: true } },
          driver: { select: { firstName: true, lastName: true } },
          locations: {
            orderBy: { sequence: 'asc' },
            select: { type: true, city: true, address: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      drivers: { total: totalDrivers, active: activeDrivers },
      vehicles: { total: totalVehicles, active: activeVehicles },
      customers: { total: totalCustomers, active: activeCustomers },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        inTransit: inTransitOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
