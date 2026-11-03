import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const logs = await prisma.fuelLog.findMany({
      where: { vehicleId: id },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Fuel log fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch fuel logs' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    const totalCost = body.totalCostSar
      ? parseFloat(body.totalCostSar)
      : (body.liters && body.costPerLiter)
        ? parseFloat(body.liters) * parseFloat(body.costPerLiter)
        : null;

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: id,
        date: body.date ? new Date(body.date) : new Date(),
        fuelType: body.fuelType || 'DIESEL',
        liters: parseFloat(body.liters),
        costPerLiter: body.costPerLiter ? parseFloat(body.costPerLiter) : null,
        totalCostSar: totalCost,
        odometerKm: body.odometerKm ? parseFloat(body.odometerKm) : null,
        station: body.station || null,
        driverName: body.driverName || null,
        fullTank: body.fullTank !== false,
        notes: body.notes || null,
      },
    });

    // Update vehicle odometer if provided
    if (body.odometerKm) {
      await prisma.vehicle.update({
        where: { id },
        data: {
          currentOdometerKm: parseFloat(body.odometerKm),
          lastOdometerUpdate: new Date(),
        },
      });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Fuel log create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create fuel log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
