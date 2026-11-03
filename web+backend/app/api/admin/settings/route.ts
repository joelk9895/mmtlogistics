import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/platform-settings';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getPlatformSettings());
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const defaultAnnualLeaveDays = Number(body.defaultAnnualLeaveDays);
    const defaultMonthlyAllowance = Number(body.defaultMonthlyAllowance);
    const defaultNoticePeriodDays = Number(body.defaultNoticePeriodDays);
    if (!Number.isInteger(defaultAnnualLeaveDays) || defaultAnnualLeaveDays < 0 ||
        !Number.isFinite(defaultMonthlyAllowance) || defaultMonthlyAllowance < 0 ||
        !Number.isInteger(defaultNoticePeriodDays) || defaultNoticePeriodDays < 0) {
      return NextResponse.json({ error: 'Leave days, allowance, and notice period must be valid non-negative numbers.' }, { status: 400 });
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: String(body.companyName || 'MMT Logistics').trim(),
        supportEmail: String(body.supportEmail || '').trim() || null,
        supportPhone: String(body.supportPhone || '').trim() || null,
        currency: String(body.currency || 'SAR').trim().toUpperCase(),
        timezone: String(body.timezone || 'Asia/Riyadh').trim(),
        defaultAnnualLeaveDays,
        defaultMonthlyAllowance,
        defaultNoticePeriodDays,
      },
      create: {
        id: 'default',
        companyName: String(body.companyName || 'MMT Logistics').trim(),
        supportEmail: String(body.supportEmail || '').trim() || null,
        supportPhone: String(body.supportPhone || '').trim() || null,
        currency: String(body.currency || 'SAR').trim().toUpperCase(),
        timezone: String(body.timezone || 'Asia/Riyadh').trim(),
        defaultAnnualLeaveDays,
        defaultMonthlyAllowance,
        defaultNoticePeriodDays,
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update platform settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
