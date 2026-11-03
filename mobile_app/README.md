# Logistics Driver Mobile Application (React Native / Expo)

A cross-platform React Native mobile application built with **Expo Router**, **TypeScript**, and modern glassmorphic dark-mode design, specifically tailored for freight & delivery drivers operating under Saudi / GCC logistics standards.

---

## 📱 Features

1. **Active Jobs & Trips (`/(tabs)/index`)**:
   - Lists assigned delivery orders with cargo specifications (weight, volume, Hazmat status).
   - Route timeline showing Pickup Warehouse and Delivery Destinations with live stop status.
   - **1-Tap Navigation**: Redirects to **Google Maps** or **Waze** with coordinates and destination address.
   - **1-Tap Dialing**: Call consignee / site dispatcher directly.
   - Status updates: Mark as `IN_TRANSIT`, `DELIVERED`, record receiver POD name and notes.

2. **Live GPS Tracking & Telemetry (`/(tabs)/location`)**:
   - High-accuracy GPS location tracking via `expo-location`.
   - Live broadcasting to the Next.js Admin Operations Control Room map.
   - Real-time speedometer, heading compass indicator, and sync status badge.
   - Background location polling capability.

3. **Allowance & Trip TA Dashboard (`/(tabs)/allowance`)**:
   - Monthly base allowance tracking.
   - Trip Travel Allowance (TA) accrued per completed delivery run.
   - Reimbursable approved expense claims.
   - Direct link to **Annual Leave & Schedule** modal.

4. **Expense & Fuel Logging (`/(tabs)/expenses`)**:
   - Quick logging of Fuel, Tolls, Vehicle Maintenance, Parking, and Per Diem claims.
   - Fuel odometer (km), liters pumped, and gas station tracking.
   - Camera & Gallery integration (`expo-image-picker`) for taking photos of receipts.
   - Real-time reimbursement status (`PENDING`, `APPROVED`, `REJECTED`, `REIMBURSED`).

5. **Vehicle & Driver Compliance Documents (`/(tabs)/documents`)**:
   - **Driver Documents**: Saudi Iqama / Resident ID, Heavy/Medium Driving License, TGA Operating Card (Naql), Medical Fitness Certificate.
   - **Vehicle Documents**: Istimara (Vehicle Registration), MVPI (Fahas Periodic Inspection), Comprehensive Insurance Policy, Tare Weight slips.
   - Expiry tracking with countdown badges (Valid, Expiring within 30 days, Expired).
   - Document upload / renewal modal with camera capture and document picker (`expo-document-picker`).

6. **Leave & Duty Schedule (`/leaves`)**:
   - Annual leave quota tracker (e.g. 21 days default or custom contract allowance).
   - Time-off request submission with real-time day calculation and conflict validation.
   - Approval history and dispatcher decisions.

---

## 🚀 Running the App Locally

### Prerequisites
- Node.js 18+
- Expo CLI or Expo Go app on iOS/Android

### 1. Install Dependencies
```bash
cd mobile_app
npm install
```

### 2. Start the Expo Dev Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator (uses `http://10.0.2.2:3000` to connect to the Next.js server).
- Press `i` to open in iOS Simulator (uses `http://localhost:3000`).
- Scan the QR code using the **Expo Go** app on your physical device. On the login screen, you can tap "Server Settings" to enter your local machine's LAN IP address (e.g., `http://192.168.1.100:3000`).

---

## 🔐 Driver Login Credentials

Use any driver credentials created in the system, or log in with an admin/dispatcher account (role auto-detected):
- **Email**: `driver@logistics.com` (or create a new driver user in Admin Portal)
- **Password**: `password123`
