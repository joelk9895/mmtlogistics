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

    const expenses = await prisma.driverExpense.findMany({
      where: { driverId },
      orderBy: { date: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            trackingNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { category, amount, description, receiptUrl, date, orderId, liters, odometerKm, station } = body;

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Valid amount in SAR is required' }, { status: 400 });
    }

    const newExpense = await prisma.driverExpense.create({
      data: {
        driverId,
        category: category || 'OTHER',
        amount: parseFloat(amount),
        description: description || null,
        receiptUrl: receiptUrl || null,
        date: date ? new Date(date) : new Date(),
        orderId: orderId || null,
        status: 'PENDING',
      },
    });

    // If it's a fuel expense and driver has a primary vehicle, also log in FuelLog for fleet tracking
    if (category === 'FUEL') {
      try {
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
          select: { firstName: true, lastName: true, primaryVehicle: { select: { id: true } } },
        });

        if (driver?.primaryVehicle) {
          await prisma.fuelLog.create({
            data: {
              vehicleId: driver.primaryVehicle.id,
              date: date ? new Date(date) : new Date(),
              liters: liters ? parseFloat(liters) : (parseFloat(amount) / 2.33), // Approx SAR/L in KSA if omitted
              totalCostSar: parseFloat(amount),
              odometerKm: odometerKm ? parseFloat(odometerKm) : null,
              station: station || 'Petrol Station',
              driverName: `${driver.firstName} ${driver.lastName}`,
              notes: description || 'Logged from Driver Mobile App',
            },
          });
        }
      } catch (fuelErr) {
        console.warn('Could not auto-create FuelLog:', fuelErr);
      }
    }

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
