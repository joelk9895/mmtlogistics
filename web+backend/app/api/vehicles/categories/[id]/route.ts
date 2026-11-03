import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/vehicles/categories/[id] — get single category with vehicle count
export async function GET(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const category = await prisma.vehicleCategory.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const vehicleCount = await prisma.vehicle.count({ where: { vehicleType: category.slug } });
    return NextResponse.json({ ...category, vehicleCount });
  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT /api/vehicles/categories/[id] — update a category
export async function PUT(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.vehicleCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const toFloat = (v: any) => v !== undefined && v !== null && v !== '' ? parseFloat(v) : null;
    const toInt = (v: any) => v !== undefined && v !== null && v !== '' ? parseInt(v, 10) : null;
    const toBool = (v: any) => v === true || v === 'true';
    const toStr = (v: any) => v && String(v).trim() ? String(v).trim() : null;

    // If slug changed, check for uniqueness and update vehicles
    let newSlug = existing.slug;
    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.vehicleCategory.findUnique({ where: { slug: body.slug } });
      if (slugTaken) return NextResponse.json({ error: `Slug "${body.slug}" is already in use` }, { status: 409 });
      // Update all vehicles referencing the old slug
      await prisma.vehicle.updateMany({
        where: { vehicleType: existing.slug },
        data: { vehicleType: body.slug },
      });
      newSlug = body.slug;
    }

    const category = await prisma.vehicleCategory.update({
      where: { id },
      data: {
        slug: newSlug,
        name: body.name || existing.name,
        description: toStr(body.description),
        icon: toStr(body.icon),

        // Classification
        vehicleClass: toStr(body.vehicleClass),
        bodyType: toStr(body.bodyType),
        primaryUse: toStr(body.primaryUse),

        // Capacity
        minPayloadTons: toFloat(body.minPayloadTons),
        maxPayloadTons: toFloat(body.maxPayloadTons),
        maxGvwKg: toFloat(body.maxGvwKg),
        palletCapacity: toInt(body.palletCapacity),
        volumeCapacityM3: toFloat(body.volumeCapacityM3),

        // Dimensions
        typicalLengthM: toFloat(body.typicalLengthM),
        typicalWidthM: toFloat(body.typicalWidthM),
        typicalHeightM: toFloat(body.typicalHeightM),
        maxHeightM: toFloat(body.maxHeightM),
        maxLengthM: toFloat(body.maxLengthM),

        // Axle & Wheel
        axleConfig: toStr(body.axleConfig),
        minAxles: toInt(body.minAxles),
        maxAxles: toInt(body.maxAxles),
        typicalWheelCount: toInt(body.typicalWheelCount),

        // Engine & Fuel
        defaultFuelType: toStr(body.defaultFuelType),
        minEnginePowerHp: toInt(body.minEnginePowerHp),
        maxEnginePowerHp: toInt(body.maxEnginePowerHp),
        transmissionTypes: toStr(body.transmissionTypes),

        // Saudi Regulatory
        requiresTgaCard: toBool(body.requiresTgaCard),
        requiresWasel: toBool(body.requiresWasel),
        requiresSpeedLimiter: toBool(body.requiresSpeedLimiter),
        defaultSpeedLimitKmh: toInt(body.defaultSpeedLimitKmh),
        minDriverLicenseType: toStr(body.minDriverLicenseType),
        requiresHazmatCert: toBool(body.requiresHazmatCert),
        requiresMvpiFrequency: toStr(body.requiresMvpiFrequency),

        // Operational
        temperatureControlled: toBool(body.temperatureControlled),
        minTempCelsius: toFloat(body.minTempCelsius),
        maxTempCelsius: toFloat(body.maxTempCelsius),
        adrClass: toStr(body.adrClass),
        canCarryHazmat: toBool(body.canCarryHazmat),
        canCarryLivestock: toBool(body.canCarryLivestock),
        canCarryOversized: toBool(body.canCarryOversized),
        requiresCrane: toBool(body.requiresCrane),
        requiresTailLift: toBool(body.requiresTailLift),

        // Cost & Maintenance
        estimatedDailyRateSar: toFloat(body.estimatedDailyRateSar),
        typicalServiceIntervalKm: toFloat(body.typicalServiceIntervalKm),
        typicalServiceIntervalDays: toInt(body.typicalServiceIntervalDays),
        estimatedFuelConsumption: toFloat(body.estimatedFuelConsumption),
        tireSizeSpec: toStr(body.tireSizeSpec),
        numberOfTires: toInt(body.numberOfTires),

        // Insurance
        insuranceCategory: toStr(body.insuranceCategory),
        defaultInsuranceType: toStr(body.defaultInsuranceType),

        // Display
        sortOrder: toInt(body.sortOrder) ?? existing.sortOrder,
        colorHex: toStr(body.colorHex),
        isActive: body.isActive !== undefined ? toBool(body.isActive) : existing.isActive,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Category update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/vehicles/categories/[id] — delete a category (only non-default)
export async function DELETE(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;

    const category = await prisma.vehicleCategory.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    if (category.isDefault) return NextResponse.json({ error: 'Cannot delete a default category' }, { status: 403 });

    // Check if any vehicles use this type
    const usageCount = await prisma.vehicle.count({ where: { vehicleType: category.slug } });
    if (usageCount > 0) {
      return NextResponse.json({ error: `Cannot delete — ${usageCount} vehicle(s) are using this type` }, { status: 409 });
    }

    await prisma.vehicleCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category delete error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
