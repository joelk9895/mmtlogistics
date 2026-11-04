import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Default production backend host (Vercel)
const DEFAULT_HOST = 'https://mmtlogistics.vercel.app';

const TOKEN_KEY = 'driver_auth_token';
const SERVER_URL_KEY = 'driver_server_url';

class ApiService {
  private baseUrl: string = DEFAULT_HOST;
  private token: string | null = null;

  async init() {
    try {
      if (Platform.OS !== 'web') {
        const savedUrl = await SecureStore.getItemAsync(SERVER_URL_KEY);
        if (savedUrl && !savedUrl.includes('localhost') && !savedUrl.includes('10.0.2.2')) {
          this.baseUrl = savedUrl;
        } else {
          this.baseUrl = DEFAULT_HOST;
        }

        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (savedToken) this.token = savedToken;
      } else {
        const savedUrl = localStorage.getItem(SERVER_URL_KEY);
        if (savedUrl && !savedUrl.includes('localhost') && !savedUrl.includes('10.0.2.2')) {
          this.baseUrl = savedUrl;
        } else {
          this.baseUrl = DEFAULT_HOST;
        }

        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (savedToken) this.token = savedToken;
      }
    } catch {
      // Ignore initial load failure
    }
  }

  async setServerUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SERVER_URL_KEY, this.baseUrl);
    } else {
      localStorage.setItem(SERVER_URL_KEY, this.baseUrl);
    }
  }

  getServerUrl(): string {
    return this.baseUrl;
  }

  async setToken(token: string | null) {
    this.token = token;
    if (Platform.OS !== 'web') {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } else {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  }

  // ── Auth ──────────────────────────────────────────────
  async login(email: string, password: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.token) {
      await this.setToken(res.token);
    }
    return res;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      await this.setToken(null);
    }
  }

  // ── Driver Profile ────────────────────────────────────
  async getProfile() {
    return this.request('/api/driver/me');
  }

  // ── GPS Location ──────────────────────────────────────
  async sendLocation(coords: { latitude: number; longitude: number; speed?: number | null; heading?: number | null }) {
    return this.request('/api/driver/location', {
      method: 'POST',
      body: JSON.stringify(coords),
    });
  }

  // ── Jobs & Trips ──────────────────────────────────────
  async getJobs(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/api/driver/jobs${query}`);
  }

  async updateJobStatus(orderId: string, payload: {
    status?: string;
    notes?: string;
    podStatus?: string;
    receiver?: string;
    actualPickup?: string;
    actualDelivery?: string;
    unloadingFinishedAt?: string;
    attachmentReferences?: string;
    completedLocationId?: string;
    locationNotes?: string;
    deliveryStatus?: string;
    driverLatitude?: number;
    driverLongitude?: number;
    pickupDistanceMeters?: number;
  }) {
    return this.request(`/api/driver/jobs/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // ── File & Proof Upload ───────────────────────────────
  async uploadFile(fileUri: string, fileName?: string, mimeType?: string) {
    const formData = new FormData();
    const name = fileName || fileUri.split('/').pop() || 'proof.jpg';
    const type = mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, name);
    } else {
      // @ts-ignore - React Native FormData accepts uri, name, and type
      formData.append('file', {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name,
        type,
      });
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}/api/upload`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload proof image');
    }

    return res.json();
  }

  // ── Allowance & Earnings ──────────────────────────────
  async getAllowance() {
    return this.request('/api/driver/allowance');
  }

  // ── Expenses ──────────────────────────────────────────
  async getExpenses() {
    return this.request('/api/driver/expenses');
  }

  async createExpense(payload: {
    category: string;
    amount: number;
    description?: string;
    receiptUrl?: string;
    date?: string;
    orderId?: string;
    liters?: number;
    odometerKm?: number;
    station?: string;
  }) {
    return this.request('/api/driver/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── Documents ─────────────────────────────────────────
  async getDocuments() {
    return this.request('/api/driver/documents');
  }

  async uploadDocument(payload: {
    docType: string;
    title: string;
    fileUrl?: string;
    referenceNo?: string;
    issueDate?: string;
    expiryDate?: string;
    notes?: string;
    forVehicle?: boolean;
  }) {
    return this.request('/api/driver/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── Leaves ────────────────────────────────────────────
  async getLeaves() {
    return this.request('/api/driver/leave');
  }

  async getScheduleAndLeaves() {
    return this.request('/api/driver/schedule');
  }

  async requestLeave(payload: { startDate: string; endDate: string; reason: string }) {
    return this.request('/api/driver/leave', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
