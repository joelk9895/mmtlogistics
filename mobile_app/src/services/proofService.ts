import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { api } from './api';

export interface ProofAttachment {
  id: string;
  orderId: string;
  taskType: 'PICKUP' | 'INTERMEDIATE' | 'DROPOFF';
  stopSequence?: number;
  locationAddress?: string;
  receiverName?: string;
  notes?: string;
  photoUri?: string;
  photoUrl?: string; // Populated when uploaded to storage
  timestamp: string;
  storageProvider: 'local_temporary' | 'server_upload' | 'azure_blob' | 's3_bucket' | 'vercel_blob';
  status: 'captured' | 'uploaded' | 'pending_sync';
}

/**
 * Capture proof photo using camera
 */
export async function captureProofPhoto(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Needed',
        'Camera permission is required to photograph Proof of Pickup / Proof of Delivery.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error: any) {
    console.warn('Failed to capture proof photo:', error.message);
    Alert.alert('Camera Error', 'Could not open camera.');
    return null;
  }
}

/**
 * Select proof photo from gallery / media library
 */
export async function pickProofPhotoFromLibrary(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Library Permission Needed',
        'Photo library permission is required to choose a proof picture.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error: any) {
    console.warn('Failed to pick proof photo:', error.message);
    Alert.alert('Gallery Error', 'Could not select photo.');
    return null;
  }
}

/**
 * Upload proof photo to storage with future blob storage integration.
 * Currently attempts server upload and gracefully falls back to local reference
 * while blob storage (Azure / S3 / Vercel Blob) is being provisioned.
 */
export async function processAndUploadProof(
  photoUri: string | null,
  metadata: {
    orderId: string;
    taskType: 'PICKUP' | 'INTERMEDIATE' | 'DROPOFF';
    stopSequence?: number;
    locationAddress?: string;
    receiverName?: string;
    notes?: string;
  }
): Promise<ProofAttachment> {
  const timestamp = new Date().toISOString();
  const id = `proof_${metadata.taskType.toLowerCase()}_${Date.now()}`;

  let photoUrl: string | undefined = undefined;
  let storageProvider: ProofAttachment['storageProvider'] = 'local_temporary';
  let status: ProofAttachment['status'] = 'captured';

  if (photoUri) {
    try {
      // ─────────────────────────────────────────────────────────────────
      // BLOB STORAGE INTEGRATION HOOK
      // ─────────────────────────────────────────────────────────────────
      // When Azure Blob Storage, AWS S3, or Vercel Blob is configured:
      // 1. Uncomment cloud SDK call or upload to dedicated blob endpoint:
      //    const blobResult = await uploadToCloudBlob(photoUri, { id, orderId: metadata.orderId });
      //    photoUrl = blobResult.url;
      //    storageProvider = 'azure_blob'; // or 's3_bucket' | 'vercel_blob'
      // 2. Currently, we try uploading to the server's public upload directory:
      // ─────────────────────────────────────────────────────────────────
      const filename = `proof-${metadata.orderId}-${metadata.taskType.toLowerCase()}-${Date.now()}.jpg`;
      const uploadRes = await api.uploadFile(photoUri, filename, 'image/jpeg');
      if (uploadRes?.url) {
        photoUrl = uploadRes.url;
        storageProvider = 'server_upload';
        status = 'uploaded';
      }
    } catch (uploadError: any) {
      console.warn('Server upload not available, saving local proof reference:', uploadError.message);
      // Graceful fallback for offline / blob storage pending
      storageProvider = 'local_temporary';
      status = 'pending_sync';
    }
  }

  return {
    id,
    orderId: metadata.orderId,
    taskType: metadata.taskType,
    stopSequence: metadata.stopSequence,
    locationAddress: metadata.locationAddress,
    receiverName: metadata.receiverName,
    notes: metadata.notes,
    photoUri: photoUri || undefined,
    photoUrl,
    timestamp,
    storageProvider,
    status,
  };
}
