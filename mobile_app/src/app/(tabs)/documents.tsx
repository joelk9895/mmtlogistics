import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Platform,
  Linking,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { Fonts, MinimalTheme } from '@/constants/theme';

interface DocumentRecord {
  id: string;
  docType?: string;
  documentType?: string;
  title: string;
  fileUrl?: string | null;
  referenceNo?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface IdentityOverview {
  iqamaNumber?: string | null;
  iqamaExpiryDate?: string | null;
  nationalIdNumber?: string | null;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseExpiryDate?: string | null;
  tgaCardNumber?: string | null;
  tgaCardExpiry?: string | null;
  medicalCertExpiry?: string | null;
  medicalCertificateUrl?: string | null;
  medicalFitness?: string | null;
}

interface VehicleInfo {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  istimaraExpiry?: string | null;
  vehicleDocuments?: DocumentRecord[];
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'driver' | 'vehicle'>('driver');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverDocs, setDriverDocs] = useState<DocumentRecord[]>([]);
  const [identity, setIdentity] = useState<IdentityOverview | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);

  // Upload modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docCategory, setDocCategory] = useState<'driver' | 'vehicle'>('driver');
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('IQAMA');
  const [referenceNo, setReferenceNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.getDocuments();
      setDriverDocs(res?.driverDocuments || []);
      setIdentity(res?.identityOverview || null);
      setVehicle(res?.vehicle || null);
    } catch (err: any) {
      console.warn('Failed to load documents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const getExpiryStatus = (dateStr?: string | null) => {
    if (!dateStr) return { text: 'No Expiry', color: '#8E8E93', bg: 'rgba(255, 255, 255, 0.08)' };
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Expired (${Math.abs(diffDays)}d)`, color: '#FF453A', bg: 'rgba(255, 69, 58, 0.16)' };
    } else if (diffDays <= 30) {
      return { text: `Expiring ${diffDays}d`, color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.16)' };
    } else {
      return { text: `Valid`, color: '#30D158', bg: 'rgba(48, 209, 88, 0.16)' };
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Media library access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFileUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFileUrl(result.assets[0].uri);
        if (!title) {
          setTitle(result.assets[0].name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a document title.');
      return;
    }

    setSubmitting(true);
    try {
      await api.uploadDocument({
        forVehicle: docCategory === 'vehicle',
        title: title.trim(),
        docType,
        referenceNo: referenceNo.trim() || undefined,
        expiryDate: expiryDate.trim() ? new Date(expiryDate.trim()).toISOString() : undefined,
        notes: notes.trim() || undefined,
        fileUrl: fileUrl || undefined,
      });

      Alert.alert('Success', 'Document successfully uploaded and saved.');
      setModalVisible(false);
      resetModalForm();
      fetchDocuments();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not save document.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModalForm = () => {
    setTitle('');
    setDocType(docCategory === 'vehicle' ? 'ISTIMARA' : 'IQAMA');
    setReferenceNo('');
    setExpiryDate('');
    setNotes('');
    setFileUrl(null);
  };

  const openDocumentViewer = (uri?: string | null) => {
    if (!uri) return;
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      Linking.openURL(uri);
    } else {
      setPreviewImage(uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* iOS Segmented Control */}
      <View
        style={[
          styles.segmentedContainer,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
      >
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'driver' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('driver')}
          >
            <AppleSymbol
              iosName="person.crop.circle.fill"
              fallbackName="person"
              size={14}
              color={activeTab === 'driver' ? '#FFFFFF' : '#8E8E93'}
            />
            <Text style={[styles.segmentText, activeTab === 'driver' && styles.segmentTextActive]}>
              Driver Records
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'vehicle' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('vehicle')}
          >
            <AppleSymbol
              iosName="truck.box.fill"
              fallbackName="car"
              size={14}
              color={activeTab === 'vehicle' ? '#FFFFFF' : '#8E8E93'}
            />
            <Text style={[styles.segmentText, activeTab === 'vehicle' && styles.segmentTextActive]}>
              Assigned Vehicle
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={styles.loadingText}>Fetching Compliance Records…</Text>
          </View>
        ) : activeTab === 'driver' ? (
          // ─── DRIVER VIEW ──────────────────────────────────────
          <View>
            <Text style={styles.iosSectionHeader}>MANDATORY REGULATORY CREDENTIALS</Text>
            <View style={styles.iosGroupedCard}>
              {/* Iqama */}
              <View style={styles.docRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                  <AppleSymbol iosName="creditcard.fill" fallbackName="card-outline" size={17} color="#0A84FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Iqama / Resident ID</Text>
                  <Text style={styles.docSub}>{identity?.iqamaNumber || 'Not registered on file'}</Text>
                </View>
                {(() => {
                  const exp = getExpiryStatus(identity?.iqamaExpiryDate);
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.cellDivider} />

              {/* Driving License */}
              <View style={styles.docRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                  <AppleSymbol iosName="speedometer" fallbackName="speedometer-outline" size={17} color="#30D158" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Saudi Driving License</Text>
                  <Text style={styles.docSub}>
                    {identity?.licenseType || 'Heavy Transport'} • {identity?.licenseNumber || 'N/A'}
                  </Text>
                </View>
                {(() => {
                  const exp = getExpiryStatus(identity?.licenseExpiryDate);
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.cellDivider} />

              {/* TGA Operating Card */}
              <View style={styles.docRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                  <AppleSymbol iosName="shield.lefthalf.filled" fallbackName="shield-checkmark-outline" size={17} color="#FF9F0A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>TGA Operating Card (Naql)</Text>
                  <Text style={styles.docSub}>{identity?.tgaCardNumber || 'Naql Card on file'}</Text>
                </View>
                {(() => {
                  const exp = getExpiryStatus(identity?.tgaCardExpiry);
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.cellDivider} />

              {/* Medical Assessment */}
              <View style={styles.docRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 55, 95, 0.15)' }]}>
                  <AppleSymbol iosName="cross.case.fill" fallbackName="medkit-outline" size={17} color="#FF375F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Medical Fitness Assessment</Text>
                  <Text style={styles.docSub}>Status: {identity?.medicalFitness || 'FIT FOR DUTY'}</Text>
                </View>
                {(() => {
                  const exp = getExpiryStatus(identity?.medicalCertExpiry);
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            {/* Driver Uploaded Files */}
            <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>UPLOADED PERMITS & PASSES</Text>
            <View style={styles.iosGroupedCard}>
              {driverDocs.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={styles.emptyText}>No supplementary files uploaded.</Text>
                </View>
              ) : (
                driverDocs.map((doc, idx) => {
                  const exp = getExpiryStatus(doc.expiryDate);
                  return (
                    <React.Fragment key={doc.id}>
                      {idx > 0 && <View style={styles.cellDivider} />}
                      <View style={styles.docRow}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(100, 210, 255, 0.15)' }]}>
                          <AppleSymbol iosName="doc.text.fill" fallbackName="document-text-outline" size={17} color="#64D2FF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docTitle}>{doc.title}</Text>
                          <Text style={styles.docSub}>
                            Type: {doc.docType || 'DOCUMENT'} {doc.referenceNo ? `• Ref: ${doc.referenceNo}` : ''}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                        </View>
                        {doc.fileUrl && (
                          <TouchableOpacity
                            onPress={() => openDocumentViewer(doc.fileUrl)}
                            style={{ padding: 4 }}
                          >
                            <AppleSymbol iosName="eye.fill" fallbackName="eye-outline" size={16} color="#0A84FF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </React.Fragment>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          // ─── VEHICLE VIEW ─────────────────────────────────────
          <View>
            {vehicle ? (
              <View>
                {/* Vehicle Specs Inset Group */}
                <Text style={styles.iosSectionHeader}>ASSIGNED FLEET TRUCK</Text>
                <View style={styles.iosGroupedCard}>
                  <View style={styles.docRow}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                      <AppleSymbol iosName="truck.box.fill" fallbackName="car" size={18} color="#0A84FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                      <Text style={styles.docSub}>
                        {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(48, 209, 88, 0.16)' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#30D158' }]}>ASSIGNED</Text>
                    </View>
                  </View>
                </View>

                {/* Istimara */}
                <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>VEHICLE REGISTRATION</Text>
                <View style={styles.iosGroupedCard}>
                  <View style={styles.docRow}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                      <AppleSymbol iosName="newspaper.fill" fallbackName="newspaper-outline" size={17} color="#30D158" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle}>Vehicle Registration (Istimara)</Text>
                      <Text style={styles.docSub}>Plate: {vehicle.licensePlate}</Text>
                    </View>
                    {(() => {
                      const exp = getExpiryStatus(vehicle.istimaraExpiry);
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>

                {/* Inspection & Insurance Files */}
                <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>
                  MVPI (FAHAS) & INSURANCE FILES
                </Text>
                <View style={styles.iosGroupedCard}>
                  {(!vehicle.vehicleDocuments || vehicle.vehicleDocuments.length === 0) ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={styles.emptyText}>No inspection or insurance files on record.</Text>
                    </View>
                  ) : (
                    vehicle.vehicleDocuments.map((doc, idx) => {
                      const exp = getExpiryStatus(doc.expiryDate);
                      return (
                        <React.Fragment key={doc.id}>
                          {idx > 0 && <View style={styles.cellDivider} />}
                          <View style={styles.docRow}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}>
                              <AppleSymbol iosName="shield.fill" fallbackName="shield-outline" size={17} color="#BF5AF2" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docTitle}>{doc.title}</Text>
                              <Text style={styles.docSub}>
                                {doc.documentType || 'VEHICLE_DOC'} {doc.referenceNo ? `• ${doc.referenceNo}` : ''}
                              </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: exp.bg }]}>
                              <Text style={[styles.statusBadgeText, { color: exp.color }]}>{exp.text}</Text>
                            </View>
                            {doc.fileUrl && (
                              <TouchableOpacity
                                onPress={() => openDocumentViewer(doc.fileUrl)}
                                style={{ padding: 4 }}
                              >
                                <AppleSymbol iosName="eye.fill" fallbackName="eye-outline" size={16} color="#BF5AF2" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </React.Fragment>
                      );
                    })
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.iosGroupedCard, { padding: 24, alignItems: 'center' }]}>
                <AppleSymbol iosName="exclamationmark.triangle.fill" fallbackName="alert-circle-outline" size={38} color="#FF9F0A" />
                <Text style={styles.emptyTitle}>No Vehicle Assigned</Text>
                <Text style={styles.emptySub}>
                  Fleet dispatch has not assigned a primary truck to your driver profile.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Upload Button */}
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            style={styles.iosPrimaryButton}
            onPress={() => {
              setDocCategory(activeTab);
              setDocType(activeTab === 'driver' ? 'IQAMA' : 'ISTIMARA');
              setModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <AppleSymbol iosName="arrow.up.doc.fill" fallbackName="cloud-upload" size={18} color="#FFFFFF" />
            <Text style={styles.iosPrimaryButtonText}>Upload / Renew Document</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── UPLOAD iOS SHEET MODAL ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => !submitting && setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', justifyContent: 'flex-end' }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.sheetContainer}>
                  <View style={styles.sheetGrabberBar} />
                  <Text style={styles.sheetTitle}>Upload Compliance Document</Text>
                  <Text style={styles.sheetSubtitle}>Submit Saudi regulatory credential or vehicle cert</Text>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* Category selection */}
                    <Text style={styles.inputHeading}>TARGET CATEGORY</Text>
                    <View style={styles.categoryToggle}>
                      <TouchableOpacity
                        style={[styles.toggleBtn, docCategory === 'driver' && styles.toggleBtnActive]}
                        onPress={() => {
                          setDocCategory('driver');
                          setDocType('IQAMA');
                        }}
                      >
                        <Text style={[styles.toggleBtnText, docCategory === 'driver' && styles.toggleBtnTextActive]}>
                          Driver Credential
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleBtn, docCategory === 'vehicle' && styles.toggleBtnActive]}
                        onPress={() => {
                          setDocCategory('vehicle');
                          setDocType('ISTIMARA');
                        }}
                      >
                        <Text style={[styles.toggleBtnText, docCategory === 'vehicle' && styles.toggleBtnTextActive]}>
                          Vehicle Document
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Document Title */}
                    <Text style={styles.inputHeading}>DOCUMENT TITLE *</Text>
                    <TextInput
                      style={styles.iosInput}
                      placeholder="e.g. Heavy Driver License 2026 Renewal"
                      placeholderTextColor="#636366"
                      value={title}
                      onChangeText={setTitle}
                    />

                    {/* Classification Chips */}
                    <Text style={styles.inputHeading}>DOCUMENT CLASSIFICATION</Text>
                    <View style={styles.typeWrap}>
                      {(docCategory === 'driver'
                        ? ['IQAMA', 'DRIVING_LICENSE', 'MEDICAL_CERTIFICATE', 'TGA_CARD', 'PASSPORT', 'OTHER']
                        : ['ISTIMARA', 'INSURANCE', 'MVPI_FAHAS', 'WEIGHT_SLIP', 'MUNICIPALITY_PERMIT', 'OTHER']
                      ).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.typeChip, docType === t && styles.typeChipActive]}
                          onPress={() => setDocType(t)}
                        >
                          <Text style={[styles.typeChipText, docType === t && styles.typeChipTextActive]}>
                            {t.replace(/_/g, ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Reference No */}
                    <Text style={styles.inputHeading}>REFERENCE / ID NUMBER</Text>
                    <TextInput
                      style={styles.iosInput}
                      placeholder="e.g. 2489102847"
                      placeholderTextColor="#636366"
                      value={referenceNo}
                      onChangeText={setReferenceNo}
                    />

                    {/* Expiry Date */}
                    <Text style={styles.inputHeading}>EXPIRY DATE (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.iosInput}
                      placeholder="2027-12-31"
                      placeholderTextColor="#636366"
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                    />

                    {/* File Attachment */}
                    <Text style={styles.inputHeading}>DOCUMENT SCAN / PHOTO</Text>
                    <View style={styles.attachmentRow}>
                      <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage(true)}>
                        <AppleSymbol iosName="camera.fill" fallbackName="camera" size={15} color="#0A84FF" />
                        <Text style={styles.attachBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage(false)}>
                        <AppleSymbol iosName="photo.fill" fallbackName="images" size={15} color="#30D158" />
                        <Text style={styles.attachBtnText}>Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
                        <AppleSymbol iosName="doc.fill" fallbackName="document" size={15} color="#FF9F0A" />
                        <Text style={styles.attachBtnText}>PDF / File</Text>
                      </TouchableOpacity>
                    </View>

                    {fileUrl && (
                      <View style={styles.attachedPreview}>
                        <AppleSymbol iosName="checkmark.circle.fill" fallbackName="checkmark-circle" size={16} color="#30D158" />
                        <Text style={styles.attachedText} numberOfLines={1}>
                          {fileUrl.split('/').pop()}
                        </Text>
                        <TouchableOpacity onPress={() => setFileUrl(null)}>
                          <AppleSymbol iosName="trash.fill" fallbackName="trash" size={16} color="#FF453A" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                      style={[
                        styles.iosPrimaryButton,
                        { marginTop: 20 },
                        submitting && { opacity: 0.6 },
                      ]}
                      onPress={handleUploadSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.iosPrimaryButtonText}>Save & Submit Document</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => !submitting && setModalVisible(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} animationType="fade" transparent={true}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setPreviewImage(null)}>
            <AppleSymbol iosName="xmark.circle.fill" fallbackName="close-circle" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.fullscreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MinimalTheme.background,
  },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 9,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: MinimalTheme.cardBorder,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
  },
  segmentTextActive: {
    color: MinimalTheme.text,
    fontFamily: Fonts.bold,
  },
  scrollBody: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  iosSectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  iosGroupedCard: {
    borderRadius: MinimalTheme.radiusCard,
    overflow: 'hidden',
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: MinimalTheme.text,
  },
  docSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  vehiclePlate: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  cellDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MinimalTheme.cardBorder,
    marginLeft: 60,
  },
  emptyText: {
    color: MinimalTheme.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  centerContainer: {
    paddingVertical: 70,
    alignItems: 'center',
  },
  loadingText: {
    color: MinimalTheme.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 12,
    fontSize: 13,
  },
  iosPrimaryButton: {
    height: 48,
    backgroundColor: MinimalTheme.accent,
    borderRadius: MinimalTheme.radiusButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iosPrimaryButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: MinimalTheme.sheetBg,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
  },
  sheetGrabberBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MinimalTheme.surfaceBorder,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  inputHeading: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  categoryToggle: {
    flexDirection: 'row',
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: MinimalTheme.accent,
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.semibold,
  },
  iosInput: {
    backgroundColor: MinimalTheme.surface,
    borderRadius: MinimalTheme.radiusInput,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: MinimalTheme.text,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  typeChipActive: {
    backgroundColor: MinimalTheme.accent,
    borderColor: MinimalTheme.accent,
  },
  typeChipText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.semibold,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingVertical: 10,
    borderRadius: MinimalTheme.radiusInput,
  },
  attachBtnText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.accent,
  },
  attachedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: MinimalTheme.successSubtle,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  attachedText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.success,
  },
  cancelBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textMuted,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '92%',
    height: '82%',
  },
});
