import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        primaryVehicle: {
          include: {
            vehicleDocuments: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Standard driver identity docs
    const identityDocs = {
      iqamaNumber: driver.iqamaNumber,
      iqamaExpiryDate: driver.iqamaExpiryDate,
      nationalIdNumber: driver.nationalIdNumber,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiryDate: driver.licenseExpiryDate,
      tgaCardNumber: driver.tgaCardNumber,
      tgaCardExpiry: driver.tgaCardExpiry,
      medicalCertExpiry: driver.medicalCertExpiry,
      medicalCertificateUrl: driver.medicalCertificateUrl,
      medicalFitness: driver.medicalFitness,
    };

    return NextResponse.json({
      driverDocuments: driver.documents,
      identityOverview: identityDocs,
      vehicle: driver.primaryVehicle ? {
        id: driver.primaryVehicle.id,
        licensePlate: driver.primaryVehicle.licensePlate,
        make: driver.primaryVehicle.make,
        model: driver.primaryVehicle.model,
        year: driver.primaryVehicle.year,
        vehicleDocuments: driver.primaryVehicle.vehicleDocuments,
        istimaraExpiry: driver.primaryVehicle.istimaraExpiry,
      } : null,
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const body = await request.json();
    const { docType, title, fileUrl, referenceNo, issueDate, expiryDate, notes, forVehicle } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (forVehicle) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { primaryVehicle: { select: { id: true } } },
      });

      if (!driver?.primaryVehicle) {
        return NextResponse.json({ error: 'No primary vehicle assigned to driver' }, { status: 400 });
      }

      const vehicleDoc = await prisma.vehicleDocument.create({
        data: {
          vehicleId: driver.primaryVehicle.id,
          documentType: docType || 'OTHER',
          title,
          fileUrl: fileUrl || null,
          referenceNo: referenceNo || null,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes: notes || null,
        },
      });

      return NextResponse.json({ success: true, document: vehicleDoc });
    }

    const driverDoc = await prisma.driverDocument.create({
      data: {
        driverId,
        docType: docType || 'OTHER',
        title,
        fileUrl: fileUrl || null,
        referenceNo: referenceNo || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, document: driverDoc });
  } catch (error) {
    console.error('Failed to save document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
