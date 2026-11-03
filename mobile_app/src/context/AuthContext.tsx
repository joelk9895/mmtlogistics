import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

interface DriverUser {
  id: string;
  email: string;
  role: string;
  driverId?: string;
}

interface DriverProfile {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  monthlyAllowance?: number | null;
  salary?: number | null;
  primaryVehicle?: {
    id: string;
    licensePlate: string;
    make: string;
    model: string;
    year?: number | null;
    vehicleDocuments?: any[];
  } | null;
}

interface AuthContextType {
  user: DriverUser | null;
  driver: DriverProfile | null;
  isLoading: boolean;
  serverUrl: string;
  setServerUrl: (url: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DriverUser | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState(api.getServerUrl());

  const initAuth = async () => {
    try {
      await api.init();
      setServerUrlState(api.getServerUrl());
      if (api.isAuthenticated()) {
        await refreshProfile();
      }
    } catch {
      await api.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.driver) {
        setDriver(res.driver);
      }
      if (res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Failed to refresh driver profile:', err);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      if (res.user) {
        setUser(res.user);
      }
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setDriver(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setServerUrl = async (url: string) => {
    await api.setServerUrl(url);
    setServerUrlState(api.getServerUrl());
  };

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        driver,
        isLoading,
        serverUrl,
        setServerUrl,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
