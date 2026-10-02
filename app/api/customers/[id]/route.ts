import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            driver: { select: { firstName: true, lastName: true, employeeId: true } },
            vehicle: { select: { fleetNumber: true, make: true, model: true, licensePlate: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

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

    const dateFields = ['crExpiryDate', 'zakatCertExpiry', 'contractStartDate', 'contractEndDate'];
    const floatFields = ['creditLimitSar', 'currentBalanceSar', 'discountPercent'];
    const boolFields = ['requiresColdChain', 'requiresHazmat', 'requiresInsuredCargo'];

    const data: any = {};

    for (const f of stringFields) {
      if (body[f] !== undefined) {
        data[f] = body[f]?.trim?.() || null;
      }
    }

    const enumFields = ['customerType', 'status', 'industryType', 'paymentTerms'];
    for (const f of enumFields) {
      if (body[f] !== undefined) data[f] = body[f] || null;
    }

    for (const f of dateFields) {
      if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f]) : null;
    }
    for (const f of floatFields) {
      if (body[f] !== undefined) {
        data[f] = body[f] !== '' && body[f] !== null ? parseFloat(body[f]) : null;
      }
    }
    for (const f of boolFields) {
      if (body[f] !== undefined) data[f] = body[f] === true || body[f] === 'true';
    }

    const customer = await prisma.customer.update({ where: { id }, data });
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Failed to update customer:', error);
    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json({ error: `Duplicate value for ${field}.` }, { status: 409 });
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Check for linked orders
    const orderCount = await prisma.order.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${orderCount} order(s) linked to this customer. Archive the customer instead.` },
        { status: 409 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
