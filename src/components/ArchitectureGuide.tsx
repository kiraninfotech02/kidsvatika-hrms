/**
 * Senior Android Architectural Reference & Security Engineering Guide
 * Kids Vatika Smart School HRMS Mobile App
 */

import React from 'react';
import {
  Layers,
  Shield,
  Smartphone,
  MapPin,
  Camera,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Database,
  Lock,
  Fingerprint,
  Bell,
  BellRing,
  HardDrive,
  RefreshCw
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Architecture Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            Single-Activity MVVM Architecture & Clean Separation
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The Kids Vatika HRMS application is engineered with modern Android architecture guidelines:
          Single <code className="text-cyan-300">MainActivity</code> hosting a Navigation Compose{' '}
          <code className="text-cyan-300">NavHost</code>, declarative reactive UI with Material 3, unidirectional
          data flow (UDF) via <code className="text-cyan-300">StateFlow</code> in ViewModels, and asynchronous
          coroutines for networking and hardware sensors.
        </p>

        {/* 3-Tier Layer Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Smartphone className="w-4 h-4" />
              <span>UI Layer (Compose)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Material 3 Dark & Light Theme (Global Header Toggle)</li>
              <li>LoginScreen, DashboardScreen (Responsive Colors)</li>
              <li>CameraPreviewView & CircularFaceOverlay</li>
              <li>AttendanceResultDialog</li>
            </ul>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>Domain / ViewModel Layer</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>AuthViewModel (Session & Device ID)</li>
              <li>AttendanceViewModel (State Machine)</li>
              <li>60s Challenge Countdown Coroutine</li>
              <li>Unidirectional StateFlow & UI states</li>
            </ul>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Database className="w-4 h-4" />
              <span>Data & Hardware Layer</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Retrofit2 + OkHttp4 Network Client</li>
              <li>FusedLocationProviderClient Flow</li>
              <li>CameraX Preview & ImageCapture</li>
              <li>DeviceSecurity Keystore Binding</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Core Business Rules & Security Implementation Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Core Security & Business Rules Implementation Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Geofence */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <MapPin className="w-4 h-4" />
              <span>1. Geofence & GPS Accuracy Gate</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Kids Vatika campus coordinates (<strong className="text-slate-200">Lat: 30.6390703, Lng: 76.818226</strong>).
              Staff coordinates are checked against a <strong className="text-slate-200">120-metre radius</strong> using
              the Haversine great-circle formula. GPS fixes with accuracy &gt; 150m are rejected to eliminate cell-tower drift.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-cyan-400">
              val isGood = location.accuracy &lt;= 150f &amp;&amp; distance &lt;= 120f
            </div>
          </div>

          {/* Device Binding */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Lock className="w-4 h-4" />
              <span>2. Hardware Keystore Device Binding</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Staff smartphones are uniquely identified using hardware-backed{' '}
              <strong className="text-slate-200">Settings.Secure.ANDROID_ID</strong> salted with hardware manufacturer and model hashes.
              Prevents staff from punching attendance for colleagues or using cloud emulators.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-emerald-400">
              val fingerprint = "$&#123;Build.MANUFACTURER&#125;_$&#123;Build.MODEL&#125;_$androidId"
            </div>
          </div>

          {/* Anti-Spoofing & Liveness */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-bold">
              <Camera className="w-4 h-4" />
              <span>3. CameraX Anti-Spoofing Liveness</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Camera is strictly locked to <strong className="text-slate-200">DEFAULT_FRONT_CAMERA</strong>. Gallery selection is
              omitted from code. The server issues a dynamic challenge (<code className="text-cyan-300">TURN HEAD LEFT</code>,{' '}
              <code className="text-cyan-300">BLINK TWICE</code>, <code className="text-cyan-300">SMILE</code>) expiring in 60s.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-blue-400">
              CameraSelector.DEFAULT_FRONT_CAMERA
            </div>
          </div>

          {/* Compression */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <Cpu className="w-4 h-4" />
              <span>4. Image Scaling & Base64 Pipeline</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Captured bitmaps are rotated to match front sensor orientation, scaled down to a maximum of{' '}
              <strong className="text-slate-200">800x800 pixels</strong> while preserving aspect ratio, compressed to JPEG at 80% quality,
              and encoded into Base64 using <code className="text-cyan-300">Base64.NO_WRAP</code>.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-purple-400">
              Bitmap.createScaledBitmap(rotated, targetW, targetH, true)
            </div>
          </div>

          {/* BiometricPrompt */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Fingerprint className="w-4 h-4" />
              <span>5. Android BiometricPrompt API Integration</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Implemented using <code className="text-cyan-300">androidx.biometric:biometric:1.2.0-alpha05</code> with{' '}
              <code className="text-emerald-400">BIOMETRIC_STRONG or DEVICE_CREDENTIAL</code>. Triggers immediately after selfie capture and
              liveness challenge verification, requiring staff to authenticate via fingerprint or device PIN before dispatch.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-cyan-400">
              BiometricPrompt.PromptInfo.Builder().setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL).build()
            </div>
          </div>

            {/* Historical Attendance Logs Component */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Clock className="w-4 h-4" />
              <span>6. Historical Attendance Logs Component (Jetpack Compose)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Implemented in <code className="text-cyan-300">AttendanceHistorySection.kt</code> and integrated directly into the Dashboard.
              Fetches historical attendance records (Date, Check-In, Check-Out, Working Hours, Status) via Retrofit and renders reactive status badges with expandable verification audits.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-amber-400">
              AttendanceHistorySection(logs = attendanceLogs, summary = attendanceSummary)
            </div>
          </div>

          {/* FCM Push Notification Architecture */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <BellRing className="w-4 h-4" />
              <span>7. Firebase Cloud Messaging (FCM) & Push Alerts</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Implemented in <code className="text-cyan-300">HrmsFirebaseMessagingService.kt</code> with <code className="text-cyan-300">NotificationHelper.kt</code>.
              Supports dual notification channels (<code className="text-cyan-300">reminders_channel</code> for 8:45 AM shift check-in pings with direct "Check In Now" action, and <code className="text-cyan-300">approvals_channel</code> for admin leave and regularization updates). Supports deep linking via <code className="text-cyan-300">kidsvatika://checkin</code> and <code className="text-cyan-300">kidsvatika://approvals</code>.
            </p>
            <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-blue-400">
              NotificationHelper.showPushNotification(context, id, channelId, title, body, actionType)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Edge Case Handling Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Edge Case & Fault Tolerance Matrix</span>
        </h3>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Scenario</th>
                <th className="py-2.5 px-4 font-semibold">System Defense & Detection</th>
                <th className="py-2.5 px-4 font-semibold">User Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">GPS Disabled on Device</td>
                <td className="py-3 px-4 text-slate-400">
                  <code className="text-cyan-300">LocationManager.isProviderEnabled(GPS_PROVIDER)</code> returns false.
                </td>
                <td className="py-3 px-4 text-amber-300">
                  Prompts staff with a direct dialog to turn on High-Accuracy Location.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Location Permission Denied</td>
                <td className="py-3 px-4 text-slate-400">
                  Accompanist / AndroidX Permission state throws <code className="text-cyan-300">MISSING_PERMISSION</code>.
                </td>
                <td className="py-3 px-4 text-amber-300">
                  Displays explanatory rationale why Kids Vatika requires fine GPS.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Weak GPS Accuracy &gt; 150m</td>
                <td className="py-3 px-4 text-slate-400">
                  <code className="text-cyan-300">location.accuracy &gt; 150.0f</code> check fails.
                </td>
                <td className="py-3 px-4 text-rose-300">
                  Rejection banner: "Weak GPS signal ({'{'}acc{'}'}m). Step into an open area."
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Outside 120m Perimeter</td>
                <td className="py-3 px-4 text-slate-400">
                  Haversine distance evaluates to &gt; 120.0f from (30.6390703, 76.818226).
                </td>
                <td className="py-3 px-4 text-rose-300">
                  Rejection dialog: "You are {`{dist}`}m away from Kids Vatika School campus."
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Challenge Expired (&gt; 60s)</td>
                <td className="py-3 px-4 text-slate-400">
                  ViewModel coroutine timer cancels challenge state and invalidates token.
                </td>
                <td className="py-3 px-4 text-amber-300">
                  Auto-switches to Retry prompt so employee receives a fresh security challenge.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Biometric Sensor Unavailable / Not Enrolled</td>
                <td className="py-3 px-4 text-slate-400">
                  <code className="text-cyan-300">BiometricManager.canAuthenticate()</code> detects no enrolled fingerprint or unsupported hardware.
                </td>
                <td className="py-3 px-4 text-cyan-300">
                  Gracefully falls back to Device Credential (secure lockscreen PIN, pattern, or password).
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Biometric Auth Cancelled or Mismatch</td>
                <td className="py-3 px-4 text-slate-400">
                  BiometricPrompt.AuthenticationCallback returns <code className="text-cyan-300">onAuthenticationError</code> or <code className="text-cyan-300">onAuthenticationFailed</code>.
                </td>
                <td className="py-3 px-4 text-amber-300">
                  Punch is withheld; displays clear retry button without leaking challenge tokens.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">FCM Device Token Rotation</td>
                <td className="py-3 px-4 text-slate-400">
                  <code className="text-cyan-300">HrmsFirebaseMessagingService.onNewToken</code> triggers background sync via <code className="text-cyan-300">ApiClient.apiService.updateFcmToken</code>.
                </td>
                <td className="py-3 px-4 text-emerald-300">
                  Zero disruption to staff; server immediately associates updated token for push targeting.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Notification Clicked (App Closed)</td>
                <td className="py-3 px-4 text-slate-400">
                  Deep link (<code className="text-cyan-300">kidsvatika://checkin</code>) or intent extra parsed in <code className="text-cyan-300">MainActivity.onCreate</code>.
                </td>
                <td className="py-3 px-4 text-cyan-300">
                  Launches directly into the CameraX selfie check-in screen or historical records.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Backend Offline / Network Loss</td>
                <td className="py-3 px-4 text-slate-400">
                  Network unavailable or Retrofit <code className="text-cyan-300">IOException</code> thrown during check-in or login.
                </td>
                <td className="py-3 px-4 text-emerald-300">
                  Offline-First Room fallback: authenticates from cached credentials, saves punch to Room SQLite with <code className="text-amber-300">PENDING_SYNC</code>, and schedules WorkManager.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Room Database (androidx.room) & WorkManager Offline-First Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Room Database & WorkManager Background Sync Architecture
            </h3>
          </div>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
            Room 2.6.1 • WorkManager 2.10.0 • KSP
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The Kids Vatika HRMS Android application employs a resilient <strong>Offline-First Single Source of Truth (SSOT)</strong> design pattern. When staff arrive at school during temporary internet outages, they can still verify their identity and record attendance without being blocked.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Room Entities & DAOs */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-cyan-300 font-bold flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              <span>Room SQLite Database Schema</span>
            </h4>
            <div className="space-y-2 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-mono font-bold block mb-1">
                  @Entity(tableName = "attendance_logs")
                </span>
                <p className="text-[11px] text-slate-400">
                  Caches all historical attendance punches and offline punch requests. Includes <code className="text-amber-300">sync_status</code> column with values <code className="text-amber-300">'PENDING_SYNC'</code> or <code className="text-emerald-300">'SYNCED'</code>.
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-mono font-bold block mb-1">
                  @Entity(tableName = "staff_credentials")
                </span>
                <p className="text-[11px] text-slate-400">
                  Stores encrypted staff profiles, JWT bearer tokens, and salted password hashes for offline authentication validation.
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-blue-400 font-mono font-bold block mb-1">
                  Reactive Flow DAOs
                </span>
                <p className="text-[11px] text-slate-400">
                  <code className="text-cyan-300">AttendanceLogDao</code> exposes <code className="text-cyan-300">Flow&lt;List&lt;AttendanceLogEntity&gt;&gt;</code> observed by <code className="text-cyan-300">AttendanceViewModel</code> via <code className="text-cyan-300">stateIn()</code>.
                </p>
              </div>
            </div>
          </div>

          {/* WorkManager Sync Worker */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-emerald-300 font-bold flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>WorkManager Background Synchronization</span>
            </h4>
            <div className="space-y-2 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-mono font-bold block mb-1">
                  AttendanceSyncWorker (CoroutineWorker)
                </span>
                <p className="text-[11px] text-slate-400">
                  Queries <code className="text-cyan-300">attendanceLogDao.getPendingSyncLogs()</code>, serializes cached payloads, and posts them to Retrofit API. Marks each log as <code className="text-emerald-300">'SYNCED'</code> upon HTTP 200.
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-mono font-bold block mb-1">
                  Constraints & Retry Policy
                </span>
                <p className="text-[11px] text-slate-400">
                  Enforces <code className="text-cyan-300">NetworkType.CONNECTED</code> constraint. If the upload encounters a transient server failure, WorkManager schedules exponential backoff retries.
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-amber-400 font-mono font-bold block mb-1">
                  Periodic & Immediate Triggers
                </span>
                <p className="text-[11px] text-slate-400">
                  Runs every 15 minutes via <code className="text-cyan-300">PeriodicWorkRequestBuilder</code> and on-demand via <code className="text-cyan-300">OneTimeWorkRequestBuilder</code> immediately when network reconnection is detected.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Architecture Flow Block */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Offline Punch Submission & WorkManager Pipeline:
          </span>
          <pre className="text-[11px] font-mono text-cyan-300 bg-slate-900/90 p-3 rounded-xl overflow-x-auto leading-relaxed border border-slate-800/80">
{`// 1. AttendanceRepository.kt: Single Source of Truth Check-In
suspend fun recordCheckIn(request: CheckInRequest): Result<AttendanceResponse> {
    return try {
        // Attempt immediate network upload
        val response = apiService.checkIn(request)
        attendanceLogDao.insert(response.toEntity(syncStatus = "SYNCED"))
        Result.success(response)
    } catch (e: IOException) {
        // Network offline: Cache in local Room Database
        val localLog = AttendanceLogEntity.createFromRequest(
            request = request,
            syncStatus = "PENDING_SYNC"
        )
        attendanceLogDao.insert(localLog)
        
        // Enqueue WorkManager to sync when connection is restored
        SyncManager.enqueueImmediateSync(context)
        Result.success(localLog.toOfflineResponse())
    }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
