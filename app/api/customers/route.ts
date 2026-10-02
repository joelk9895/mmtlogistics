import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

async function generateAccountNumber(): Promise<string> {
  const last = await prisma.customer.findFirst({
    orderBy: { accountNumber: 'desc' },
    select: { accountNumber: true },
  });
  if (!last) return 'CUS-001';
  const lastNum = parseInt(last.accountNumber.replace('CUS-', ''), 10);
  return `CUS-${(lastNum + 1).toString().padStart(3, '0')}`;
}

export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const industry = searchParams.get('industry') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { crNumber: { contains: search } },
        { vatNumber: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (type) where.customerType = type;
    if (industry) where.industryType = industry;

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const accountNumber = await generateAccountNumber();

    const stringFields = [
      'companyName', 'companyNameAr', 'tradeName',
      'contactPerson', 'contactTitle', 'email', 'phone', 'alternatePhone', 'whatsapp',
      'additionalContacts',
      'crNumber', 'vatNumber', 'zakatCertNumber', 'nationalAddress',
      'billingAddress', 'billingCity', 'billingRegion', 'billingPostalCode', 'billingCountry',
      'shippingAddress', 'shippingCity', 'shippingRegion', 'shippingPostalCode', 'shippingCountry',
      'bankName', 'ibanNumber', 'currency',
      'specialRateCard', 'contractDocUrl',
      'preferredVehicleTypes', 'defaultPickupCity', 'defaultDeliveryCity',
      'accountManagerName', 'salesRepName', 'referralSource', 'tags',
      'notes', 'logoUrl', 'website',
    ];

    const dateFields = [
      'crExpiryDate', 'zakatCertExpiry',
      'contractStartDate', 'contractEndDate',
    ];

    const floatFields = ['creditLimitSar', 'currentBalanceSar', 'discountPercent'];
    const boolFields = ['requiresColdChain', 'requiresHazmat', 'requiresInsuredCargo'];

    const data: any = { accountNumber };

    for (const f of stringFields) {
      data[f] = body[f]?.trim?.() || (f === 'companyName' || f === 'contactPerson' || f === 'email' || f === 'phone' ? body[f] : null);
    }

    // Enums
    if (body.customerType) data.customerType = body.customerType;
    if (body.status) data.status = body.status;
    if (body.industryType) data.industryType = body.industryType || null;
    if (body.paymentTerms) data.paymentTerms = body.paymentTerms;

    for (const f of dateFields) {
      data[f] = body[f] ? new Date(body[f]) : null;
    }
    for (const f of floatFields) {
      data[f] = body[f] !== '' && body[f] !== undefined && body[f] !== null ? parseFloat(body[f]) : null;
    }
    for (const f of boolFields) {
      data[f] = body[f] === true || body[f] === 'true';
    }

    const customer = await prisma.customer.create({ data });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json({ error: `Duplicate value for ${field}.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
