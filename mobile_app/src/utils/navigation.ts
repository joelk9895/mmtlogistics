import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

export interface LocationTarget {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  label?: string | null;
}

/**
 * Open Google Maps turn-by-turn navigation for a destination.
 */
export async function openGoogleMaps(target: LocationTarget) {
  let url = '';
  if (target.latitude && target.longitude) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}&travelmode=driving`;
  } else if (target.address) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target.address)}&travelmode=driving`;
  } else {
    Alert.alert('Location Missing', 'No coordinates or address available for navigation.');
    return;
  }

  const supported = await Linking.canOpenURL(url).catch(() => true);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Cannot Open Maps', 'Unable to open Google Maps on this device.');
  }
}

/**
 * Open Waze navigation for a destination.
 */
export async function openWaze(target: LocationTarget) {
  let url = '';
  if (target.latitude && target.longitude) {
    url = `https://waze.com/ul?ll=${target.latitude},${target.longitude}&navigate=yes`;
  } else if (target.address) {
    url = `https://waze.com/ul?q=${encodeURIComponent(target.address)}&navigate=yes`;
  } else {
    Alert.alert('Location Missing', 'No coordinates or address available for navigation.');
    return;
  }

  const supported = await Linking.canOpenURL(url).catch(() => false);
  if (supported) {
    await Linking.openURL(url);
  } else {
    // Fall back to Google Maps
    openGoogleMaps(target);
  }
}

/**
 * Open native Apple Maps on iOS or Google Maps on Android.
 */
export async function openNativeMaps(target: LocationTarget) {
  if (Platform.OS === 'ios') {
    let url = '';
    if (target.latitude && target.longitude) {
      url = `maps://?daddr=${target.latitude},${target.longitude}&dirflg=d`;
    } else if (target.address) {
      url = `maps://?daddr=${encodeURIComponent(target.address)}&dirflg=d`;
    }
    if (url) {
      const supported = await Linking.canOpenURL(url).catch(() => false);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    }
  }

  // Default to Google Maps
  openGoogleMaps(target);
}

/**
 * 1-Tap phone call helper
 */
export async function callPhoneNumber(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  const url = `tel:${cleaned}`;
  const supported = await Linking.canOpenURL(url).catch(() => false);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Cannot Call', `Unable to dial ${phone} on this device.`);
  }
}
