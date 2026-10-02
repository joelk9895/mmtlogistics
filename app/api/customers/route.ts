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
        { companyNameAr: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { division: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { crNumber: { contains: search } },
        { vatNumber: { contains: search } },
        { billingCity: { contains: search, mode: 'insensitive' } },
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

function parsePayload(body: any) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
        return body[k];
      }
    }
    return undefined;
  };

  const str = (...keys: string[]) => {
    const val = get(...keys);
    return val !== undefined ? String(val).trim() : null;
  };

  const num = (...keys: string[]) => {
    const val = get(...keys);
    if (val === undefined || val === null || val === '') return null;
    const parsed = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  };

  const date = (...keys: string[]) => {
    const val = get(...keys);
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const bool = (...keys: string[]) => {
    const val = get(...keys);
    return val === true || val === 'true' || val === 1 || val === '1';
  };

  // Payment Terms parsing
  let paymentTerms: any = undefined;
  const rawPt = get('paymentTerms', 'Payment Terms', 'payment_terms');
  if (rawPt) {
    const ptNorm = String(rawPt).toUpperCase().replace(/[\s-]+/g, '_');
    if (['CASH', 'COD', 'NET_15', 'NET_30', 'NET_45', 'NET_60', 'NET_90', 'PREPAID', 'CREDIT'].includes(ptNorm)) {
      paymentTerms = ptNorm;
    } else if (ptNorm.includes('30')) paymentTerms = 'NET_30';
    else if (ptNorm.includes('15')) paymentTerms = 'NET_15';
    else if (ptNorm.includes('45')) paymentTerms = 'NET_45';
    else if (ptNorm.includes('60')) paymentTerms = 'NET_60';
    else if (ptNorm.includes('90')) paymentTerms = 'NET_90';
    else if (ptNorm.includes('COD') || ptNorm.includes('DELIVERY')) paymentTerms = 'COD';
    else if (ptNorm.includes('PREPAID') || ptNorm.includes('ADVANCE')) paymentTerms = 'PREPAID';
    else if (ptNorm.includes('CASH')) paymentTerms = 'CASH';
    else paymentTerms = 'NET_30';
  }

  // Customer Type parsing
  let customerType: any = undefined;
  const rawCt = get('customerType', 'Customer Type', 'customer_type');
  if (rawCt) {
    const ctNorm = String(rawCt).toUpperCase().replace(/[\s-]+/g, '_');
    if (['CORPORATE', 'SME', 'INDIVIDUAL', 'GOVERNMENT', 'SEMI_GOVERNMENT'].includes(ctNorm)) {
      customerType = ctNorm;
    } else if (ctNorm.includes('SEMI')) customerType = 'SEMI_GOVERNMENT';
    else if (ctNorm.includes('GOV')) customerType = 'GOVERNMENT';
    else if (ctNorm.includes('SME') || ctNorm.includes('SMALL')) customerType = 'SME';
    else if (ctNorm.includes('INDIVIDUAL')) customerType = 'INDIVIDUAL';
    else customerType = 'CORPORATE';
  }

  return {
    // 1. Company Identity & ERP Hierarchy
    companyName: str('companyName', 'Company Name'),
    companyNameAr: str('companyNameAr', 'Company Name (Secondary Language)', 'company_name_ar'),
    tradeName: str('tradeName', 'trade_name'),
    division: str('division', 'DIVISION', 'Division'),
    brand: str('brand', 'Brand'),
    customerType: customerType || 'CORPORATE',
    customerSubType: str('customerSubType', 'Customer Sub Type', 'Customer Subtype', 'customer_sub_type'),
    status: get('status', 'Status') || 'ACTIVE',
    industryType: get('industryType', 'Industry Type', 'industry_type') || null,

    // 2. Saudi Commercial Registration & Tax
    crNumber: str('crNumber', 'CR NUMBER -', 'CR NUMBER', 'CR Number', 'cr_number'),
    crExpiryDate: date('crExpiryDate', 'cr_expiry_date'),
    vatNumber: str('vatNumber', 'Tax Registration Number', 'taxRegistrationNumber', 'tax_registration_number', 'TRN', 'vat_number'),
    vatTreatment: str('vatTreatment', 'VAT Treatment', 'vat_treatment'),
    zakatCertNumber: str('zakatCertNumber', 'zakat_cert_number'),
    zakatCertExpiry: date('zakatCertExpiry', 'zakat_cert_expiry'),
    nationalAddress: str('nationalAddress', 'national_address'),

    // 3. Primary Contact
    contactPerson: str('contactPerson', 'contact_person', 'Contact Person') || str('billingAttention', 'Billing Attention') || str('companyName', 'Company Name') || 'Primary Contact',
    contactTitle: str('contactTitle', 'contact_title', 'Contact Title'),
    email: str('email', 'Email', 'Email Address'),
    phone: str('phone', 'Phone', 'Phone Number', 'Telephone'),
    alternatePhone: str('alternatePhone', 'alternate_phone'),
    whatsapp: str('whatsapp', 'WhatsApp', 'whatsapp_number'),
    additionalContacts: str('additionalContacts', 'additional_contacts'),

    // 4. Billing Address (ZATCA & ERP Compatible)
    billingAttention: str('billingAttention', 'Billing Attention', 'billing_attention'),
    billingAddress: str('billingAddress', 'Billing Address', 'billing_address'),
    billingStreet2: str('billingStreet2', 'Billing Street2', 'Billing Street 2', 'billing_street2'),
    billingDistrict: str('billingDistrict', 'Billing District', 'billing_district'),
    billingCity: str('billingCity', 'Billing City', 'billing_city'),
    billingRegion: str('billingRegion', 'Billing State', 'Billing Region', 'billing_state', 'billing_region'),
    billingPostalCode: str('billingPostalCode', 'Billing Code', 'Billing Postal Code', 'billing_code', 'billing_postal_code'),
    billingAdditionalNumber: str('billingAdditionalNumber', 'Billing Additional Number', 'billing_additional_number'),
    billingCountry: str('billingCountry', 'Billing County', 'Billing Country', 'billing_country', 'billing_county') || 'SA',

    // 5. Shipping Address
    shippingAddress: str('shippingAddress', 'shipping_address'),
    shippingCity: str('shippingCity', 'shipping_city'),
    shippingRegion: str('shippingRegion', 'shipping_region'),
    shippingPostalCode: str('shippingPostalCode', 'shipping_postal_code'),
    shippingCountry: str('shippingCountry', 'shipping_country') || 'SA',

    // 6. Financial & Payment
    paymentTerms: paymentTerms || 'NET_30',
    paymentTermsLabel: str('paymentTermsLabel', 'Payment Terms Label', 'payment_terms_label') || str('paymentTerms', 'Payment Terms'),
    creditLimitSar: num('creditLimitSar', 'Credit Limit', 'credit_limit', 'creditLimit'),
    openingBalance: num('openingBalance', 'Opening Balance', 'opening_balance') ?? 0,
    currentBalanceSar: num('currentBalanceSar', 'currentBalance', 'current_balance') ?? 0,
    bankName: str('bankName', 'bank_name'),
    ibanNumber: str('ibanNumber', 'iban_number'),
    currency: str('currency') || 'SAR',

    // 7. Pricing & Rates
    discountPercent: num('discountPercent', 'discount_percent') ?? 0,
    specialRateCard: str('specialRateCard', 'special_rate_card'),
    contractStartDate: date('contractStartDate', 'contract_start_date'),
    contractEndDate: date('contractEndDate', 'contract_end_date'),
    contractDocUrl: str('contractDocUrl', 'contract_doc_url'),

    // 8. Service Preferences
    preferredVehicleTypes: str('preferredVehicleTypes', 'preferred_vehicle_types'),
    requiresColdChain: bool('requiresColdChain', 'requires_cold_chain'),
    requiresHazmat: bool('requiresHazmat', 'requires_hazmat'),
    requiresInsuredCargo: bool('requiresInsuredCargo', 'requires_insured_cargo'),
    defaultPickupCity: str('defaultPickupCity', 'default_pickup_city'),
    defaultDeliveryCity: str('defaultDeliveryCity', 'default_delivery_city'),

    // 9. Account Management & Notes
    accountManagerName: str('accountManagerName', 'account_manager_name'),
    salesRepName: str('salesRepName', 'sales_rep_name'),
    referralSource: str('referralSource', 'referral_source'),
    tags: str('tags'),
    notes: str('notes'),
    logoUrl: str('logoUrl', 'logo_url'),
    website: str('website'),
  };
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const accountNumber = await generateAccountNumber();
    const parsed = parsePayload(body);

    if (!parsed.companyName) {
      return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
    }
    if (!parsed.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!parsed.phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const data: any = {
      ...parsed,
      accountNumber,
    };

    const customer = await prisma.customer.create({ data });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json({ error: `Duplicate value for ${field}.` }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to create customer' }, { status: 500 });
  }
}
