import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/vehicles/categories/[id] — delete a category (only non-default)
export async function DELETE(request: Request, { params }: RouteParams) {
  const authError = await authenticate(request);
  if (authError) return authError;
  try {
    const { id } = await params;

    const category = await prisma.vehicleCategory.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    if (category.isDefault) return NextResponse.json({ error: 'Cannot delete a default category' }, { status: 403 });

    // Check if any vehicles use this type
    const usageCount = await prisma.vehicle.count({ where: { vehicleType: category.slug } });
    if (usageCount > 0) {
      return NextResponse.json({ error: `Cannot delete — ${usageCount} vehicle(s) are using this type` }, { status: 409 });
    }

    await prisma.vehicleCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category delete error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
