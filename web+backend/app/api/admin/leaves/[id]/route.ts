import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const leave = await prisma.driverLeave.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ leave });
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 });
  }
}
