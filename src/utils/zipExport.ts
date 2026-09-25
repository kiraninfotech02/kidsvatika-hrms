/**
 * Generates an Android Studio Project archive (.ZIP) with complete Gradle structure
 */

import JSZip from 'jszip';
import { ANDROID_FILES } from '../data/androidProjectFiles';

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Add all project files
  ANDROID_FILES.forEach(file => {
    zip.file(file.path, file.content.trim());
  });

  // 2. Add gradle.properties
  zip.file(
    'gradle.properties',
    `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`
  );

  // 3. Add gradle-wrapper.properties
  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // 4. Add proguard rules
  zip.file(
    'app/proguard-rules.pro',
    `# Retrofit & OkHttp
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson Models
-keepclassmembers class com.kidsvatika.hrms.data.model.** { *; }

# CameraX
-keep class androidx.camera.** { *; }
`
  );

  // 5. Add README.md with detailed instructions
  zip.file(
    'README.md',
    `# Kids Vatika Smart School HRMS Mobile App
**Target Platform:** Android (API 26+ / Android 8.0 Oreo through Android 15)  
**Architecture:** Single-Activity MVVM (Jetpack Compose + Material 3 + Kotlin Coroutines + Retrofit2)

## Live Backend Contract
- **Base URL:** https://hrms.kidsvatika.com/
- **Endpoint:** \`/api.php\`
- **Actions:**
  1. \`GET /api.php?action=ping\`
  2. \`POST /api.php?action=verify-location\`
  3. \`POST /api.php?action=request-challenge\`
  4. \`POST /api.php?action=check-in\`
  5. \`POST /api.php?action=check-out\`
  6. \`POST /api.php?action=login\`

## Core Business & Security Rules Implemented
1. **Geofence Parameters:**
   - Kids Vatika Latitude: \`30.6390703\`
   - Kids Vatika Longitude: \`76.818226\`
   - Allowed Radius: \`120 metres\`
   - Max Allowed GPS Accuracy: \`150 metres\`
2. **Device Hardware Binding:**
   - Extracts unique hardware-backed Device ID (\`Settings.Secure.ANDROID_ID\` with cryptographic salt and private app cache)
   - Staff cannot punch attendance from unregistered devices or mock proxies.
3. **Anti-Spoofing & Liveness:**
   - \`CameraX\` strictly bound to Front-facing camera (\`DEFAULT_FRONT_CAMERA\`).
   - Dynamic liveness challenge banner (\`action_required\` e.g. "TURN HEAD LEFT", "BLINK TWICE", "SMILE").
   - Max 800x800 resolution JPEG compression (~80% quality) converted to Base64 (NO_WRAP).

## How to Build in Android Studio
1. Unzip this directory.
2. Open Android Studio (Ladybug, Koala, or Iguana).
3. Select **File > Open** and choose this unzipped folder.
4. Allow Gradle sync to download dependencies (Play Services Location, CameraX, Retrofit2, Compose BOM).
5. Connect a physical Android phone or start an emulator with API 26+ and Front Camera enabled.
6. Click **Run 'app'**.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
