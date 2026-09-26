import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { Prisma, VehicleStatus } from '@prisma/client';

export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: Prisma.VehicleWhereInput = {};
    if (status && Object.values(VehicleStatus).includes(status as VehicleStatus)) {
      where.status = status as VehicleStatus;
    }
    if (type) where.vehicleType = type;
    if (search) {
      where.OR = [
        { fleetNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { chassisNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
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
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
              select: { id: true, startDate: true, endDate: true, reason: true },
            },
          },
        },
        _count: { select: { maintenanceRecords: true, fuelLogs: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();

    // Auto-generate fleet number
    const count = await prisma.vehicle.count();
    const fleetNumber = body.fleetNumber || `VH-${String(count + 1).padStart(3, '0')}`;

    const vehicle = await prisma.vehicle.create({
      data: {
        fleetNumber,
        make: body.make,
        model: body.model,
        year: body.year ? parseInt(body.year) : null,
        color: body.color || null,
        vehicleType: body.vehicleType || 'RIGID_TRUCK',
        status: body.status || 'ACTIVE',
        photoUrl: body.photoUrl || null,

        licensePlate: body.licensePlate,
        chassisNumber: body.chassisNumber || null,
        engineNumber: body.engineNumber || null,
        istimaraNumber: body.istimaraNumber || null,
        istimaraExpiry: body.istimaraExpiry ? new Date(body.istimaraExpiry) : null,
        registrationCity: body.registrationCity || null,

        capacity: parseFloat(body.capacity),
        grossVehicleWeight: body.grossVehicleWeight ? parseFloat(body.grossVehicleWeight) : null,
        netWeight: body.netWeight ? parseFloat(body.netWeight) : null,
        numberOfAxles: body.numberOfAxles ? parseInt(body.numberOfAxles) : null,
        lengthMeters: body.lengthMeters ? parseFloat(body.lengthMeters) : null,
        widthMeters: body.widthMeters ? parseFloat(body.widthMeters) : null,
        heightMeters: body.heightMeters ? parseFloat(body.heightMeters) : null,

        fuelType: body.fuelType || 'DIESEL',
        tankCapacityLiters: body.tankCapacityLiters ? parseFloat(body.tankCapacityLiters) : null,
        engineCapacityCC: body.engineCapacityCC ? parseInt(body.engineCapacityCC) : null,
        transmissionType: body.transmissionType || null,
        horsePower: body.horsePower ? parseInt(body.horsePower) : null,

        tgaOperationCardNumber: body.tgaOperationCardNumber || null,
        tgaOperationCardExpiry: body.tgaOperationCardExpiry ? new Date(body.tgaOperationCardExpiry) : null,
        waselTrackerId: body.waselTrackerId || null,
        waselConnected: body.waselConnected === true,
        speedLimiterInstalled: body.speedLimiterInstalled === true,
        speedLimitKmh: body.speedLimitKmh ? parseInt(body.speedLimitKmh) : null,

        insuranceProvider: body.insuranceProvider || null,
        insurancePolicyNo: body.insurancePolicyNo || null,
        insuranceType: body.insuranceType || null,
        insuranceStartDate: body.insuranceStartDate ? new Date(body.insuranceStartDate) : null,
        insuranceExpiryDate: body.insuranceExpiryDate ? new Date(body.insuranceExpiryDate) : null,

        lastMvpiDate: body.lastMvpiDate ? new Date(body.lastMvpiDate) : null,
        nextMvpiDate: body.nextMvpiDate ? new Date(body.nextMvpiDate) : null,
        mvpiStation: body.mvpiStation || null,
        mvpiResult: body.mvpiResult || null,

        currentOdometerKm: body.currentOdometerKm ? parseFloat(body.currentOdometerKm) : 0,
        nextServiceDueKm: body.nextServiceDueKm ? parseFloat(body.nextServiceDueKm) : null,
        nextServiceDueDate: body.nextServiceDueDate ? new Date(body.nextServiceDueDate) : null,
        tireChangeKm: body.tireChangeKm ? parseFloat(body.tireChangeKm) : null,
        oilChangeKm: body.oilChangeKm ? parseFloat(body.oilChangeKm) : null,

        assignedDriverId: body.assignedDriverId || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Vehicle create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create vehicle';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
