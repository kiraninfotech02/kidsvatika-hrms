# Play Store Compliance Guide - Kids Vatika HRMS

## 1. Sensitive Permission Justifications

### Camera (`CAMERA`)
- **Justification:** Used for biometric liveness check during attendance, scanning ID cards/barcodes for visitor entry, and scanning student ID cards for bus boarding.

### Foreground Service (`FOREGROUND_SERVICE_LOCATION`)
- **Justification:** Essential for real-time tracking of school buses during active transit trips. Enables safety monitoring and parent notifications.

### Location (`ACCESS_FINE_LOCATION`)
- **Justification:** Strictly utilized to verify school bus arrival at designated stops and campus geofence perimeter checks. No data is shared with third parties.

## 2. Android 14/15 Compliance
- We strictly adhere to Scoped Storage requirements. All user media (visitor photos) is handled via MediaStore or app-specific storage.
