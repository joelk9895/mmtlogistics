import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { Prisma } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        assignedDriver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            phone: true,
            status: true,
            leaves: {
              where: {
                status: 'APPROVED',
              },
              orderBy: { startDate: 'desc' },
              take: 5,
              select: { id: true, startDate: true, endDate: true, reason: true, status: true },
            },
          },
        },
        maintenanceRecords: { orderBy: { createdAt: 'desc' }, take: 20 },
        fuelLogs: { orderBy: { date: 'desc' }, take: 20 },
        vehicleDocuments: { orderBy: { createdAt: 'desc' } },
        inspections: { orderBy: { date: 'desc' }, take: 10 },
        _count: { select: { orders: true } },
      },
    });
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Vehicle detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data dynamically - only include provided fields
    const data: Prisma.VehicleUpdateInput = {};

    // String fields
    const stringFields = [
      'make', 'model', 'color', 'vehicleType', 'status', 'photoUrl',
      'licensePlate', 'chassisNumber', 'engineNumber', 'istimaraNumber', 'registrationCity',
      'fuelType', 'transmissionType',
      'tgaOperationCardNumber', 'waselTrackerId',
      'insuranceProvider', 'insurancePolicyNo', 'insuranceType',
      'mvpiStation', 'mvpiResult',
      'notes', 'fleetNumber',
    ] as const;
    const bodyObj = body as Record<string, any>;
    for (const f of stringFields) {
      if (f in bodyObj) (data as any)[f] = bodyObj[f] || null;
    }
    // Keep required strings non-null
    if ('make' in bodyObj) data.make = bodyObj.make;
    if ('model' in bodyObj) data.model = bodyObj.model;
    if ('licensePlate' in bodyObj) data.licensePlate = bodyObj.licensePlate;
    if ('fleetNumber' in bodyObj) data.fleetNumber = bodyObj.fleetNumber;
    if ('assignedDriverId' in bodyObj) {
      data.assignedDriver = bodyObj.assignedDriverId
        ? { connect: { id: bodyObj.assignedDriverId } }
        : { disconnect: true };
    }

    // Int fields
    const intFields = ['year', 'numberOfAxles', 'engineCapacityCC', 'horsePower', 'speedLimitKmh'] as const;
    for (const f of intFields) {
      if (f in bodyObj) (data as any)[f] = bodyObj[f] ? parseInt(bodyObj[f]) : null;
    }

    // Float fields
    const floatFields = [
      'capacity', 'grossVehicleWeight', 'netWeight', 'lengthMeters', 'widthMeters', 'heightMeters',
      'tankCapacityLiters', 'currentOdometerKm', 'averageDailyKm',
      'nextServiceDueKm', 'tireChangeKm', 'oilChangeKm',
    ] as const;
    for (const f of floatFields) {
      if (f in bodyObj) (data as any)[f] = bodyObj[f] ? parseFloat(bodyObj[f]) : null;
    }
    if ('capacity' in bodyObj) data.capacity = parseFloat(bodyObj.capacity);
    if ('currentOdometerKm' in bodyObj) data.currentOdometerKm = parseFloat(bodyObj.currentOdometerKm) || 0;

    // Date fields
    const dateFields = [
      'istimaraExpiry', 'tgaOperationCardExpiry',
      'insuranceStartDate', 'insuranceExpiryDate',
      'lastMvpiDate', 'nextMvpiDate', 'lastOdometerUpdate',
      'nextServiceDueDate',
    ] as const;
    for (const f of dateFields) {
      if (f in bodyObj) (data as any)[f] = bodyObj[f] ? new Date(bodyObj[f]) : null;
    }

    // Boolean fields
    const boolFields = ['waselConnected', 'speedLimiterInstalled'] as const;
    for (const f of boolFields) {
      if (f in bodyObj) (data as any)[f] = bodyObj[f] === true;
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Vehicle update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update vehicle';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vehicle delete error:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
