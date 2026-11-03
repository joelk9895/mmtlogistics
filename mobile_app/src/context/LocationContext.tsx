import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

interface Coordinates {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
}

interface LocationContextType {
  isTracking: boolean;
  isSharing: boolean;
  setIsSharing: (share: boolean) => void;
  location: Coordinates | null;
  lastSyncTime: Date | null;
  errorMsg: string | null;
  syncNow: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [isSharing, setIsSharing] = useState(true);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentRef = useRef<number>(0);

  const sendCoords = useCallback(async (coords: Coordinates) => {
    if (!api.isAuthenticated()) return;
    try {
      await api.sendLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed: coords.speed,
        heading: coords.heading,
      });
      setLastSyncTime(new Date());
      setErrorMsg(null);
    } catch (err: any) {
      console.warn('Location sync failed:', err.message);
    }
  }, []);

  const syncNow = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords: Coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        speed: current.coords.speed,
        heading: current.coords.heading,
        accuracy: current.coords.accuracy,
      };
      setLocation(coords);
      await sendCoords(coords);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to acquire location');
    }
  };

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission was denied. Please allow location access to track deliveries.');
        return;
      }

      setIsTracking(true);

      // Initial quick fix
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null);

      if (initial) {
        const coords: Coordinates = {
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          speed: initial.coords.speed,
          heading: initial.coords.heading,
          accuracy: initial.coords.accuracy,
        };
        setLocation(coords);
        if (isSharing) {
          sendCoords(coords);
          lastSentRef.current = Date.now();
        }
      }

      // Continuous watcher
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // every 10s
          distanceInterval: 15, // or every 15 meters
        },
        (loc) => {
          const coords: Coordinates = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed,
            heading: loc.coords.heading,
            accuracy: loc.coords.accuracy,
          };
          setLocation(coords);

          // Rate limit sync to backend every 15 seconds minimum
          const now = Date.now();
          if (isSharing && (now - lastSentRef.current > 15000)) {
            lastSentRef.current = now;
            sendCoords(coords);
          }
        }
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error initializing GPS tracker');
    }
  };

  const stopTracking = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    setIsTracking(false);
  };

  useEffect(() => {
    if (user && isSharing) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [user, isSharing]);

  return (
    <LocationContext.Provider
      value={{
        isTracking,
        isSharing,
        setIsSharing,
        location,
        lastSyncTime,
        errorMsg,
        syncNow,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationTracker() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocationTracker must be used within LocationProvider');
  return context;
}
