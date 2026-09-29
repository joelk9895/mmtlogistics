import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/vehicles/categories — list all vehicle categories
export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const categories = await prisma.vehicleCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/vehicles/categories — create a new vehicle category
export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Auto-generate slug from name if not provided
    const slug = body.slug || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

    // Check for duplicate slug
    const existing = await prisma.vehicleCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Category "${slug}" already exists` }, { status: 409 });
    }

    const toFloat = (v: any) => v !== undefined && v !== null && v !== '' ? parseFloat(v) : null;
    const toInt = (v: any) => v !== undefined && v !== null && v !== '' ? parseInt(v, 10) : null;
    const toBool = (v: any) => v === true || v === 'true';
    const toStr = (v: any) => v && String(v).trim() ? String(v).trim() : null;

    const category = await prisma.vehicleCategory.create({
      data: {
        slug,
        name: body.name,
        description: toStr(body.description),
        icon: toStr(body.icon),
        isDefault: false,

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
        sortOrder: toInt(body.sortOrder) ?? 0,
        colorHex: toStr(body.colorHex),
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Category create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
