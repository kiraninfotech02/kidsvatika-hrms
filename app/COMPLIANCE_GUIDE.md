# Google Play Compliance Guide - Kids Vatika HRMS

## 1. Permission Justifications
- **ACCESS_FINE_LOCATION / FOREGROUND_SERVICE_LOCATION**: Required for school bus tracking. Users (drivers) are prompted with an in-app disclosure before telemetry starts.
- **CAMERA**: Required for liveness checks, visitor ID OCR, and receipt scanning. No data shared with 3rd parties.

## 2. Data Safety Declarations
| Data Type | Collected | Purpose | Encrypted? |
| :--- | :--- | :--- | :--- |
| Location | Yes | Bus Tracking | Yes (Transit) |
| Personal Info | Yes | Identity | Yes (At rest) |
| Photos | Yes | ID Verification| Yes (At rest) |
