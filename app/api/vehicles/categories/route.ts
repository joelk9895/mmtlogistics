import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/vehicles/categories — list all vehicle categories
export async function GET(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const categories = await prisma.vehicleCategory.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/vehicles/categories — create a new vehicle category
export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Auto-generate slug from name if not provided
    const slug = body.slug || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

    // Check for duplicate slug
    const existing = await prisma.vehicleCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Category "${slug}" already exists` }, { status: 409 });
    }

    const category = await prisma.vehicleCategory.create({
      data: {
        slug,
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        isDefault: false, // Admin-created are never default
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Category create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
