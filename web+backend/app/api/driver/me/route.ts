import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'DRIVER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        driver: {
          include: {
            primaryVehicle: {
              include: {
                vehicleDocuments: true,
              },
            },
            documents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      driver: user.driver || null,
      user: { id: user.id, email: user.email, role: user.role, driverId: user.driverId },
    });
  } catch (error) {
    console.error('Failed to fetch driver profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
