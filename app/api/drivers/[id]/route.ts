import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const annualLeaveAllowance = body.annualLeaveAllowance === '' || body.annualLeaveAllowance === undefined
      ? null
      : Number(body.annualLeaveAllowance);
    if (annualLeaveAllowance !== null && (!Number.isInteger(annualLeaveAllowance) || annualLeaveAllowance < 0)) {
      return NextResponse.json({ error: 'Annual leave allowance must be a whole number of zero or more days.' }, { status: 400 });
    }
    const monthlyAllowance = body.monthlyAllowance === '' || body.monthlyAllowance === undefined ? null : Number(body.monthlyAllowance);
    if (monthlyAllowance !== null && (!Number.isFinite(monthlyAllowance) || monthlyAllowance < 0)) {
      return NextResponse.json({ error: 'Monthly allowance must be a non-negative number.' }, { status: 400 });
    }
    const usePlatformLeaveAllowance = body.usePlatformLeaveAllowance !== false;
    if (body.contractStartDate && body.contractEndDate && new Date(body.contractEndDate) < new Date(body.contractStartDate)) {
      return NextResponse.json({ error: 'Contract end date must be on or after the contract start date.' }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        // Personal
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender || null,
        bloodGroup: body.bloodGroup || null,
        nationality: body.nationality || null,
        profilePhotoUrl: body.profilePhotoUrl || null,

        // Saudi ID & Residency
        residencyType: body.residencyType || 'IQAMA_HOLDER',
        iqamaNumber: body.iqamaNumber || null,
        iqamaExpiryDate: body.iqamaExpiryDate ? new Date(body.iqamaExpiryDate) : null,
        nationalIdNumber: body.nationalIdNumber || null,
        sponsorName: body.sponsorName || null,
        borderNumber: body.borderNumber || null,

        // Passport
        passportNumber: body.passportNumber || null,
        passportIssuingCountry: body.passportIssuingCountry || null,
        passportIssueDate: body.passportIssueDate ? new Date(body.passportIssueDate) : null,
        passportExpiryDate: body.passportExpiryDate ? new Date(body.passportExpiryDate) : null,
        visaType: body.visaType || null,
        visaExpiryDate: body.visaExpiryDate ? new Date(body.visaExpiryDate) : null,

        // Contact
        phone: body.phone,
        alternatePhone: body.alternatePhone || null,
        email: body.email || null,
        currentAddress: body.currentAddress,
        permanentAddress: body.permanentAddress || null,
        city: body.city || null,
        region: body.region || null,
        postalCode: body.postalCode || null,

        // Emergency
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        emergencyContactRelation: body.emergencyContactRelation,

        // Employment
        dateOfJoining: new Date(body.dateOfJoining),
        employmentType: body.employmentType || 'FULL_TIME',
        status: body.status || 'ACTIVE',
        department: body.department || null,
        salary: body.salary ? parseFloat(body.salary) : null,
        bankName: body.bankName || null,
        ibanNumber: body.ibanNumber || null,
        gosiNumber: body.gosiNumber || null,
        contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : null,
        contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : null,
        contractNumber: body.contractNumber || null,
        noticePeriodDays: body.noticePeriodDays ? parseInt(body.noticePeriodDays, 10) : null,
        terminationDate: body.terminationDate ? new Date(body.terminationDate) : null,
        terminationReason: body.terminationReason || null,
        annualLeaveAllowance,
        usePlatformLeaveAllowance,
        monthlyAllowance,
        notes: body.notes || null,

        // License
        licenseNumber: body.licenseNumber,
        licenseType: body.licenseType || 'HEAVY_EQUIPMENT',
        licenseIssuingAuthority: body.licenseIssuingAuthority || null,
        licenseIssueDate: new Date(body.licenseIssueDate),
        licenseExpiryDate: new Date(body.licenseExpiryDate),
        hazmatCertified: body.hazmatCertified || false,
        defensiveDrivingCert: body.defensiveDrivingCert || false,

        // Transport Authority
        waselRegistrationNumber: body.waselRegistrationNumber || null,
        tgaCardNumber: body.tgaCardNumber || null,
        tgaCardExpiry: body.tgaCardExpiry ? new Date(body.tgaCardExpiry) : null,

        // Medical
        medicalCertificateUrl: body.medicalCertificateUrl || null,
        medicalCertExpiry: body.medicalCertExpiry ? new Date(body.medicalCertExpiry) : null,
        medicalFitness: body.medicalFitness || 'PENDING',
        knownMedicalConditions: body.knownMedicalConditions || null,
        drugTestDate: body.drugTestDate ? new Date(body.drugTestDate) : null,
        drugTestResult: body.drugTestResult || 'PENDING',

        // Compliance
        backgroundCheckStatus: body.backgroundCheckStatus || 'PENDING',
        backgroundCheckDate: body.backgroundCheckDate ? new Date(body.backgroundCheckDate) : null,
        saudiPoliceCheck: body.saudiPoliceCheck || 'PENDING',
        saudiPoliceCheckDate: body.saudiPoliceCheckDate ? new Date(body.saudiPoliceCheckDate) : null,
        homeCountryClearance: body.homeCountryClearance || 'PENDING',
        homeCountryClearanceDate: body.homeCountryClearanceDate ? new Date(body.homeCountryClearanceDate) : null,
        saherViolations: body.saherViolations ? parseInt(body.saherViolations, 10) : 0,
      },
    });

    return NextResponse.json(driver);
  } catch (error: any) {
    console.error('Failed to update driver:', error);
    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json({ error: `Duplicate value for ${field}.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}
