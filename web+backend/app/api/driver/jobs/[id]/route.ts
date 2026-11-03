import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify driver is assigned to this order or is admin
    if (session.role !== 'ADMIN' && order.assignedDriverId !== session.driverId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Geofence check: When completing pickup, verify driver is within 1km of pickup location
    const isCompletingPickup = body.actualPickup || (body.status === 'IN_TRANSIT' && !order.actualPickup);
    if (isCompletingPickup && body.driverLatitude !== undefined && body.driverLongitude !== undefined) {
      // Find pickup stop coordinates
      const pickupStop = await prisma.orderLocation.findFirst({
        where: {
          orderId: id,
          OR: [{ type: 'PICKUP' }, { sequence: 0 }],
          latitude: { not: null },
          longitude: { not: null },
        },
      });

      if (pickupStop && pickupStop.latitude && pickupStop.longitude) {
        const R = 6371; // Earth radius in km
        const dLat = ((pickupStop.latitude - body.driverLatitude) * Math.PI) / 180;
        const dLon = ((pickupStop.longitude - body.driverLongitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((body.driverLatitude * Math.PI) / 180) *
            Math.cos((pickupStop.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        if (distanceKm > 1.0) {
          return NextResponse.json(
            {
              error: `Pickup Location Verification Failed: You are ${distanceKm.toFixed(2)} km away from the pickup location. You must be within a 1km radius buffer to complete pickup.`,
              distanceKm,
              requiredRadiusKm: 1.0,
            },
            { status: 400 }
          );
        }
      }
    }

    const dataToUpdate: any = {};
    if (body.status) dataToUpdate.status = body.status;
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;
    if (body.podStatus !== undefined) dataToUpdate.podStatus = body.podStatus;
    if (body.deliveryStatus !== undefined) dataToUpdate.deliveryStatus = body.deliveryStatus;
    if (body.receiver !== undefined) dataToUpdate.receiver = body.receiver;
    if (body.actualPickup !== undefined) {
      dataToUpdate.actualPickup = body.actualPickup ? new Date(body.actualPickup) : null;
    } else if (body.status === 'IN_TRANSIT' && !order.actualPickup) {
      dataToUpdate.actualPickup = new Date();
    }

    if (body.actualDelivery !== undefined) {
      dataToUpdate.actualDelivery = body.actualDelivery ? new Date(body.actualDelivery) : null;
    } else if (body.status === 'DELIVERED' && !order.actualDelivery) {
      dataToUpdate.actualDelivery = new Date();
      if (!body.podStatus) dataToUpdate.podStatus = 'DELIVERED';
      if (!body.deliveryStatus) dataToUpdate.deliveryStatus = 'DELIVERED';
    }

    if (body.unloadingFinishedAt !== undefined) {
      dataToUpdate.unloadingFinishedAt = body.unloadingFinishedAt ? new Date(body.unloadingFinishedAt) : null;
    }

    // Support saving proof and attachments (e.g. proof of pickup, proof of delivery)
    if (body.attachmentReferences !== undefined) {
      let existingAttachments: any[] = [];
      if (order.attachmentReferences) {
        try {
          const parsed = JSON.parse(order.attachmentReferences);
          if (Array.isArray(parsed)) existingAttachments = parsed;
          else existingAttachments = [parsed];
        } catch {
          existingAttachments = [order.attachmentReferences];
        }
      }

      try {
        const parsedNew = typeof body.attachmentReferences === 'string'
          ? JSON.parse(body.attachmentReferences)
          : body.attachmentReferences;
        if (Array.isArray(parsedNew)) {
          existingAttachments.push(...parsedNew);
        } else {
          existingAttachments.push(parsedNew);
        }
        dataToUpdate.attachmentReferences = JSON.stringify(existingAttachments);
      } catch {
        existingAttachments.push(body.attachmentReferences);
        dataToUpdate.attachmentReferences = JSON.stringify(existingAttachments);
      }
    }

    // If driver marked a specific stop/location as completed
    if (body.completedLocationId) {
      await prisma.orderLocation.updateMany({
        where: { id: body.completedLocationId, orderId: id },
        data: {
          actualDate: new Date(),
          notes: body.locationNotes || undefined,
        },
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        customer: true,
        locations: { orderBy: { sequence: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Failed to update driver job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
