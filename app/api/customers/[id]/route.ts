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
        parent: { select: { id: true, companyName: true, accountNumber: true } },
        children: {
          select: { id: true, companyName: true, accountNumber: true, division: true, status: true, contactPerson: true, email: true, phone: true },
          orderBy: { companyName: 'asc' },
        },
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
      'companyName', 'companyNameAr', 'tradeName', 'division', 'brand',
      'customerSubType',
      'contactPerson', 'contactTitle', 'email', 'phone', 'alternatePhone', 'whatsapp',
      'additionalContacts',
      'crNumber', 'vatNumber', 'vatTreatment', 'zakatCertNumber', 'nationalAddress',
      'billingAttention', 'billingAddress', 'billingStreet2', 'billingDistrict', 'billingCity', 'billingRegion', 'billingPostalCode', 'billingAdditionalNumber', 'billingCountry',
      'shippingAddress', 'shippingCity', 'shippingRegion', 'shippingPostalCode', 'shippingCountry',
      'paymentTermsLabel',
      'bankName', 'ibanNumber', 'currency',
      'specialRateCard', 'contractDocUrl',
      'preferredVehicleTypes', 'defaultPickupCity', 'defaultDeliveryCity',
      'accountManagerName', 'salesRepName', 'referralSource', 'tags',
      'notes', 'logoUrl', 'website',
    ];

    const dateFields = ['crExpiryDate', 'zakatCertExpiry', 'contractStartDate', 'contractEndDate'];
    const floatFields = ['creditLimitSar', 'openingBalance', 'currentBalanceSar', 'discountPercent'];
    const boolFields = ['requiresColdChain', 'requiresHazmat', 'requiresInsuredCargo'];

    const data: any = {};

    // Support camelCase as well as aliases
    const aliases: Record<string, string[]> = {
      companyName: ['Company Name'],
      companyNameAr: ['Company Name (Secondary Language)', 'company_name_ar'],
      division: ['DIVISION', 'Division'],
      brand: ['Brand'],
      customerSubType: ['Customer Sub Type', 'Customer Subtype', 'customer_sub_type'],
      crNumber: ['CR NUMBER -', 'CR NUMBER', 'CR Number', 'cr_number'],
      vatNumber: ['Tax Registration Number', 'taxRegistrationNumber', 'tax_registration_number', 'TRN', 'vat_number'],
      vatTreatment: ['VAT Treatment', 'vat_treatment'],
      billingAttention: ['Billing Attention', 'billing_attention'],
      billingAddress: ['Billing Address', 'billing_address'],
      billingStreet2: ['Billing Street2', 'Billing Street 2', 'billing_street2'],
      billingDistrict: ['Billing District', 'billing_district'],
      billingCity: ['Billing City', 'billing_city'],
      billingRegion: ['Billing State', 'Billing Region', 'billing_state', 'billing_region'],
      billingPostalCode: ['Billing Code', 'Billing Postal Code', 'billing_code', 'billing_postal_code'],
      billingAdditionalNumber: ['Billing Additional Number', 'billing_additional_number'],
      billingCountry: ['Billing County', 'Billing Country', 'billing_country', 'billing_county'],
      paymentTermsLabel: ['Payment Terms Label', 'payment_terms_label'],
      creditLimitSar: ['Credit Limit', 'credit_limit', 'creditLimit'],
      openingBalance: ['Opening Balance', 'opening_balance'],
    };

    for (const f of stringFields) {
      if (body[f] !== undefined) {
        data[f] = body[f]?.trim?.() || null;
      } else if (aliases[f]) {
        for (const alias of aliases[f]) {
          if (body[alias] !== undefined) {
            data[f] = body[alias]?.trim?.() || null;
            break;
          }
        }
      }
    }

    const enumFields = ['customerType', 'status', 'industryType', 'paymentTerms'];
    for (const f of enumFields) {
      if (body[f] !== undefined) data[f] = body[f] || null;
    }

    // Normalizing payment terms if passed as string (e.g. "Net 30")
    if (body['Payment Terms'] !== undefined && !body.paymentTerms) {
      const ptNorm = String(body['Payment Terms']).toUpperCase().replace(/[\s-]+/g, '_');
      if (['CASH', 'COD', 'NET_15', 'NET_30', 'NET_45', 'NET_60', 'NET_90', 'PREPAID', 'CREDIT'].includes(ptNorm)) {
        data.paymentTerms = ptNorm;
      } else if (ptNorm.includes('30')) data.paymentTerms = 'NET_30';
      else if (ptNorm.includes('15')) data.paymentTerms = 'NET_15';
      else if (ptNorm.includes('45')) data.paymentTerms = 'NET_45';
      else if (ptNorm.includes('60')) data.paymentTerms = 'NET_60';
      else if (ptNorm.includes('90')) data.paymentTerms = 'NET_90';
      else if (ptNorm.includes('COD') || ptNorm.includes('DELIVERY')) data.paymentTerms = 'COD';
      else if (ptNorm.includes('PREPAID') || ptNorm.includes('ADVANCE')) data.paymentTerms = 'PREPAID';
      else if (ptNorm.includes('CASH')) data.paymentTerms = 'CASH';
    }

    for (const f of dateFields) {
      if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f]) : null;
    }
    for (const f of floatFields) {
      if (body[f] !== undefined) {
        data[f] = body[f] !== '' && body[f] !== null ? parseFloat(String(body[f]).replace(/,/g, '')) : null;
      } else if (aliases[f]) {
        for (const alias of aliases[f]) {
          if (body[alias] !== undefined) {
            data[f] = body[alias] !== '' && body[alias] !== null ? parseFloat(String(body[alias]).replace(/,/g, '')) : null;
            break;
          }
        }
      }
    }
    for (const f of boolFields) {
      if (body[f] !== undefined) data[f] = body[f] === true || body[f] === 'true';
    }

    // Handle parentId changes
    if (body.parentId !== undefined) {
      if (body.parentId === null || body.parentId === '' || body.parentId === 'none') {
        data.parentId = null;  // Detach from parent
      } else {
        if (body.parentId === id) {
          return NextResponse.json({ error: 'Customer cannot be its own parent' }, { status: 400 });
        }
        // Prevent circular: can't set parent to one of own children
        const childIds = await prisma.customer.findMany({ where: { parentId: id }, select: { id: true } });
        if (childIds.some((c: any) => c.id === body.parentId)) {
          return NextResponse.json({ error: 'Cannot set a child customer as the parent (circular reference)' }, { status: 400 });
        }
        const parentExists = await prisma.customer.findUnique({ where: { id: body.parentId } });
        if (!parentExists) {
          return NextResponse.json({ error: 'Parent customer not found' }, { status: 404 });
        }
        data.parentId = body.parentId;
      }
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
