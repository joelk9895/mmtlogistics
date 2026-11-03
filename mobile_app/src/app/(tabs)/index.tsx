import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Image,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, MinimalTheme } from '@/constants/theme';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracker } from '@/context/LocationContext';
import { openGoogleMaps, openWaze, callPhoneNumber } from '@/utils/navigation';
import {
  captureProofPhoto,
  pickProofPhotoFromLibrary,
  processAndUploadProof,
  ProofAttachment,
} from '@/services/proofService';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { verifyLocationWithinBuffer, formatDistance } from '@/utils/geo';

export interface DriverTask {
  id: string;
  orderId: string;
  trackingNumber: string;
  customerName: string;
  taskType: 'PICKUP' | 'INTERMEDIATE' | 'DROPOFF';
  taskTitle: string;
  taskSubtitle: string;
  locationId?: string;
  sequence: number;
  totalStops: number;
  address: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  scheduledDate?: string | null;
  instructions?: string | null;
  cargoDescription?: string | null;
  weightKg?: number | null;
  pallets?: number | null;
  driverTa?: number | null;
  orderStatus: string;
  order: any;
  isPickup: boolean;
  isDropoff: boolean;
}

export default function DriverConsoleScreen() {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const { isTracking } = useLocationTracker();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [jobListFilter, setJobListFilter] = useState<'ACTIVE' | 'DELIVERED' | 'ALL'>('ACTIVE');

  // Proof & Task Completion Modal
  const [activeTaskToComplete, setActiveTaskToComplete] = useState<DriverTask | null>(null);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofPhotoUri, setProofPhotoUri] = useState<string | null>(null);
  const [receiverOrContactName, setReceiverOrContactName] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // 1km Pickup Location Geofence Verification State
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [verifiedLocationInfo, setVerifiedLocationInfo] = useState<{
    distanceMeters: number | null;
    distanceKm: number | null;
    driverCoords: { latitude: number; longitude: number } | null;
    targetCoords: { latitude: number; longitude: number } | null;
    isCoordinateMissing?: boolean;
  } | null>(null);

  // Navigation selector modal
  const [navTarget, setNavTarget] = useState<{
    latitude?: number | null;
    longitude?: number | null;
    address: string;
    title: string;
  } | null>(null);
  const [navModalVisible, setNavModalVisible] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.getJobs();
      if (res?.orders) {
        setJobs(res.orders);
      }
    } catch (err: any) {
      console.warn('Failed to load driver jobs:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  /**
   * Normalize an order into an ordered list of stops.
   */
  const getOrderStops = useCallback((order: any) => {
    if (Array.isArray(order.locations) && order.locations.length > 0) {
      return [...order.locations].sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
    }

    const stops: any[] = [];
    if (order.pickupLocation) {
      stops.push({
        id: `${order.id}-pickup`,
        locationType: 'PICKUP',
        sequence: 1,
        address: order.pickupLocation,
        city: order.pickupCity,
        contactName: order.senderName,
        contactPhone: order.senderPhone,
        scheduledDate: order.pickupDate,
        actualDate: order.actualPickup,
        instructions: order.pickupInstructions,
        latitude: order.pickupLatitude,
        longitude: order.pickupLongitude,
      });
    }

    if (order.dropoffLocation) {
      stops.push({
        id: `${order.id}-dropoff`,
        locationType: 'DROPOFF',
        sequence: stops.length + 1,
        address: order.dropoffLocation,
        city: order.dropoffCity,
        contactName: order.receiverName,
        contactPhone: order.receiverPhone,
        scheduledDate: order.deliveryDate,
        actualDate: order.actualDelivery,
        instructions: order.deliveryInstructions,
        latitude: order.dropoffLatitude,
        longitude: order.dropoffLongitude,
      });
    }

    return stops;
  }, []);

  /**
   * Identifies the single next incomplete task.
   */
  const { currentTask, upcomingTasks } = useMemo<{
    currentTask: DriverTask | null;
    upcomingTasks: DriverTask[];
  }>(() => {
    const activeOrders = jobs.filter(
      (j) => j.status === 'PENDING' || j.status === 'IN_TRANSIT' || j.status === 'ASSIGNED'
    );

    const allIncompleteTasks: DriverTask[] = [];

    for (const order of activeOrders) {
      const stops = getOrderStops(order);
      const totalStops = stops.length || 2;

      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const isDone = !!stop.actualDate;

        if (!isDone) {
          const type = (stop.locationType || (i === 0 ? 'PICKUP' : 'DROPOFF')).toUpperCase();
          const isPickup = type === 'PICKUP' || i === 0;
          const isDropoff = type === 'DROPOFF' || i === stops.length - 1;

          let taskTitle = 'Next Stop';
          if (isPickup) taskTitle = 'Pick Up Cargo';
          else if (isDropoff) taskTitle = 'Final Delivery (POD)';
          else taskTitle = `Intermediate Stop ${i + 1}`;

          allIncompleteTasks.push({
            id: stop.id || `${order.id}-stop-${i}`,
            orderId: order.id,
            trackingNumber: order.trackingNumber || order.id.slice(0, 8),
            customerName: order.customer?.companyName || order.customer?.name || 'Assigned Shipper',
            taskType: isPickup ? 'PICKUP' : isDropoff ? 'DROPOFF' : 'INTERMEDIATE',
            taskTitle,
            taskSubtitle: isPickup
              ? 'Load cargo & inspect bill of lading'
              : isDropoff
              ? 'Unload & capture recipient signature/proof'
              : 'Waypoint arrival & document verification',
            locationId: stop.id,
            sequence: stop.sequence ?? i + 1,
            totalStops,
            address: stop.address || 'Location on dispatch sheet',
            city: stop.city || order.pickupCity || order.dropoffCity,
            latitude: stop.latitude,
            longitude: stop.longitude,
            contactName: stop.contactName,
            contactPhone: stop.contactPhone,
            scheduledDate: stop.scheduledDate,
            instructions: stop.instructions,
            cargoDescription: order.cargoDescription,
            weightKg: order.weightKg,
            pallets: order.pallets,
            driverTa: order.driverTa,
            orderStatus: order.status,
            order,
            isPickup,
            isDropoff,
          });
        }
      }
    }

    if (allIncompleteTasks.length === 0) {
      return { currentTask: null, upcomingTasks: [] };
    }

    const next = allIncompleteTasks[0];
    const remaining = allIncompleteTasks.slice(1);

    return { currentTask: next, upcomingTasks: remaining };
  }, [jobs, getOrderStops]);

  // Handle open navigation options modal
  const handleStartNavigation = (task: DriverTask) => {
    setNavTarget({
      latitude: task.latitude,
      longitude: task.longitude,
      address: `${task.address}${task.city ? `, ${task.city}` : ''}`,
      title: `${task.taskTitle} · ${task.trackingNumber}`,
    });
    setNavModalVisible(true);
  };

  const handleLaunchGoogleMaps = () => {
    if (!navTarget) return;
    setNavModalVisible(false);
    openGoogleMaps({
      latitude: navTarget.latitude,
      longitude: navTarget.longitude,
      address: navTarget.address,
    });
  };

  const handleLaunchWaze = () => {
    if (!navTarget) return;
    setNavModalVisible(false);
    openWaze({
      latitude: navTarget.latitude,
      longitude: navTarget.longitude,
      address: navTarget.address,
    });
  };

  // Open Proof & Completion modal (with 1km geofence verification for pickup)
  const handleOpenCompletionModal = async (task: DriverTask) => {
    if (task.isPickup) {
      setIsVerifyingLocation(true);
      try {
        const result = await verifyLocationWithinBuffer(task, 1.0);

        if (result.error) {
          Alert.alert('GPS Location Required', result.error, [
            { text: 'Retry', onPress: () => handleOpenCompletionModal(task) },
            { text: 'Cancel', style: 'cancel' },
          ]);
          return;
        }

        if (!result.verified) {
          const distStr = result.distanceKm !== null ? formatDistance(result.distanceKm) : 'Unknown distance';
          Alert.alert(
            'Pickup Location Verification Failed',
            `You are currently ${distStr} away from the verified pickup site (${task.address}).\n\nTo ensure dispatch compliance, you must be within a 1.0 km radius buffer of the pickup location to complete pickup.`,
            [
              {
                text: 'Navigate to Pickup',
                onPress: () => handleStartNavigation(task),
              },
              {
                text: 'Retry GPS Check',
                onPress: () => handleOpenCompletionModal(task),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }

        setVerifiedLocationInfo({
          distanceMeters: result.distanceMeters,
          distanceKm: result.distanceKm,
          driverCoords: result.driverCoords,
          targetCoords: result.targetCoords,
          isCoordinateMissing: result.isCoordinateMissing,
        });
      } finally {
        setIsVerifyingLocation(false);
      }
    } else {
      setVerifiedLocationInfo(null);
    }

    setActiveTaskToComplete(task);
    setProofPhotoUri(null);
    setReceiverOrContactName('');
    setProofNotes('');
    setProofModalVisible(true);
  };

  // Photo handlers
  const handleTakePhoto = async () => {
    const uri = await captureProofPhoto();
    if (uri) setProofPhotoUri(uri);
  };

  const handlePickPhoto = async () => {
    const uri = await pickProofPhotoFromLibrary();
    if (uri) setProofPhotoUri(uri);
  };

  // Submit proof and advance task
  const handleConfirmTaskCompletion = async () => {
    if (!activeTaskToComplete) return;

    setSubmittingProof(true);
    try {
      const task = activeTaskToComplete;
      const nowIso = new Date().toISOString();

      const proofArtifact: ProofAttachment = await processAndUploadProof(proofPhotoUri, {
        orderId: task.orderId,
        taskType: task.taskType,
        stopSequence: task.sequence,
        locationAddress: task.address,
        receiverName: receiverOrContactName.trim() || undefined,
        notes: proofNotes.trim() || undefined,
      });

      const payload: any = {
        completedLocationId: task.locationId,
        locationNotes: proofNotes.trim() || undefined,
        attachmentReferences: JSON.stringify(proofArtifact),
      };

      if (task.isPickup) {
        payload.status = 'IN_TRANSIT';
        payload.actualPickup = nowIso;
        if (verifiedLocationInfo?.driverCoords) {
          payload.driverLatitude = verifiedLocationInfo.driverCoords.latitude;
          payload.driverLongitude = verifiedLocationInfo.driverCoords.longitude;
        }
        if (verifiedLocationInfo?.distanceMeters !== null && verifiedLocationInfo?.distanceMeters !== undefined) {
          payload.pickupDistanceMeters = verifiedLocationInfo.distanceMeters;
        }
        if (proofNotes.trim()) {
          payload.notes = `[Pickup Proof]: ${proofNotes.trim()}`;
        }
      } else if (task.isDropoff) {
        payload.status = 'DELIVERED';
        payload.actualDelivery = nowIso;
        payload.podStatus = 'DELIVERED';
        payload.deliveryStatus = 'DELIVERED';
        if (receiverOrContactName.trim()) {
          payload.receiver = receiverOrContactName.trim();
        }
        if (proofNotes.trim()) {
          payload.notes = `[Delivery POD]: ${proofNotes.trim()}`;
        }
      }

      await api.updateJobStatus(task.orderId, payload);

      setProofModalVisible(false);
      setActiveTaskToComplete(null);
      await fetchJobs();

      Alert.alert(
        'Task Completed!',
        `${task.taskTitle} for ${task.trackingNumber} recorded successfully.`
      );
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      Alert.alert('Update Failed', err.message || 'Could not complete task. Please try again.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (jobListFilter === 'ACTIVE') return j.status === 'PENDING' || j.status === 'IN_TRANSIT';
    if (jobListFilter === 'DELIVERED') return j.status === 'DELIVERED';
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
      >
        {/* ── DRIVER STATUS INSET GROUP ── */}
        <View style={styles.iosGroupedCard}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <AppleSymbol
                iosName="person.fill"
                fallbackName="person"
                size={18}
                color="#0A84FF"
              />
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameLine}>
                <Text style={styles.driverName}>
                  {driver?.firstName || 'Assigned'} {driver?.lastName || 'Driver'}
                </Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>ON DUTY</Text>
                </View>
              </View>
              <View style={styles.driverSubLine}>
                <Text style={styles.driverSubtitle}>
                  {driver?.primaryVehicle?.licensePlate
                    ? `Assigned Truck: ${driver.primaryVehicle.licensePlate}`
                    : 'Active Fleet Duty'}
                </Text>
                <View style={styles.gpsStatusPill}>
                  <AppleSymbol
                    iosName={isTracking ? 'location.fill' : 'location.slash'}
                    fallbackName={isTracking ? 'location' : 'location-outline'}
                    size={10}
                    color={isTracking ? '#30D158' : '#8E8E93'}
                  />
                  <Text style={[styles.gpsStatusText, { color: isTracking ? '#30D158' : '#8E8E93' }]}>
                    {isTracking ? 'GPS Active' : 'GPS Idle'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              style={styles.refreshBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#0A84FF" />
              ) : (
                <AppleSymbol
                  iosName="arrow.clockwise"
                  fallbackName="sync"
                  size={16}
                  color="#8E8E93"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={styles.loadingText}>Fetching route & stops…</Text>
          </View>
        ) : currentTask ? (
          /* ── THE SINGLE IMMEDIATE NEXT TASK (iOS INSET GROUP) ── */
          <View style={styles.sectionWrap}>
            <Text style={styles.iosSectionHeader}>CURRENT TASK</Text>

            <View style={styles.iosGroupedCard}>
              {/* Task Header Banner */}
              <View style={styles.taskBannerRow}>
                <View
                  style={[
                    styles.taskTypeBadge,
                    {
                      backgroundColor: currentTask.isPickup
                        ? 'rgba(48, 209, 88, 0.18)'
                        : 'rgba(10, 132, 255, 0.18)',
                    },
                  ]}
                >
                  <AppleSymbol
                    iosName={
                      currentTask.isPickup
                        ? 'arrow.down.circle.fill'
                        : 'checkmark.seal.fill'
                    }
                    fallbackName={
                      currentTask.isPickup ? 'arrow-down-circle' : 'checkmark-circle'
                    }
                    size={14}
                    color={currentTask.isPickup ? '#30D158' : '#0A84FF'}
                  />
                  <Text
                    style={[
                      styles.taskTypeText,
                      { color: currentTask.isPickup ? '#30D158' : '#0A84FF' },
                    ]}
                  >
                    {currentTask.taskTitle.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.sequenceText}>
                  Stop {currentTask.sequence} of {currentTask.totalStops}
                </Text>
              </View>

              {/* Main Address Block */}
              <View style={styles.addressBlock}>
                <Text style={styles.customerName}>{currentTask.customerName}</Text>
                <Text style={styles.addressText}>{currentTask.address}</Text>
                {currentTask.city && (
                  <Text style={styles.cityText}>{currentTask.city}, Saudi Arabia</Text>
                )}
                <Text style={styles.trackingNo}>Order #{currentTask.trackingNumber}</Text>
              </View>

              {/* Scheduled Time Cell */}
              <View style={styles.cellDivider} />
              <View style={styles.cellRow}>
                <AppleSymbol
                  iosName="clock.fill"
                  fallbackName="time-outline"
                  size={15}
                  color="#FF9F0A"
                />
                <Text style={styles.cellLabel}>
                  {currentTask.scheduledDate
                    ? `Scheduled: ${new Date(currentTask.scheduledDate).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Priority Dispatch · Immediate'}
                </Text>
              </View>

              {/* Instructions if available */}
              {currentTask.instructions && (
                <>
                  <View style={styles.cellDivider} />
                  <View style={styles.cellRow}>
                    <AppleSymbol
                      iosName="info.circle.fill"
                      fallbackName="information-circle"
                      size={15}
                      color="#64D2FF"
                    />
                    <Text style={styles.cellLabel}>{currentTask.instructions}</Text>
                  </View>
                </>
              )}

              {/* Contact Cell */}
              {currentTask.contactName && (
                <>
                  <View style={styles.cellDivider} />
                  <View style={styles.contactCellRow}>
                    <View style={styles.contactLeft}>
                      <AppleSymbol
                        iosName="person.crop.circle.fill"
                        fallbackName="person-circle-outline"
                        size={22}
                        color="#8E8E93"
                      />
                      <View>
                        <Text style={styles.contactName}>{currentTask.contactName}</Text>
                        <Text style={styles.contactSub}>Site Contact</Text>
                      </View>
                    </View>
                    {currentTask.contactPhone && (
                      <TouchableOpacity
                        style={styles.callPill}
                        onPress={() => callPhoneNumber(currentTask.contactPhone!)}
                      >
                        <AppleSymbol iosName="phone.fill" fallbackName="call" size={13} color="#FFFFFF" />
                        <Text style={styles.callPillText}>Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {/* Cargo Specs Badges */}
              {(currentTask.cargoDescription || currentTask.weightKg || currentTask.pallets || currentTask.driverTa) && (
                <>
                  <View style={styles.cellDivider} />
                  <View style={styles.specsRow}>
                    {currentTask.cargoDescription && (
                      <View style={styles.specChip}>
                        <Text style={styles.specChipText}>{currentTask.cargoDescription}</Text>
                      </View>
                    )}
                    {currentTask.weightKg && (
                      <View style={styles.specChip}>
                        <Text style={styles.specChipText}>{currentTask.weightKg} KG</Text>
                      </View>
                    )}
                    {currentTask.pallets && (
                      <View style={styles.specChip}>
                        <Text style={styles.specChipText}>{currentTask.pallets} Pallets</Text>
                      </View>
                    )}
                    {currentTask.driverTa && (
                      <View style={[styles.specChip, { backgroundColor: 'rgba(255, 159, 10, 0.16)' }]}>
                        <Text style={[styles.specChipText, { color: '#FF9F0A' }]}>
                          +{currentTask.driverTa} SAR TA
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* ── 2 BIG iOS ACTION BUTTONS ── */}
              <View style={styles.buttonStack}>
                {/* 1. Navigate Button */}
                <TouchableOpacity
                  style={styles.iosPrimaryButton}
                  onPress={() => handleStartNavigation(currentTask)}
                  activeOpacity={0.8}
                >
                  <AppleSymbol
                    iosName="arrow.triangle.turn.up.right.diamond.fill"
                    fallbackName="navigate"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.iosPrimaryButtonText}>Navigate to Stop</Text>
                </TouchableOpacity>

                {/* 2. Complete Task Button */}
                <TouchableOpacity
                  style={[
                    styles.iosSecondaryButton,
                    {
                      backgroundColor: currentTask.isPickup
                        ? '#30D158'
                        : '#0A84FF',
                    },
                    isVerifyingLocation && { opacity: 0.7 },
                  ]}
                  onPress={() => handleOpenCompletionModal(currentTask)}
                  disabled={isVerifyingLocation}
                  activeOpacity={0.8}
                >
                  {isVerifyingLocation ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.iosSecondaryButtonText}>
                        Verifying 1km Geofence...
                      </Text>
                    </>
                  ) : (
                    <>
                      <AppleSymbol
                        iosName="checkmark.circle.fill"
                        fallbackName="checkmark-done-circle"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.iosSecondaryButtonText}>
                        {currentTask.isPickup
                          ? 'Complete Pickup'
                          : currentTask.isDropoff
                          ? 'Complete Delivery (POD)'
                          : 'Complete Stop'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ── UPCOMING STOPS QUEUE ── */}
            {upcomingTasks.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.iosSectionHeader}>
                  NEXT IN QUEUE ({upcomingTasks.length})
                </Text>
                <View style={styles.iosGroupedCard}>
                  {upcomingTasks.map((t, idx) => (
                    <React.Fragment key={t.id || idx}>
                      {idx > 0 && <View style={styles.cellDivider} />}
                      <View style={styles.queueRow}>
                        <View style={styles.queueIndexBadge}>
                          <Text style={styles.queueIndexText}>{idx + 2}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.queueTitleRow}>
                            <Text style={styles.queueTaskTitle}>{t.taskTitle}</Text>
                            <Text style={styles.queueOrderNo}>#{t.trackingNumber}</Text>
                          </View>
                          <Text style={styles.queueAddress} numberOfLines={1}>
                            {t.address}
                          </Text>
                        </View>
                        <AppleSymbol
                          iosName="chevron.right"
                          fallbackName="chevron-forward"
                          size={14}
                          color="#3C3C43"
                        />
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          /* ── CELEBRATION / ALL TASKS COMPLETED ── */
          <View style={[styles.iosGroupedCard, styles.emptyCard]}>
            <AppleSymbol
              iosName="checkmark.seal.fill"
              fallbackName="shield-checkmark"
              size={48}
              color="#30D158"
            />
            <Text style={styles.emptyTitle}>All Tasks Completed!</Text>
            <Text style={styles.emptySub}>
              You have completed all active stops for your assigned orders.
            </Text>
            <TouchableOpacity style={styles.iosPrimaryButton} onPress={fetchJobs}>
              <Text style={styles.iosPrimaryButtonText}>Check for New Dispatches</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── ALL ASSIGNED ORDERS INSET ACCORDION ── */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.iosSectionHeader}>ALL ASSIGNED MANIFESTS</Text>
          <View style={styles.iosGroupedCard}>
            <TouchableOpacity
              style={styles.manifestHeaderRow}
              onPress={() => setShowAllJobs(!showAllJobs)}
              activeOpacity={0.7}
            >
              <View style={styles.manifestHeaderLeft}>
                <AppleSymbol
                  iosName="tray.full.fill"
                  fallbackName="file-tray-full-outline"
                  size={18}
                  color="#8E8E93"
                />
                <Text style={styles.manifestHeaderText}>
                  {showAllJobs ? 'Hide Manifest Orders' : `View All Orders (${jobs.length})`}
                </Text>
              </View>
              <AppleSymbol
                iosName={showAllJobs ? 'chevron.up' : 'chevron.down'}
                fallbackName={showAllJobs ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#8E8E93"
              />
            </TouchableOpacity>

            {showAllJobs && (
              <View style={styles.manifestBody}>
                {/* iOS Segmented Control */}
                <View style={styles.segmentedControl}>
                  {(['ACTIVE', 'ALL', 'DELIVERED'] as const).map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.segmentButton,
                        jobListFilter === filter && styles.segmentButtonActive,
                      ]}
                      onPress={() => setJobListFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          jobListFilter === filter && styles.segmentButtonTextActive,
                        ]}
                      >
                        {filter === 'ACTIVE'
                          ? 'Active'
                          : filter === 'DELIVERED'
                          ? 'Completed'
                          : 'All'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {filteredJobs.length === 0 ? (
                  <Text style={styles.emptyListText}>No orders found in this view.</Text>
                ) : (
                  filteredJobs.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <View style={styles.cellDivider} />}
                      <View style={styles.manifestItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.manifestItemTracking}>{item.trackingNumber}</Text>
                          <Text style={styles.manifestItemCustomer}>
                            {item.customer?.companyName || 'General Freight'}
                          </Text>
                        </View>
                        <View style={styles.manifestStatusBadge}>
                          <Text style={styles.manifestStatusText}>
                            {item.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── NAVIGATION TARGET MODAL ── */}
      <Modal visible={navModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setNavModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetContainer}>
                <View style={styles.sheetGrabberBar} />
                <Text style={styles.sheetTitle}>Start Navigation</Text>
                <Text style={styles.sheetSubtitle}>{navTarget?.address}</Text>

                <TouchableOpacity
                  style={[styles.iosPrimaryButton, { marginBottom: 10 }]}
                  onPress={handleLaunchGoogleMaps}
                >
                  <AppleSymbol iosName="map.fill" fallbackName="navigate" size={18} color="#FFFFFF" />
                  <Text style={styles.iosPrimaryButtonText}>Open in Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iosSecondaryButton, { backgroundColor: '#33CCFF' }]}
                  onPress={handleLaunchWaze}
                >
                  <AppleSymbol iosName="location.fill" fallbackName="navigate" size={18} color="#FFFFFF" />
                  <Text style={styles.iosSecondaryButtonText}>Open in Waze</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setNavModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── PROOF OF TASK COMPLETION MODAL ── */}
      <Modal visible={proofModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setProofModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', justifyContent: 'flex-end' }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.sheetContainer}>
                  <View style={styles.sheetGrabberBar} />
                  <Text style={styles.sheetTitle}>
                    {activeTaskToComplete?.isPickup
                      ? 'Confirm Pickup'
                      : activeTaskToComplete?.isDropoff
                      ? 'Delivery POD & Signature'
                      : 'Complete Stop'}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    Order #{activeTaskToComplete?.trackingNumber}
                  </Text>

                  {/* 1km Geofence Verification Status Banner */}
                  {activeTaskToComplete?.isPickup && (
                    <View style={styles.geofenceVerifiedCard}>
                      <AppleSymbol
                        iosName="checkmark.shield.fill"
                        fallbackName="shield-checkmark"
                        size={20}
                        color="#30D158"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.geofenceVerifiedTitle}>
                          Pickup Location Verified
                        </Text>
                        <Text style={styles.geofenceVerifiedSub}>
                          {verifiedLocationInfo?.distanceMeters !== null && verifiedLocationInfo?.distanceMeters !== undefined
                            ? `${verifiedLocationInfo.distanceMeters}m from site · Within 1km buffer`
                            : 'Driver GPS coordinates recorded for audit log'}
                        </Text>
                      </View>
                      <View style={styles.geofencePill}>
                        <Text style={styles.geofencePillText}>1KM OK</Text>
                      </View>
                    </View>
                  )}

                  {/* Photo capture section */}
                  <Text style={styles.inputHeading}>PROOF PHOTO / BILL OF LADING</Text>
                  <View style={styles.photoActionsRow}>
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <AppleSymbol iosName="camera.fill" fallbackName="camera" size={16} color="#0A84FF" />
                      <Text style={styles.photoActionText}>Take Camera Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={handlePickPhoto}
                      activeOpacity={0.8}
                    >
                      <AppleSymbol iosName="photo.fill" fallbackName="images" size={16} color="#0A84FF" />
                      <Text style={styles.photoActionText}>Photo Library</Text>
                    </TouchableOpacity>
                  </View>

                  {proofPhotoUri && (
                    <View style={styles.previewImageRow}>
                      <Image source={{ uri: proofPhotoUri }} style={styles.previewThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.previewSuccessText}>Photo attached</Text>
                        <Text style={styles.previewSub}>Ready for upload & dispatch sync</Text>
                      </View>
                      <TouchableOpacity onPress={() => setProofPhotoUri(null)}>
                        <AppleSymbol iosName="trash.fill" fallbackName="trash" size={16} color="#FF453A" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Recipient name if delivery */}
                  <Text style={styles.inputHeading}>
                    {activeTaskToComplete?.isDropoff ? 'RECEIVER FULL NAME *' : 'CONTACT / SENDER NAME'}
                  </Text>
                  <TextInput
                    style={styles.iosInput}
                    placeholder="e.g. Abdullah Al-Harbi"
                    placeholderTextColor="#636366"
                    value={receiverOrContactName}
                    onChangeText={setReceiverOrContactName}
                  />

                  {/* Remarks / notes */}
                  <Text style={styles.inputHeading}>OPTIONAL NOTES / REMARKS</Text>
                  <TextInput
                    style={[styles.iosInput, { height: 60, textAlignVertical: 'top' }]}
                    placeholder="Condition of goods, seal number, gate notes..."
                    placeholderTextColor="#636366"
                    multiline
                    value={proofNotes}
                    onChangeText={setProofNotes}
                  />

                  {/* Submit button */}
                  <TouchableOpacity
                    style={[
                      styles.iosPrimaryButton,
                      { marginTop: 16 },
                      submittingProof && { opacity: 0.6 },
                    ]}
                    onPress={handleConfirmTaskCompletion}
                    disabled={submittingProof}
                  >
                    {submittingProof ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <AppleSymbol
                          iosName="checkmark.circle.fill"
                          fallbackName="checkmark"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.iosPrimaryButtonText}>
                          {activeTaskToComplete?.isPickup
                            ? 'Submit Pickup Proof'
                            : 'Submit Delivery (POD)'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setProofModalVisible(false)}
                    disabled={submittingProof}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MinimalTheme.background,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  iosSectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textMuted,
    letterSpacing: -0.1,
    marginBottom: 6,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  iosGroupedCard: {
    borderRadius: MinimalTheme.radiusCard,
    overflow: 'hidden',
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: MinimalTheme.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MinimalTheme.successSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: MinimalTheme.radiusPill,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MinimalTheme.success,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: MinimalTheme.success,
  },
  driverSubLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  driverSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
  },
  gpsStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: MinimalTheme.surface,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
  },
  gpsStatusText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
  },
  refreshBtn: {
    padding: 6,
  },
  centerLoading: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    color: MinimalTheme.textMuted,
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  sectionWrap: {
    marginTop: 16,
  },
  taskBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskTypeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    letterSpacing: 0.2,
  },
  sequenceText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textMuted,
  },
  addressBlock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  customerName: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.4,
  },
  addressText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: MinimalTheme.text,
    marginTop: 4,
    lineHeight: 20,
  },
  cityText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
    marginTop: 2,
  },
  trackingNo: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.accent,
    marginTop: 6,
  },
  cellDivider: {
    height: 1,
    backgroundColor: MinimalTheme.cardBorder,
    marginLeft: 16,
  },
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cellLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: MinimalTheme.text,
    flex: 1,
  },
  contactCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactName: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.text,
  },
  contactSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
  },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MinimalTheme.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: MinimalTheme.radiusPill,
  },
  callPillText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  specChip: {
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  specChipText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
  },
  buttonStack: {
    padding: 16,
    gap: 10,
  },
  iosPrimaryButton: {
    height: 50,
    backgroundColor: MinimalTheme.accent,
    borderRadius: MinimalTheme.radiusButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iosPrimaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  iosSecondaryButton: {
    height: 50,
    borderRadius: MinimalTheme.radiusButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iosSecondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  queueIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueIndexText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
  },
  queueTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueTaskTitle: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.text,
  },
  queueOrderNo: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textMuted,
  },
  queueAddress: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  manifestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manifestHeaderText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.text,
  },
  manifestBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 9,
    padding: 3,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentButtonActive: {
    backgroundColor: MinimalTheme.cardBorder,
  },
  segmentButtonText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textMuted,
  },
  segmentButtonTextActive: {
    color: MinimalTheme.text,
    fontFamily: Fonts.bold,
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  manifestItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  manifestItemTracking: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.text,
  },
  manifestItemCustomer: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
    marginTop: 2,
  },
  manifestStatusBadge: {
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  manifestStatusText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: MinimalTheme.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    backgroundColor: MinimalTheme.cardBorder,
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
    color: MinimalTheme.textSecondary,
    marginTop: 3,
    marginBottom: 16,
  },
  inputHeading: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textMuted,
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 10,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingVertical: 10,
    borderRadius: MinimalTheme.radiusButton,
  },
  photoActionText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.accent,
  },
  previewImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: MinimalTheme.successSubtle,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  previewSuccessText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: MinimalTheme.success,
  },
  previewSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textSecondary,
  },
  iosInput: {
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: MinimalTheme.radiusInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: MinimalTheme.text,
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
  },
  geofenceVerifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: MinimalTheme.successSubtle,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 12,
    borderRadius: MinimalTheme.radiusCard,
    marginBottom: 16,
  },
  geofenceVerifiedTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: MinimalTheme.success,
  },
  geofenceVerifiedSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  geofencePill: {
    backgroundColor: 'rgba(48, 209, 88, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  geofencePillText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: MinimalTheme.success,
  },
});
