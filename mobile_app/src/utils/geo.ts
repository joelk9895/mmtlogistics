import * as Location from 'expo-location';

export const PICKUP_GEOFENCE_RADIUS_KM = 1.0; // 1km radius buffer

/**
 * Calculates great-circle distance between two coordinate pairs using Haversine formula.
 * @returns distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into a human readable string (meters or kilometers)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

export interface GeofenceVerificationResult {
  verified: boolean;
  driverCoords: { latitude: number; longitude: number } | null;
  targetCoords: { latitude: number; longitude: number } | null;
  distanceKm: number | null;
  distanceMeters: number | null;
  error?: string;
  isCoordinateMissing?: boolean;
}

/**
 * Verifies if driver's current GPS location is within the 1km radius buffer of the target pickup location.
 */
export async function verifyLocationWithinBuffer(
  target: {
    latitude?: number | null;
    longitude?: number | null;
    address: string;
    city?: string | null;
  },
  radiusKm = PICKUP_GEOFENCE_RADIUS_KM
): Promise<GeofenceVerificationResult> {
  try {
    // 1. Get current driver position with high accuracy
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      const requested = await Location.requestForegroundPermissionsAsync();
      if (!requested.granted) {
        return {
          verified: false,
          driverCoords: null,
          targetCoords: null,
          distanceKm: null,
          distanceMeters: null,
          error: 'Location permission is required to verify you are at the pickup location.',
        };
      }
    }

    const currentPos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const driverCoords = {
      latitude: currentPos.coords.latitude,
      longitude: currentPos.coords.longitude,
    };

    // 2. Resolve target coordinates
    let targetLat = target.latitude;
    let targetLon = target.longitude;

    if (!targetLat || !targetLon) {
      // Try geocoding target address
      const searchAddress = [target.address, target.city, 'Saudi Arabia'].filter(Boolean).join(', ');
      try {
        const geocoded = await Location.geocodeAsync(searchAddress);
        if (geocoded && geocoded.length > 0) {
          targetLat = geocoded[0].latitude;
          targetLon = geocoded[0].longitude;
        }
      } catch {
        // Geocode error ignored
      }
    }

    if (!targetLat || !targetLon) {
      return {
        verified: true, // Allow with warning if coordinates are impossible to resolve
        driverCoords,
        targetCoords: null,
        distanceKm: null,
        distanceMeters: null,
        isCoordinateMissing: true,
      };
    }

    const targetCoords = { latitude: targetLat, longitude: targetLon };
    const distanceKm = calculateDistanceKm(
      driverCoords.latitude,
      driverCoords.longitude,
      targetCoords.latitude,
      targetCoords.longitude
    );
    const distanceMeters = Math.round(distanceKm * 1000);

    const verified = distanceKm <= radiusKm;

    return {
      verified,
      driverCoords,
      targetCoords,
      distanceKm,
      distanceMeters,
    };
  } catch (err: any) {
    return {
      verified: false,
      driverCoords: null,
      targetCoords: null,
      distanceKm: null,
      distanceMeters: null,
      error: err.message || 'Failed to determine GPS location.',
    };
  }
}
