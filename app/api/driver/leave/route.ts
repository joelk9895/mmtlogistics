import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { leaveBalance, leaveDaysInYear } from '@/lib/leave-balance';
import { getPlatformSettings } from '@/lib/platform-settings';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { driver: { include: { leaves: true } } },
    });

    if (!user || !user.driverId) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return NextResponse.json({ error: 'End date must be on or after the start date' }, { status: 400 });
    }
    if (start.getUTCFullYear() !== end.getUTCFullYear()) {
      return NextResponse.json({ error: 'Leave requests must fall within one calendar year' }, { status: 400 });
    }

    const requestedLeave = { startDate: start, endDate: end };
    const requestedDays = leaveDaysInYear(requestedLeave, start.getUTCFullYear());
    const overlappingLeave = user.driver!.leaves.some((leave) =>
      leave.status !== 'REJECTED' && start <= leave.endDate && end >= leave.startDate
    );
    if (overlappingLeave) {
      return NextResponse.json({ error: 'You already have a leave request for part of these dates' }, { status: 400 });
    }

    const settings = await getPlatformSettings();
    const allowance = user.driver!.usePlatformLeaveAllowance ? settings.defaultAnnualLeaveDays : (user.driver!.annualLeaveAllowance ?? settings.defaultAnnualLeaveDays);
    const balance = leaveBalance(user.driver!.leaves, allowance, start.getUTCFullYear());
    if (requestedDays > balance.remaining) {
      return NextResponse.json({
        error: `This request needs ${requestedDays} day(s), but only ${balance.remaining} day(s) remain in your ${balance.year} leave balance.`,
      }, { status: 400 });
    }

    const leave = await prisma.driverLeave.create({
      data: {
        driverId: user.driverId,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      leave,
      leaveBalance: leaveBalance([...user.driver!.leaves, leave], allowance, start.getUTCFullYear()),
    });
  } catch (error) {
    console.error('Failed to request leave:', error);
    return NextResponse.json({ error: 'Failed to request leave' }, { status: 500 });
  }
}
