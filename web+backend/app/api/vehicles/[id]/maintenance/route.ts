import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { Prisma } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/vehicles/[id]/maintenance — list maintenance records
export async function GET(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const records = await prisma.maintenanceRecord.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Maintenance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
  }
}

// POST /api/vehicles/[id]/maintenance — add a maintenance record
export async function POST(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId: id,
        type: body.type || 'PREVENTIVE',
        status: body.status || 'SCHEDULED',
        title: body.title,
        description: body.description || null,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        odometerAtService: body.odometerAtService ? parseFloat(body.odometerAtService) : null,
        laborCostSar: body.laborCostSar ? parseFloat(body.laborCostSar) : null,
        partsCostSar: body.partsCostSar ? parseFloat(body.partsCostSar) : null,
        totalCostSar: body.totalCostSar ? parseFloat(body.totalCostSar) : null,
        vendor: body.vendor || null,
        invoiceNumber: body.invoiceNumber || null,
        warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : null,
        partsReplaced: body.partsReplaced || null,
        nextServiceDate: body.nextServiceDate ? new Date(body.nextServiceDate) : null,
        nextServiceKm: body.nextServiceKm ? parseFloat(body.nextServiceKm) : null,
        notes: body.notes || null,
      },
    });

    // Update vehicle's next service fields if provided
    if (body.nextServiceDate || body.nextServiceKm) {
      const updateData: Prisma.VehicleUpdateInput = {};
      if (body.nextServiceDate) updateData.nextServiceDueDate = new Date(body.nextServiceDate);
      if (body.nextServiceKm) updateData.nextServiceDueKm = parseFloat(body.nextServiceKm);
      await prisma.vehicle.update({ where: { id }, data: updateData });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Maintenance create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create maintenance record';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
