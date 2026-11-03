import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const docs = await prisma.vehicleDocument.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    const doc = await prisma.vehicleDocument.create({
      data: {
        vehicleId: id,
        documentType: body.documentType || 'OTHER',
        title: body.title,
        fileUrl: body.fileUrl || null,
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        issuedBy: body.issuedBy || null,
        referenceNo: body.referenceNo || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Document create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
