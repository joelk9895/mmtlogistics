import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, speed, heading } = await request.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
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

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLatitude: parseFloat(latitude),
        currentLongitude: parseFloat(longitude),
        speed: speed !== undefined && speed !== null ? parseFloat(speed) : null,
        heading: heading !== undefined && heading !== null ? parseFloat(heading) : null,
        lastLocationUpdate: new Date(),
      },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });

    return NextResponse.json({ success: true, location: updated });
  } catch (error) {
    console.error('Failed to update driver location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get drivers that have updated location in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const drivers = await prisma.driver.findMany({
      where: {
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        lastLocationUpdate: { gte: since },
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        currentLatitude: true,
        currentLongitude: true,
        speed: true,
        heading: true,
        lastLocationUpdate: true,
        primaryVehicle: {
          select: {
            licensePlate: true,
            make: true,
            model: true,
          },
        },
        orders: {
          where: { status: 'IN_TRANSIT' },
          take: 1,
          select: {
            id: true,
            trackingNumber: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error('Failed to fetch driver locations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
