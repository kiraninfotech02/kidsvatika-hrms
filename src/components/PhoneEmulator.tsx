/**
 * Interactive Android Phone Emulator (Google Pixel 8 / Material 3)
 * Simulates the complete Kids Vatika HRMS Android Mobile App
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  MapPin,
  Camera,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Lock,
  User,
  Clock,
  Compass,
  Zap,
  Sliders,
  ChevronRight,
  Eye,
  EyeOff,
  Video,
  Smartphone,
  Navigation,
  School,
  Check,
  Activity,
  Maximize2,
  Fingerprint,
  KeyRound,
  Calendar,
  CalendarDays,
  ChevronDown,
  ArrowRight,
  Bell,
  BellRing,
  X,
  Database,
  Wifi,
  WifiOff,
  HardDrive,
  CloudOff,
  Layers,
  Sun,
  Moon,
  Palette,
  QrCode,
  Flashlight,
  Sparkles,
  ScanLine,
  Search,
  Filter,
  Users,
  Megaphone,
  CheckSquare,
  FileText,
  CheckCheck,
  Send,
  Building,
  XCircle,
  Inbox
} from 'lucide-react';
import {
  PRESET_LOCATIONS,
  GeoLocationState,
  evaluateGeofence,
  KIDS_VATIKA_GEOFENCE,
} from '../utils/geoUtils';
import {
  HrmsApiService,
  LIVENESS_ACTIONS,
  AttendanceRecordItem,
  FcmPushMessage,
  StaffAttendanceStatusItem,
  PendingApprovalItem,
  ApprovalActionPayload,
} from '../services/apiService';
import {
  KidsVatikaRoomDatabase,
  StaffCredentialEntity,
  AttendanceLogEntity,
  CheckInRequestEntity,
  CachedCampusRosterEntity,
  QueuedApprovalActionEntity,
  WorkManagerStatus,
} from '../services/roomDatabase';

export interface CampusQrCodeTarget {
  id: string;
  name: string;
  locationTag: string;
  gateCode: string;
  rawPayload: string;
  description: string;
}

export const CAMPUS_QR_TARGETS: CampusQrCodeTarget[] = [
  {
    id: 'gate_1',
    name: 'Kids Vatika Main Gate (Gate 1)',
    locationTag: 'Campus Perimeter Entry (30.6391° N, 76.8182° E)',
    gateCode: 'KV-GATE-01-ENTRANCE',
    rawPayload: 'KV_SMART_CAMPUS://GATE-01?token=kv_gate_entry_99812&session=MORNING_SHIFT&geofence=VALID',
    description: 'Primary security checkpoint for teaching & administrative staff.',
  },
  {
    id: 'admin_desk',
    name: 'Admin Block Front Reception',
    locationTag: 'Central Administrative Wing (Ground Floor)',
    gateCode: 'KV-ADMIN-RECEPTION',
    rawPayload: 'KV_SMART_CAMPUS://ADMIN-DESK?token=kv_admin_rec_44821&session=OFFICE_HOURS&geofence=VALID',
    description: 'Central foyer check-in kiosk for office and non-academic personnel.',
  },
  {
    id: 'staff_lounge',
    name: 'Staff Room Faculty Lounge',
    locationTag: 'Academic Block B (Faculty Level 1)',
    gateCode: 'KV-STAFF-ROOM-B1',
    rawPayload: 'KV_SMART_CAMPUS://FACULTY-LOUNGE?token=kv_staff_lounge_77192&session=TEACHING_CREW&geofence=VALID',
    description: 'Academic staff room attendance hub and department sign-in beacon.',
  },
];

interface PhoneEmulatorProps {
  onApiActionFired?: () => void;
}

export const PhoneEmulator: React.FC<PhoneEmulatorProps> = ({ onApiActionFired }) => {
  // Current App Navigation Route: 'login' | 'dashboard' | 'attendance' | 'qr_scanner' | 'admin_dashboard' | 'approval_queue'
  const [currentRoute, setCurrentRoute] = useState<
    'login' | 'dashboard' | 'attendance' | 'qr_scanner' | 'admin_dashboard' | 'approval_queue'
  >('login');

  // Executive Admin & Principal Dashboard State
  const [campusRoster, setCampusRoster] = useState<StaffAttendanceStatusItem[]>([]);
  const [rosterSummary, setRosterSummary] = useState({ total: 7, present: 4, late: 1, absent: 1, leave: 1 });
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterFilter, setRosterFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE'>('ALL');
  const [isRosterLoading, setIsRosterLoading] = useState<boolean>(false);
  const [isRosterRefreshing, setIsRosterRefreshing] = useState<boolean>(false);
  const [isRosterOffline, setIsRosterOffline] = useState<boolean>(false);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [isApprovalsLoading, setIsApprovalsLoading] = useState<boolean>(false);
  const [approvalsBannerMsg, setApprovalsBannerMsg] = useState<string | null>(null);
  const [queuedApprovalsCount, setQueuedApprovalsCount] = useState<number>(0);

  // Broadcast Circular Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('Emergency Staff Briefing & Academic Review');
  const [broadcastContent, setBroadcastContent] = useState<string>('All faculty members are requested to assemble in the Main Auditorium today at 2:30 PM.');
  const [broadcastDept, setBroadcastDept] = useState<string>('ALL');
  const [broadcastPriority, setBroadcastPriority] = useState<string>('HIGH');
  const [isBroadcastingNotice, setIsBroadcastingNotice] = useState<boolean>(false);

  // Approval Decision Interactivity State
  const [approvalTarget, setApprovalTarget] = useState<{ item: PendingApprovalItem; decision: 'APPROVED' | 'REJECTED' } | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [showRemarksModal, setShowRemarksModal] = useState<boolean>(false);
  const [showBiometricApprovalModal, setShowBiometricApprovalModal] = useState<boolean>(false);

  // Device Info
  const [deviceId] = useState<string>('a8f9c4e2-9b7d-41a3-92f1-736e4b9982dc');

  // Simulated GPS Location
  const [currentLocation, setCurrentLocation] = useState<GeoLocationState>(PRESET_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState<number>(30.6390703);
  const [customLng, setCustomLng] = useState<number>(76.818226);
  const [customAccuracy, setCustomAccuracy] = useState<number>(12.0);

  // Authentication State
  const [loginId, setLoginId] = useState<string>('TCH-102');
  const [password, setPassword] = useState<string>('Vatika@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [staffUser, setStaffUser] = useState<any>(null);

  // Live Clock
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  // Attendance Flow State Machine: 'idle' | 'checking_gps' | 'requesting_challenge' | 'biometric_verification' | 'camera_active' | 'submitting' | 'result' | 'error'
  const [attendanceStep, setAttendanceStep] = useState<
    'idle' | 'checking_gps' | 'requesting_challenge' | 'biometric_verification' | 'camera_active' | 'submitting' | 'result' | 'error'
  >('idle');
  const [challengeData, setChallengeData] = useState<{ token: string; action: string; expiresAt: number } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [isCheckInResult, setIsCheckInResult] = useState<boolean>(true);

  // Historical Attendance Logs state for Staff Dashboard
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecordItem[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<{
    total_days: number;
    present_count: number;
    late_count: number;
    half_day_count: number;
    absent_count: number;
  } | null>(null);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Room Database & Offline-First Persistence State
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(KidsVatikaRoomDatabase.getIsOnline());
  const [isSyncingWorkManager, setIsSyncingWorkManager] = useState<boolean>(false);
  const [roomDbStaff, setRoomDbStaff] = useState<StaffCredentialEntity[]>(KidsVatikaRoomDatabase.getAllCachedStaff());
  const [roomDbLogs, setRoomDbLogs] = useState<AttendanceLogEntity[]>(KidsVatikaRoomDatabase.getAttendanceLogs());
  const [roomDbRequests, setRoomDbRequests] = useState<CheckInRequestEntity[]>(KidsVatikaRoomDatabase.getAllCheckInRequests());
  const [workManagerStatus, setWorkManagerStatus] = useState<WorkManagerStatus>(KidsVatikaRoomDatabase.getWorkManagerStatus());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(
    KidsVatikaRoomDatabase.getPendingSyncLogs().length + KidsVatikaRoomDatabase.getPendingCheckInRequests().length
  );
  const [roomDbInspectorTab, setRoomDbInspectorTab] = useState<'attendance' | 'requests' | 'staff' | 'sync_queue'>('attendance');
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  // QA Developer Settings Drawer & FLAG_SECURE Simulation
  const [showQaDevDrawer, setShowQaDevDrawer] = useState<boolean>(false);
  const [screenshotBlockedToast, setScreenshotBlockedToast] = useState<boolean>(false);

  // FLAG_SECURE active on sensitive screens: admin dashboard, approvals, biometric authorization
  const isSecureScreenActive =
    currentRoute === 'admin_dashboard' ||
    currentRoute === 'approval_queue' ||
    showBiometricApprovalModal ||
    attendanceStep === 'biometric_verification';

  // Subscribe to Room Database live changes (simulating Room Flow/LiveData)
  useEffect(() => {
    const unsubscribe = KidsVatikaRoomDatabase.subscribe(() => {
      setIsNetworkOnline(KidsVatikaRoomDatabase.getIsOnline());
      setIsSyncingWorkManager(KidsVatikaRoomDatabase.getIsSyncing());
      setRoomDbStaff(KidsVatikaRoomDatabase.getAllCachedStaff());
      setRoomDbLogs(KidsVatikaRoomDatabase.getAttendanceLogs());
      setRoomDbRequests(KidsVatikaRoomDatabase.getAllCheckInRequests());
      setWorkManagerStatus(KidsVatikaRoomDatabase.getWorkManagerStatus());
      setPendingSyncCount(
        KidsVatikaRoomDatabase.getPendingSyncLogs().length + KidsVatikaRoomDatabase.getPendingCheckInRequests().length
      );
    });
    return unsubscribe;
  }, []);

  // Fetch Attendance Logs helper (Room Database Offline-First Pattern)
  const loadAttendanceLogs = async (staffId: number = 102) => {
    setIsLogsLoading(true);

    // 1. Immediately emit from Room Database (Room DAO Flow simulation)
    const cachedLogs = KidsVatikaRoomDatabase.getAttendanceLogs(staffId);
    if (cachedLogs.length > 0) {
      setAttendanceLogs(cachedLogs.map(item => ({
        id: item.id,
        date: item.date,
        formattedDate: item.formattedDate,
        checkIn: item.checkInTime || '--:--',
        checkOut: item.checkOutTime || '--:--',
        status: item.status,
        statusCode: item.statusCode,
        workingHours: item.workingHours,
        verificationType: item.verificationType,
        checkInLocation: item.checkInLocation || null,
        checkOutLocation: item.checkOutLocation || null,
        syncStatus: item.syncStatus,
      })));
    }

    // 2. If online, fetch from remote server and update Room cache
    if (KidsVatikaRoomDatabase.getIsOnline()) {
      try {
        const res = await HrmsApiService.getAttendanceLogs(staffId);
        if (res.status === 'success') {
          // Sync to Room Database
          KidsVatikaRoomDatabase.insertServerLogsBatch(res.logs.map(l => ({
            id: l.id,
            date: l.date,
            formattedDate: l.formattedDate,
            checkInTime: l.checkIn,
            checkOutTime: l.checkOut,
            status: l.status,
            statusCode: l.statusCode,
            workingHours: l.workingHours,
            verificationType: l.verificationType,
            checkInLocation: l.checkInLocation,
            checkOutLocation: l.checkOutLocation,
          })), staffId);

          setAttendanceLogs(res.logs);
          setAttendanceSummary(res.summary);
        }
      } catch (e) {
        // Fallback already rendered from Room
      }
    }

    setIsLogsLoading(false);
    onApiActionFired?.();
  };

  // ---------------------------------------------------------------------------
  // EXECUTIVE & PRINCIPAL DATA SYNC (Campus Roster & Pending Approvals)
  // ---------------------------------------------------------------------------
  const loadCampusRoster = async (isRefresh: boolean = false) => {
    if (isRefresh) setIsRosterRefreshing(true);
    else setIsRosterLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // 1. If device is online, query live API and cache to Room Database
    if (KidsVatikaRoomDatabase.getIsOnline()) {
      try {
        const res = await HrmsApiService.getCampusRoster(today);
        if (res.status === 'success' && res.roster) {
          setCampusRoster(res.roster);
          setRosterSummary({
            total: res.totalStaff,
            present: res.presentCount,
            late: res.lateCount,
            absent: res.absentCount,
            leave: res.leaveCount,
          });
          setIsRosterOffline(false);

          // Write-through caching into Room Database entity
          KidsVatikaRoomDatabase.insertCampusRosterBatch(
            res.roster.map(item => ({
              ...item,
              rosterDate: today,
              cachedAtTimestamp: Date.now(),
            }))
          );
        }
      } catch {
        loadRosterFromRoom(today);
      }
    } else {
      // 2. Offline: Read directly from Room Database cache
      loadRosterFromRoom(today);
    }

    setIsRosterLoading(false);
    setIsRosterRefreshing(false);
    onApiActionFired?.();
  };

  const loadRosterFromRoom = (date: string) => {
    const cached = KidsVatikaRoomDatabase.getCachedCampusRoster(date);
    const mapped: StaffAttendanceStatusItem[] = cached.map(c => ({
      staffId: c.staffId,
      staffCode: c.staffCode,
      name: c.name,
      designation: c.designation,
      department: c.department,
      phone: c.phone,
      punchStatus: c.punchStatus,
      checkInTime: c.checkInTime,
      checkInDistanceMetres: c.checkInDistanceMetres,
      verificationMode: c.verificationMode,
      selfieUrl: c.selfieUrl,
    }));
    setCampusRoster(mapped);
    const present = mapped.filter(c => c.punchStatus === 'PRESENT').length;
    const late = mapped.filter(c => c.punchStatus === 'LATE').length;
    const absent = mapped.filter(c => c.punchStatus === 'ABSENT').length;
    const leave = mapped.filter(c => c.punchStatus === 'ON_LEAVE').length;
    setRosterSummary({ total: mapped.length, present, late, absent, leave });
    setIsRosterOffline(true);
  };

  const loadPendingApprovals = async () => {
    setIsApprovalsLoading(true);
    setQueuedApprovalsCount(KidsVatikaRoomDatabase.getPendingQueuedApprovals().length);
    try {
      const res = await HrmsApiService.getPendingApprovals();
      if (res.status === 'success' && res.approvals) {
        setPendingApprovals(res.approvals);
      }
    } catch {
      // offline fallback or keep existing
    }
    setIsApprovalsLoading(false);
    onApiActionFired?.();
  };

  const executeApprovalDecision = async (
    item: PendingApprovalItem,
    decision: 'APPROVED' | 'REJECTED',
    remarks?: string
  ) => {
    // 1. Optimistic UI removal: immediately update state
    setPendingApprovals(prev => prev.filter(a => a.approvalId !== item.approvalId));

    // 2. If offline, enqueue into Room Database for WorkManager sync
    if (!KidsVatikaRoomDatabase.getIsOnline()) {
      KidsVatikaRoomDatabase.enqueueApprovalAction({
        approvalId: item.approvalId,
        requestType: item.requestType,
        decision,
        reviewerRemarks: remarks || (decision === 'APPROVED' ? 'Verified by Principal' : 'Insufficient reason'),
        staffName: item.staffName,
      });
      setQueuedApprovalsCount(KidsVatikaRoomDatabase.getPendingQueuedApprovals().length);
      setApprovalsBannerMsg(
        `Offline Queued: Request for ${item.staffName} marked ${decision} in Room DB. Will sync via WorkManager.`
      );
      setTimeout(() => setApprovalsBannerMsg(null), 6000);
      return;
    }

    // 3. Online: dispatch via Retrofit API
    try {
      await HrmsApiService.processApproval({
        approvalId: item.approvalId,
        requestType: item.requestType,
        decision,
        reviewerRemarks: remarks,
      });
      setApprovalsBannerMsg(
        `Success: ${item.requestType === 'LEAVE_APPLICATION' ? 'Leave Application' : 'Punch Regularization'} for ${item.staffName} was ${decision.toLowerCase()}.`
      );
      setTimeout(() => setApprovalsBannerMsg(null), 5000);
    } catch {
      // Offline fallback queue
      KidsVatikaRoomDatabase.enqueueApprovalAction({
        approvalId: item.approvalId,
        requestType: item.requestType,
        decision,
        reviewerRemarks: remarks,
        staffName: item.staffName,
      });
      setQueuedApprovalsCount(KidsVatikaRoomDatabase.getPendingQueuedApprovals().length);
      setApprovalsBannerMsg(`Network timeout: Decision saved locally in Room DB queue.`);
      setTimeout(() => setApprovalsBannerMsg(null), 6000);
    }
    onApiActionFired?.();
  };

  const handleBroadcastCircular = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;
    setIsBroadcastingNotice(true);
    try {
      await HrmsApiService.broadcastCircular({
        title: broadcastTitle,
        content: broadcastContent,
        targetDepartment: broadcastDept,
        priority: broadcastPriority,
        broadcastByName: staffUser?.name || 'Dr. Rajesh Verma',
        broadcastByRole: staffUser?.role || 'PRINCIPAL',
      });

      // Dispatch simulated FCM push notification to phone emulator
      const noticePush: FcmPushMessage = {
        id: `fcm_circ_${Date.now()}`,
        type: 'general',
        channelId: 'general_channel',
        title: `📢 Circular: ${broadcastTitle}`,
        body: broadcastContent,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        deepLink: 'kidsvatika://circulars',
      };
      setActivePushNotification(noticePush);
      setPushNotificationHistory(prev => [noticePush, ...prev]);

      setShowBroadcastModal(false);
      confetti({ particleCount: 40, spread: 65, origin: { y: 0.4 } });
    } finally {
      setIsBroadcastingNotice(false);
      onApiActionFired?.();
    }
  };

  // Toggle Network Online / Offline (Airplane Mode)
  const handleToggleNetwork = () => {
    const nextState = !isNetworkOnline;
    KidsVatikaRoomDatabase.setIsOnline(nextState);
    setIsNetworkOnline(nextState);

    if (nextState) {
      // Auto-trigger WorkManager sync upon network reconnect
      setTimeout(() => {
        handleRunWorkManagerSync();
      }, 500);
    }
  };

  // Trigger WorkManager Background Synchronization
  const handleRunWorkManagerSync = async () => {
    setIsSyncingWorkManager(true);
    const syncResult = await KidsVatikaRoomDatabase.triggerWorkManagerSync();
    setIsSyncingWorkManager(false);

    if (syncResult.syncedCount > 0) {
      loadAttendanceLogs(staffUser?.staff_id || 102);

      // Dispatch in-app Heads-Up Notification for WorkManager Sync Success
      const syncNotice: FcmPushMessage = {
        id: `wm_sync_${Date.now()}`,
        type: 'general',
        channelId: 'general_channel',
        title: 'WorkManager: Offline Punches Synchronized 🔄',
        body: `Successfully transmitted ${syncResult.syncedCount} cached offline punch(es) from Room Database to Kids Vatika HRMS server.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        deepLink: 'kidsvatika://approvals',
      };
      setActivePushNotification(syncNotice);
      setPushNotificationHistory(prev => [syncNotice, ...prev]);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
      });
    }
  };

  // FCM Push Notifications State
  const [fcmToken, setFcmToken] = useState<string>('fcm_kv_staff_102_e7b92f9810a4e12c');
  const [isFcmRegistered, setIsFcmRegistered] = useState<boolean>(true);
  const [activePushNotification, setActivePushNotification] = useState<FcmPushMessage | null>(null);
  const [pushNotificationHistory, setPushNotificationHistory] = useState<FcmPushMessage[]>([
    {
      id: 'fcm_init_1',
      type: 'checkin_reminder',
      channelId: 'reminders_channel',
      title: 'Kids Vatika Check-In Reminder 🏫',
      body: 'Morning staff shift starts at 9:00 AM. Punch your selfie check-in within campus perimeter.',
      timestamp: '08:45 AM',
      deepLink: 'kidsvatika://checkin',
    },
  ]);
  const [customPushType, setCustomPushType] = useState<'checkin_reminder' | 'approval_alert' | 'general'>('checkin_reminder');
  const [customPushTitle, setCustomPushTitle] = useState<string>('Kids Vatika Check-In Reminder 🏫');
  const [customPushBody, setCustomPushBody] = useState<string>('Good morning Amit! School gates close at 9:00 AM. Please verify your selfie punch inside the campus.');
  const [isSendingPush, setIsSendingPush] = useState<boolean>(false);
  const pushDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Global Compose UI Theme state (Light vs Dark Mode Material 3)
  const [composeTheme, setComposeTheme] = useState<'dark' | 'light'>('dark');

  // Trigger / Dispatch FCM Push Notification Helper
  const handleTriggerPush = async (
    type: 'checkin_reminder' | 'approval_alert' | 'general',
    overrideTitle?: string,
    overrideBody?: string
  ) => {
    setIsSendingPush(true);
    const staffId = staffUser?.staff_id || 102;
    const title = overrideTitle || (
      type === 'checkin_reminder'
        ? 'Kids Vatika Check-In Reminder 🏫'
        : type === 'approval_alert'
        ? 'Leave Request Approved ✅'
        : 'Kids Vatika Notice 📢'
    );
    const body = overrideBody || (
      type === 'checkin_reminder'
        ? 'Good morning Amit! School gates close at 9:00 AM. Please verify your selfie punch inside campus.'
        : type === 'approval_alert'
        ? 'Your Half-Day leave request for Sep 24 has been APPROVED by Principal Sharma.'
        : 'School will observe Half-Day tomorrow due to Parent-Teacher Meeting.'
    );

    try {
      const res = await HrmsApiService.sendPushNotification(staffId, type, title, body);
      const newMsg: FcmPushMessage = {
        id: res.message_id || `fcm_${Date.now()}`,
        type,
        channelId: (res.channel_id as any) || (type === 'checkin_reminder' ? 'reminders_channel' : 'approvals_channel'),
        title,
        body,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        deepLink: type === 'checkin_reminder' ? 'kidsvatika://checkin' : 'kidsvatika://approvals',
      };

      // Set active banner
      setActivePushNotification(newMsg);
      setPushNotificationHistory(prev => [newMsg, ...prev]);

      // Auto-dismiss after 9 seconds if not clicked
      if (pushDismissTimerRef.current) clearTimeout(pushDismissTimerRef.current);
      pushDismissTimerRef.current = setTimeout(() => {
        setActivePushNotification(null);
      }, 9000);
    } catch (e) {
      // Fallback
    } finally {
      setIsSendingPush(false);
      onApiActionFired?.();
    }
  };

  // Re-register FCM Device Token
  const handleRegisterFcmToken = async () => {
    const staffId = staffUser?.staff_id || 102;
    const newToken = `fcm_kv_staff_${staffId}_${Math.random().toString(36).substring(2, 10)}`;
    setFcmToken(newToken);
    await HrmsApiService.updateFcmToken(staffId, newToken, 'Pixel 8 Pro (Android 15)');
    setIsFcmRegistered(true);
    onApiActionFired?.();
  };

  // Android BiometricPrompt State Machine
  const [showBiometricPrompt, setShowBiometricPrompt] = useState<boolean>(false);
  const [biometricFeedback, setBiometricFeedback] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [biometricErrorMessage, setBiometricErrorMessage] = useState<string | null>(null);
  const [enforceBiometric, setEnforceBiometric] = useState<boolean>(true);
  const [biometricGateMode, setBiometricGateMode] = useState<'attendance_selfie' | 'qr_scan' | 'app_launch'>('attendance_selfie');
  const [isAppLockedByBiometric, setIsAppLockedByBiometric] = useState<boolean>(false);
  const pendingSelfieRef = useRef<string | null>(null);

  // Google ML Kit QR Scanner State Machine
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [selectedCampusQr, setSelectedCampusQr] = useState<CampusQrCodeTarget>(CAMPUS_QR_TARGETS[0]);
  const [isScanningQr, setIsScanningQr] = useState<boolean>(false);
  const [qrDebounceLocked, setQrDebounceLocked] = useState<boolean>(false);
  const [detectedQrData, setDetectedQrData] = useState<CampusQrCodeTarget | null>(null);
  const [qrScanResultData, setQrScanResultData] = useState<any>(null);

  // Real Webcam vs Canvas Simulation
  const [useRealCamera, setUseRealCamera] = useState<boolean>(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [headPose, setHeadPose] = useState<'center' | 'left' | 'smile' | 'blink'>('center');

  // Real-time Geofence Evaluation
  const geofenceResult = evaluateGeofence(
    currentLocation.latitude,
    currentLocation.longitude,
    currentLocation.accuracy
  );

  // Live clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateString(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebCam Stream Handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useRealCamera && attendanceStep === 'camera_active') {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } })
        .then(s => {
          stream = s;
          setCameraPermissionGranted(true);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(err => {
          setCameraError('Front Camera permission denied or not available. Switching to Interactive Face Simulation.');
          setUseRealCamera(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useRealCamera, attendanceStep]);

  // Challenge Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (attendanceStep === 'camera_active' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setAttendanceStep('error');
            setAttendanceError('Anti-Spoofing Challenge expired (60s limit). Please initiate punch again for fresh token.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [attendanceStep, secondsRemaining]);

  // 1-Click Fast Login autofill
  const handleAutoFill = (role: 'teacher' | 'principal' | 'admin') => {
    if (role === 'teacher') {
      setLoginId('TCH-102');
      setPassword('Teacher@KV2026');
    } else if (role === 'principal') {
      setLoginId('PRN-001');
      setPassword('Principal@KV');
    } else {
      setLoginId('ADM-003');
      setPassword('Admin@KV');
    }
  };

  // Perform Login (Online via API or Offline via Room Database Credentials Cache)
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginId || !password) {
      setAuthError('Please enter your Staff ID and Password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    if (isNetworkOnline) {
      try {
        const res = await HrmsApiService.login(loginId, password, deviceId);
        if (res.status === 'success' && res.staff) {
          setStaffUser(res.staff);
          // Cache staff credentials in Room Database for future offline access
          KidsVatikaRoomDatabase.insertOrUpdateStaff({
            staffId: res.staff.staff_id,
            staffCode: res.staff.staff_code,
            name: res.staff.name || 'Staff Member',
            designation: res.staff.designation || 'Faculty Staff',
            department: res.staff.department || 'Kids Vatika School',
            email: res.staff.email || 'staff@kidsvatika.com',
            phone: res.staff.phone || '+91 98765 43210',
            authToken: res.token || `jwt_token_${Date.now()}`,
            passwordHash: password,
            lastLoginTimestamp: Date.now(),
          });

          // Dynamic Navigation Gate: Principal / Admin roles navigate to Executive Dashboard
          const isExec = res.staff.role === 'PRINCIPAL' || res.staff.role === 'ADMIN' || res.staff.role === 'SUPER_ADMIN' || res.staff.staff_code?.includes('PRN') || res.staff.staff_code?.includes('ADM');
          if (isExec) {
            setCurrentRoute('admin_dashboard');
            loadCampusRoster();
            loadPendingApprovals();
          } else {
            setCurrentRoute('dashboard');
            loadAttendanceLogs(res.staff.staff_id);
          }
        } else {
          setAuthError(res.message || 'Login failed. Please verify credentials.');
        }
      } catch (err: any) {
        // Network unexpectedly failed: try offline Room login fallback
        attemptOfflineLogin();
      } finally {
        setAuthLoading(false);
        onApiActionFired?.();
      }
    } else {
      // OFFLINE LOGIN: Authenticate using Room Database cached credentials
      attemptOfflineLogin();
      setAuthLoading(false);
      onApiActionFired?.();
    }
  };

  const attemptOfflineLogin = () => {
    const verifiedStaff = KidsVatikaRoomDatabase.verifyOfflineCredentials(loginId, password);
    if (verifiedStaff) {
      const isExec = verifiedStaff.staffCode.includes('PRN') || verifiedStaff.staffCode.includes('ADM');
      const user = {
        staff_id: verifiedStaff.staffId,
        staff_code: verifiedStaff.staffCode,
        name: verifiedStaff.name,
        designation: verifiedStaff.designation,
        department: verifiedStaff.department,
        email: verifiedStaff.email,
        phone: verifiedStaff.phone,
        role: isExec ? (verifiedStaff.staffCode.includes('PRN') ? 'PRINCIPAL' : 'ADMIN') : 'STAFF',
      };
      setStaffUser(user);

      if (isExec) {
        setCurrentRoute('admin_dashboard');
        loadCampusRoster();
        loadPendingApprovals();
      } else {
        setCurrentRoute('dashboard');
        loadAttendanceLogs(verifiedStaff.staffId);
      }

      setRoomNotice(`Offline Authentication: Signed in with Room Database cache (${verifiedStaff.staffCode})`);
      setTimeout(() => setRoomNotice(null), 5000);
    } else {
      setAuthError('Offline Login Failed: Credentials not found in Room Database. Please log in once while online to cache your profile.');
    }
  };

  // Initial load of attendance logs when entering dashboard
  useEffect(() => {
    if (currentRoute === 'dashboard') {
      loadAttendanceLogs(staffUser?.staff_id || 102);
    }
  }, [currentRoute]);

  // Start Check-In Attendance Flow
  const handleStartCheckIn = async () => {
    setAttendanceStep('checking_gps');
    setAttendanceError(null);
    setCurrentRoute('attendance');

    // Step 1: Real-time GPS verification (Geofence calculation works offline with device GPS)
    await new Promise(r => setTimeout(r, 600));
    const geo = evaluateGeofence(currentLocation.latitude, currentLocation.longitude, currentLocation.accuracy);

    if (!geo.canCheckIn) {
      setAttendanceStep('error');
      setAttendanceError(geo.statusText);
      return;
    }

    // Step 2: Retrieve Anti-Spoofing Challenge (From API or Local Offline Security Generator)
    setAttendanceStep('requesting_challenge');

    if (isNetworkOnline) {
      try {
        const challengeRes = await HrmsApiService.requestChallenge(staffUser?.staff_id || 102, deviceId);
        if (challengeRes.status === 'success' && challengeRes.challenge) {
          setChallengeData({
            token: challengeRes.challenge.challenge_token,
            action: challengeRes.challenge.action_required,
            expiresAt: Date.now() + 60000,
          });
          setSecondsRemaining(60);
          if (enforceBiometric) {
            setAttendanceStep('biometric_verification');
          } else {
            setAttendanceStep('camera_active');
          }
          return;
        }
      } catch (err: any) {
        // Fall back to offline challenge
      }
    }

    // Offline Anti-Spoofing Challenge Generation (Deterministic local challenge)
    const randomAction = LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)];
    setChallengeData({
      token: `kv_offline_challenge_${Date.now()}`,
      action: randomAction,
      expiresAt: Date.now() + 60000,
    });
    setSecondsRemaining(60);
    if (enforceBiometric) {
      setAttendanceStep('biometric_verification');
    } else {
      setAttendanceStep('camera_active');
    }
    onApiActionFired?.();
  };

  // Capture Selfie & Submit Check-In
  const handleCaptureAndPunch = async () => {
    setAttendanceStep('submitting');
    setAttendanceError(null);

    // Generate max 800x800 JPEG Base64
    let base64Selfie = '';
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (useRealCamera && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 640);
      } else {
        // Draw synthetic high-res biometric face avatar
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 640);
        // Face oval
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.ellipse(320, 320, 160, 210, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(260, 290, 16, 0, Math.PI * 2);
        ctx.arc(380, 290, 16, 0, Math.PI * 2);
        ctx.fill();
        // Smile / Action
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(320, 370, 48, 0, Math.PI);
        ctx.stroke();
        // Timestamp & watermark
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`KIDS VATIKA HRMS • ${new Date().toISOString()}`, 30, 600);
      }
      base64Selfie = canvas.toDataURL('image/jpeg', 0.82);
    }

    // Biometric authentication already verified before camera unlock; proceed to check-in submission
    await executePunchSubmission(base64Selfie);
  };

  const executePunchSubmission = async (selfieBase64: string) => {
    setShowBiometricPrompt(false);
    setAttendanceStep('submitting');

    const staffId = staffUser?.staff_id || 102;
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    if (isNetworkOnline) {
      try {
        const punchRes = await HrmsApiService.checkIn({
          staff_id: staffId,
          device_id: deviceId,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          challenge_token: challengeData?.token || 'kv_token_auto',
          selfie_image: selfieBase64,
        });

        if (punchRes.status === 'success') {
          // Cache successful punch in Room Database with SYNCED status
          KidsVatikaRoomDatabase.insertAttendanceLog({
            id: punchRes.attendance_id || `ATT-${Date.now()}`,
            staffId: staffId,
            date: todayStr,
            formattedDate: formattedDateStr,
            checkInTime: punchRes.punch_time || nowTimeStr,
            checkOutTime: '--:--',
            status: 'Present',
            statusCode: 'PRESENT',
            workingHours: 'In Progress',
            verificationType: 'Selfie + Biometric + Geofence',
            checkInLocation: `Kids Vatika Campus (${punchRes.distance_metres || 18}m)`,
            distanceMetres: punchRes.distance_metres || 18,
            gpsAccuracy: currentLocation.accuracy,
            syncStatus: 'SYNCED',
            offlineCreatedTimestamp: Date.now(),
          });

          setResultData({
            ...punchRes,
            isOffline: false,
          });
          setIsCheckInResult(true);
          setAttendanceStep('result');
          loadAttendanceLogs(staffId);

          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else {
          setAttendanceStep('error');
          setAttendanceError(punchRes.message);
        }
      } catch (err: any) {
        // Unexpected network drop: fallback to Room Database offline punch
        saveOfflinePunch(selfieBase64);
      } finally {
        onApiActionFired?.();
      }
    } else {
      // OFFLINE PUNCH: Cache in Room Database with PENDING_SYNC status
      saveOfflinePunch(selfieBase64);
    }
  };

  // Save punch into local Room Database when offline
  const saveOfflinePunch = (selfieBase64: string) => {
    const staffId = staffUser?.staff_id || 102;
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const localId = `LOCAL-PUNCH-${Date.now()}`;
    const requestId = `REQ-${Date.now()}-${staffUser?.staff_code || 'KV102'}`;

    // 1. Insert into AttendanceLogEntity
    const offlineEntity: AttendanceLogEntity = {
      id: localId,
      staffId: staffId,
      date: todayStr,
      formattedDate: formattedDateStr,
      checkInTime: nowTimeStr,
      checkOutTime: '--:--',
      status: 'Present (Offline Pending)',
      statusCode: 'PRESENT',
      workingHours: 'In Progress',
      verificationType: 'Selfie + Biometric + Geofence (Offline)',
      checkInLocation: `Kids Vatika Campus (${geofenceResult.distanceMetres}m)`,
      distanceMetres: geofenceResult.distanceMetres,
      gpsAccuracy: currentLocation.accuracy,
      syncStatus: 'PENDING_SYNC',
      offlineCreatedTimestamp: Date.now(),
      selfieBase64: selfieBase64,
      offlineDeviceId: deviceId,
      offlineChallengeToken: challengeData?.token || 'offline_token',
    };
    KidsVatikaRoomDatabase.insertAttendanceLog(offlineEntity);

    // 2. Insert into CheckInRequestEntity for Room Database upload queue
    const requestEntity: CheckInRequestEntity = {
      requestId: requestId,
      staffId: staffId,
      staffCode: staffUser?.staff_code || 'KV-STAFF-102',
      deviceId: deviceId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      distanceToSchoolMetres: geofenceResult.distanceMetres,
      challengeToken: challengeData?.token || 'offline_token',
      selfieImageBase64: selfieBase64,
      punchTimestamp: Date.now(),
      punchTimeFormatted: nowTimeStr,
      punchDateFormatted: formattedDateStr,
      syncStatus: 'PENDING_SYNC',
      retryCount: 0,
    };
    KidsVatikaRoomDatabase.insertCheckInRequest(requestEntity);

    setResultData({
      status: 'success',
      message: 'Offline check-in saved to device Room Database. WorkManager will synchronize to Kids Vatika server once network returns.',
      punch_time: nowTimeStr,
      distance_metres: geofenceResult.distanceMetres,
      attendance_id: localId,
      isOffline: true,
    });
    setIsCheckInResult(true);
    setAttendanceStep('result');
    loadAttendanceLogs(staffId);

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  const handleSimulateBiometricSuccess = () => {
    setBiometricFeedback('scanning');
    setBiometricErrorMessage(null);
    setTimeout(() => {
      setBiometricFeedback('success');
      setTimeout(() => {
        setBiometricFeedback('idle');
        setShowBiometricPrompt(false);

        if (biometricGateMode === 'app_launch') {
          setIsAppLockedByBiometric(false);
        } else if (biometricGateMode === 'qr_scan') {
          handleExecuteQrPunch();
        } else {
          // Advance to live CameraX selfie preview
          setAttendanceStep('camera_active');
        }
      }, 500);
    }, 450);
  };

  const handleSimulateBiometricMismatch = () => {
    setBiometricFeedback('scanning');
    setTimeout(() => {
      setBiometricFeedback('failed');
      setBiometricErrorMessage('Fingerprint not recognized. Touch sensor again.');
      setTimeout(() => {
        setBiometricFeedback('idle');
      }, 1800);
    }, 450);
  };

  // Google ML Kit QR Trigger with Debounce and State Locking
  const handleTriggerQrScan = (target: CampusQrCodeTarget) => {
    if (qrDebounceLocked) return;

    setIsScanningQr(true);
    setQrDebounceLocked(true);

    setTimeout(() => {
      setIsScanningQr(false);
      setDetectedQrData(target);
      // Mandatory Biometric Security Gate before final submission
      setBiometricGateMode('qr_scan');
      setShowBiometricPrompt(true);
    }, 600);
  };

  // Execute QR Attendance Check-In Submission
  const handleExecuteQrPunch = async () => {
    const staffId = staffUser?.staff_id || 102;
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const localId = `LOCAL-QR-${Date.now()}`;
    const target = detectedQrData || selectedCampusQr;

    const punchPayload = {
      staff_id: staffId,
      device_id: deviceId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      challenge_token: `QR_AUTH_${Date.now()}`,
      selfie_image: `GOOGLE_ML_KIT_QR: ${target.name} | ${target.gateCode} | ${target.rawPayload}`,
    };

    if (KidsVatikaRoomDatabase.getIsOnline()) {
      try {
        const punchRes = await HrmsApiService.checkIn(punchPayload);
        if (punchRes.status === 'success') {
          const serverLog: AttendanceLogEntity = {
            id: punchRes.attendance_id ? `ATT-${punchRes.attendance_id}` : localId,
            staffId: staffId,
            date: todayStr,
            formattedDate: formattedDateStr,
            checkInTime: punchRes.punch_time || nowTimeStr,
            checkOutTime: '--:--',
            status: 'Present',
            statusCode: 'PRESENT',
            workingHours: 'In Progress',
            verificationType: 'ML Kit QR + Biometric Strong',
            checkInLocation: target.name,
            distanceMetres: geofenceResult.distanceMetres,
            gpsAccuracy: currentLocation.accuracy,
            syncStatus: 'SYNCED',
            offlineCreatedTimestamp: Date.now(),
            offlineDeviceId: deviceId,
          };
          KidsVatikaRoomDatabase.insertAttendanceLog(serverLog);

          setQrScanResultData({
            status: 'success',
            message: `Campus gate check-in recorded for ${target.name}.`,
            punch_time: punchRes.punch_time || nowTimeStr,
            distance_metres: geofenceResult.distanceMetres,
            attendance_id: punchRes.attendance_id || localId,
            gateName: target.name,
            isOffline: false,
          });

          loadAttendanceLogs(staffId);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else {
          saveOfflineQrPunch(target);
        }
      } catch (err: any) {
        saveOfflineQrPunch(target);
      } finally {
        onApiActionFired?.();
      }
    } else {
      saveOfflineQrPunch(target);
    }
  };

  const saveOfflineQrPunch = (target: CampusQrCodeTarget) => {
    const staffId = staffUser?.staff_id || 102;
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const localId = `LOCAL-QR-${Date.now()}`;
    const requestId = `REQ-QR-${Date.now()}-${staffUser?.staff_code || 'KV102'}`;

    const offlineEntity: AttendanceLogEntity = {
      id: localId,
      staffId: staffId,
      date: todayStr,
      formattedDate: formattedDateStr,
      checkInTime: nowTimeStr,
      checkOutTime: '--:--',
      status: 'Present (Offline Pending)',
      statusCode: 'PRESENT',
      workingHours: 'In Progress',
      verificationType: 'ML Kit QR + Biometric Strong (Room Offline)',
      checkInLocation: target.name,
      distanceMetres: geofenceResult.distanceMetres,
      gpsAccuracy: currentLocation.accuracy,
      syncStatus: 'PENDING_SYNC',
      offlineCreatedTimestamp: Date.now(),
      offlineDeviceId: deviceId,
      offlineChallengeToken: `QR_AUTH_OFFLINE_${Date.now()}`,
    };
    KidsVatikaRoomDatabase.insertAttendanceLog(offlineEntity);

    const requestEntity: CheckInRequestEntity = {
      requestId: requestId,
      staffId: staffId,
      staffCode: staffUser?.staff_code || 'KV-STAFF-102',
      deviceId: deviceId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      distanceToSchoolMetres: geofenceResult.distanceMetres,
      challengeToken: `QR_AUTH_OFFLINE_${Date.now()}`,
      selfieImageBase64: `ML_KIT_QR_SCAN: ${target.name} | ${target.gateCode}`,
      punchTimestamp: Date.now(),
      punchTimeFormatted: nowTimeStr,
      punchDateFormatted: formattedDateStr,
      syncStatus: 'PENDING_SYNC',
      retryCount: 0,
    };
    KidsVatikaRoomDatabase.insertCheckInRequest(requestEntity);

    setQrScanResultData({
      status: 'success',
      message: `Offline QR check-in saved to device Room Database at ${target.name}. WorkManager will sync once online.`,
      punch_time: nowTimeStr,
      distance_metres: geofenceResult.distanceMetres,
      attendance_id: localId,
      gateName: target.name,
      isOffline: true,
    });
    loadAttendanceLogs(staffId);
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  // Perform Check-Out
  const handleCheckOut = async () => {
    setAttendanceStep('checking_gps');
    setCurrentRoute('attendance');

    const geo = evaluateGeofence(currentLocation.latitude, currentLocation.longitude, currentLocation.accuracy);
    if (!geo.canCheckIn) {
      setAttendanceStep('error');
      setAttendanceError(`Check-Out failed: ${geo.statusText}`);
      return;
    }

    setAttendanceStep('submitting');
    try {
      const outRes = await HrmsApiService.checkOut({
        staff_id: staffUser?.staff_id || 102,
        device_id: deviceId,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
      });

      if (outRes.status === 'success') {
        setResultData(outRes);
        setIsCheckInResult(false);
        setAttendanceStep('result');
        // Refresh logs in background
        loadAttendanceLogs(staffUser?.staff_id || 102);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        setAttendanceStep('error');
        setAttendanceError(outRes.message);
      }
    } catch (err: any) {
      setAttendanceStep('error');
      setAttendanceError(err.message || 'Check-Out failed.');
    } finally {
      onApiActionFired?.();
    }
  };

  // Acquire real browser GPS
  const handleUseRealBrowserGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc: GeoLocationState = {
            label: `My Real GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setCurrentLocation(loc);
          setCustomLat(pos.coords.latitude);
          setCustomLng(pos.coords.longitude);
          setCustomAccuracy(Math.round(pos.coords.accuracy));
        },
        err => {
          alert(`GPS error: ${err.message}. Using default campus coordinates.`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-7xl mx-auto py-4">
      {/* 1. Android Phone Mockup (Google Pixel 8 Pro / Material 3) */}
      <div className="relative mx-auto flex-shrink-0">
        {/* Device Outer Frame */}
        <div className="w-[370px] sm:w-[395px] h-[800px] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-slate-700/60 shadow-blue-950/40 relative flex flex-col">
          {/* Hardware Buttons on side */}
          <div className="absolute -left-1.5 top-28 w-1 h-12 bg-slate-700 rounded-l-md" />
          <div className="absolute -left-1.5 top-44 w-1 h-12 bg-slate-700 rounded-l-md" />
          <div className="absolute -right-1.5 top-32 w-1 h-16 bg-slate-700 rounded-r-md" />

          {/* Screen Bezel */}
          <div className={`relative w-full h-full ${
            composeTheme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-800/80' : 'bg-slate-100 text-slate-900 border-slate-300'
          } rounded-[40px] overflow-hidden flex flex-col border transition-colors duration-200`}>
            {/* Camera Punch Hole & Status Bar */}
            <div className={`h-10 w-full flex items-center justify-between px-6 pt-1 select-none z-30 ${
              composeTheme === 'dark' ? 'bg-slate-950/85 text-slate-300' : 'bg-slate-100/90 text-slate-700 border-b border-slate-200'
            } backdrop-blur-md transition-colors`}>
              <span className={`text-xs font-semibold tracking-tight ${
                composeTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {timeString ? timeString.slice(0, 5) : '09:00'}
              </span>
              {/* Front Camera Cutout */}
              <div className="w-4 h-4 bg-black rounded-full ring-2 ring-slate-800/80 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${
                composeTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {isSecureScreenActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotBlockedToast(true);
                      setTimeout(() => setScreenshotBlockedToast(false), 3500);
                    }}
                    className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30"
                    title="FLAG_SECURE Active: WindowManager blocks screen capture. Click to test screenshot prevention."
                  >
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>SECURE</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowQaDevDrawer(true)}
                  className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-1.5 py-0.2 rounded border border-cyan-500/30"
                  title="QA Developer Settings & Test Drawer"
                >
                  QA
                </button>
                {isNetworkOnline ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-0.5" title="Network Connected: Live Server Sync">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    5G
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/30" title="Offline Mode: Room Database Caching Active">
                    <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                    ROOM
                  </span>
                )}
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-mono">98%</span>
              </div>
            </div>

            {/* Android Offline / Room Database System Notice Banner */}
            {!isNetworkOnline && (
              <div className="bg-amber-950/80 border-b border-amber-500/40 px-3 py-1 text-[10px] text-amber-200 flex items-center justify-between font-medium z-20">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>Offline Mode • Room Database Active</span>
                </span>
                {pendingSyncCount > 0 ? (
                  <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                    {pendingSyncCount} punch pending sync
                  </span>
                ) : (
                  <span className="text-amber-400/80 text-[9px]">Local SQLite</span>
                )}
              </div>
            )}

            {roomNotice && (
              <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-3 py-1 text-[10px] text-emerald-200 flex items-center justify-between font-medium z-20 animate-in fade-in duration-200">
                <span className="truncate">{roomNotice}</span>
                <button onClick={() => setRoomNotice(null)} className="text-emerald-400 ml-2 hover:text-white">✕</button>
              </div>
            )}

            {/* SCREEN CONTENT BY ROUTE */}
            <div className="flex-1 overflow-y-auto flex flex-col relative">

              {/* ANDROID HEADS-UP PUSH NOTIFICATION BANNER */}
              {activePushNotification && (
                <div className="absolute top-2 left-2.5 right-2.5 z-50 animate-in slide-in-from-top-4 duration-300">
                  <div className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md ${
                    activePushNotification.type === 'checkin_reminder'
                      ? 'bg-slate-900/95 border-blue-500/60 shadow-blue-950/80 ring-1 ring-blue-500/30'
                      : activePushNotification.type === 'approval_alert'
                      ? 'bg-slate-900/95 border-emerald-500/60 shadow-emerald-950/80 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/95 border-amber-500/60 shadow-amber-950/80 ring-1 ring-amber-500/30'
                  }`}>
                    {/* Header row: Icon, App Name, Time, Channel Badge, Dismiss */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
                          <School className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white tracking-tight">Kids Vatika HRMS</span>
                        <span className="text-[9px] text-slate-400">• Just now</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          activePushNotification.channelId === 'reminders_channel'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {activePushNotification.channelId === 'reminders_channel' ? 'Reminders' : 'Approvals'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePushNotification(null)}
                          className="w-4 h-4 text-slate-400 hover:text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Notification Title & Body */}
                    <div className="mb-2">
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {activePushNotification.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                        {activePushNotification.body}
                      </p>
                    </div>

                    {/* Android Heads-Up Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      {activePushNotification.type === 'checkin_reminder' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePushNotification(null);
                            if (currentRoute === 'login') {
                              setStaffUser({ staff_id: 102, staff_code: 'TCH-102', name: 'Amit Kumar', designation: 'Primary Teacher', department: 'Primary Wing' });
                              setCurrentRoute('dashboard');
                            }
                            handleStartCheckIn();
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 shadow-md shadow-blue-900/40 transition-all"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Check In Now</span>
                        </button>
                      )}

                      {activePushNotification.type === 'approval_alert' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePushNotification(null);
                            if (currentRoute !== 'dashboard') {
                              setCurrentRoute('dashboard');
                            }
                            loadAttendanceLogs(staffUser?.staff_id || 102);
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 shadow-md shadow-emerald-900/40 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>View Records</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActivePushNotification(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ROUTE 1: LOGIN SCREEN */}
              {currentRoute === 'login' && (
                <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                  <div className="pt-4 flex flex-col items-center text-center">
                    {/* School Emblem */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 mb-3">
                      <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                        <School className="w-10 h-10 text-cyan-400" />
                      </div>
                    </div>
                    <h1 className="text-xl font-extrabold text-white tracking-wider">KIDS VATIKA</h1>
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Smart School HRMS</span>
                    <p className="text-[11px] text-slate-400 mt-1">Staff Biometric & Geofence Portal</p>
                  </div>

                  {/* Login Form */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl my-4">
                    <h2 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                      <span>Staff Authorization</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Device Bound
                      </span>
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-300 font-medium block mb-1">Staff ID / Mobile / Email</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={loginId}
                            onChange={e => setLoginId(e.target.value)}
                            placeholder="e.g. TCH-102"
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-medium block mb-1">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2 pl-9 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Device Hardware Chip */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 leading-tight">Hardware Device ID</p>
                          <p className="text-[11px] font-mono text-slate-200 truncate">{deviceId}</p>
                        </div>
                      </div>

                      {authError && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to HRMS</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Quick Demo Autofill */}
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">Quick Credentials:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAutoFill('teacher')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-1 rounded-lg border border-slate-700"
                        >
                          Teacher (102)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoFill('principal')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-1 rounded-lg border border-slate-700"
                        >
                          Principal (101)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoFill('admin')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-1 rounded-lg border border-slate-700"
                        >
                          Admin (103)
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center pb-2">
                    Secured by Jetpack Compose Material 3 & Keystore Device Binding
                  </p>
                </div>
              )}

              {/* ROUTE 2: STAFF DASHBOARD */}
              {currentRoute === 'dashboard' && (
                <div className={`flex-1 flex flex-col p-4 ${
                  composeTheme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
                } transition-colors duration-200 overflow-y-auto custom-scrollbar`}>
                  {/* Top Header */}
                  <div className={`flex items-center justify-between pb-3 border-b ${
                    composeTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                        composeTheme === 'dark'
                          ? 'bg-blue-600/20 border-blue-500/40 text-cyan-400'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        <School className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className={`text-xs font-bold leading-tight ${
                          composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>Kids Vatika HRMS</h2>
                        <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Geofence Radar Active
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Dynamic Executive Navigation Gate */}
                      {(staffUser?.role === 'PRINCIPAL' ||
                        staffUser?.role === 'ADMIN' ||
                        staffUser?.role === 'SUPER_ADMIN' ||
                        staffUser?.staff_code?.includes('PRN') ||
                        staffUser?.staff_code?.includes('ADM')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentRoute('admin_dashboard');
                            loadCampusRoster();
                            loadPendingApprovals();
                          }}
                          className="px-2 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm shadow-purple-900/40"
                          title="Switch to Principal Management Portal"
                        >
                          <Building className="w-3 h-3" />
                          <span>Admin Portal</span>
                        </button>
                      )}

                      {/* Global Theme Toggle Button in Dashboard Header */}
                      <button
                        type="button"
                        onClick={() => setComposeTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                        className={`px-2 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                          composeTheme === 'dark'
                            ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                            : 'bg-white hover:bg-slate-50 text-indigo-700 border-slate-300 shadow-sm'
                        }`}
                        title={composeTheme === 'dark' ? 'Switch Compose UI to Light Theme' : 'Switch Compose UI to Dark Theme'}
                        aria-label="Toggle Theme"
                      >
                        {composeTheme === 'dark' ? (
                          <>
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            <span>Light</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Dark</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setStaffUser(null);
                          setCurrentRoute('login');
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          composeTheme === 'dark'
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Staff Info Card */}
                  <div className={`mt-3 border rounded-2xl p-4 shadow-sm transition-colors ${
                    composeTheme === 'dark'
                      ? 'bg-gradient-to-br from-slate-900 to-slate-800/90 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                        {staffUser?.name ? staffUser.name.slice(0, 2).toUpperCase() : 'PS'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-bold truncate ${
                          composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>{staffUser?.name || 'Pooja Sharma'}</h3>
                        <p className={`text-xs font-semibold ${
                          composeTheme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
                        }`}>{staffUser?.designation || 'Senior Faculty'}</p>
                        <p className={`text-[10px] ${
                          composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>Staff Code: {staffUser?.staff_code || 'KV-STAFF-102'}</p>
                      </div>
                    </div>
                  </div>

                  {/* FCM Push Notification Device Registration Banner */}
                  <div className={`mt-2.5 border rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors ${
                    composeTheme === 'dark'
                      ? 'bg-blue-950/40 border-blue-500/30'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                        composeTheme === 'dark'
                          ? 'bg-blue-600/30 border-blue-400/40 text-cyan-300'
                          : 'bg-blue-100 border-blue-300 text-blue-700'
                      }`}>
                        <BellRing className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold leading-tight ${
                            composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>FCM Push Alerts</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className={`text-[9px] truncate font-mono ${
                          composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {fcmToken ? `${fcmToken.slice(0, 20)}...` : 'Registering token...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTriggerPush('checkin_reminder')}
                        disabled={isSendingPush}
                        className="text-[9px] bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1 shadow-sm"
                        title="Simulate Check-In Reminder Push"
                      >
                        <Bell className="w-2.5 h-2.5" />
                        <span>Ping</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerPush('approval_alert')}
                        disabled={isSendingPush}
                        className="text-[9px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1 shadow-sm"
                        title="Simulate Approval Alert Push"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Alert</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Clock & Geofence Radar Card */}
                  <div className={`mt-3 border rounded-2xl p-4 text-center transition-colors ${
                    composeTheme === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <span className={`text-[11px] font-medium ${
                      composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>{dateString || 'Today'}</span>
                    <div className={`text-2xl font-black tracking-wider my-1 font-mono ${
                      composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {timeString || '09:00:00 AM'}
                    </div>

                    {/* Geofence Status Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mt-1 ${
                        geofenceResult.canCheckIn
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{geofenceResult.distanceMetres}m to School</span>
                      <span>•</span>
                      <span>{geofenceResult.canCheckIn ? 'INSIDE 120m' : 'OUTSIDE'}</span>
                    </div>

                    <div className={`text-[10px] mt-2 ${
                      composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      GPS Accuracy: <span className={`font-mono font-bold ${
                        composeTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                      }`}>{currentLocation.accuracy}m</span> (Max 150m)
                    </div>
                  </div>

                  {/* ATTENDANCE PUNCH ACTIONS */}
                  <div className="mt-4">
                    <span className={`text-[10px] font-bold tracking-wider uppercase block mb-2 ${
                      composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Daily Biometric Punch
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Check-In Button */}
                      <button
                        onClick={handleStartCheckIn}
                        className="bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white p-2.5 rounded-2xl shadow-md shadow-emerald-700/30 border border-emerald-500/50 flex flex-col items-center justify-center text-center transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-bold leading-tight">SELFIE IN</span>
                        <span className="text-[8px] text-emerald-100/80">Liveness</span>
                      </button>

                      {/* ML Kit QR Scan Button */}
                      <button
                        onClick={() => {
                          setQrDebounceLocked(false);
                          setDetectedQrData(null);
                          setQrScanResultData(null);
                          setCurrentRoute('qr_scanner');
                        }}
                        className="bg-gradient-to-tr from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 active:scale-[0.98] text-white p-2.5 rounded-2xl shadow-md shadow-cyan-700/30 border border-cyan-400/50 flex flex-col items-center justify-center text-center transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-cyan-400/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <QrCode className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-bold leading-tight">QR SCAN</span>
                        <span className="text-[8px] text-cyan-100/90">ML Kit Gate</span>
                      </button>

                      {/* Check-Out Button */}
                      <button
                        onClick={handleCheckOut}
                        className="bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white p-2.5 rounded-2xl shadow-md shadow-rose-700/30 border border-rose-500/50 flex flex-col items-center justify-center text-center transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <LogOut className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-bold leading-tight">PUNCH OUT</span>
                        <span className="text-[8px] text-rose-100/80">GPS Check</span>
                      </button>
                    </div>

                    {/* Biometric App Launch / Resume Gate Simulation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAppLockedByBiometric(true);
                        setBiometricGateMode('app_launch');
                        setShowBiometricPrompt(true);
                      }}
                      className={`w-full mt-2.5 border rounded-xl py-1.5 px-3 text-[11px] font-medium flex items-center justify-between transition-all ${
                        composeTheme === 'dark'
                          ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">Simulate App Launch / Resume Gate</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                        Lock
                      </span>
                    </button>
                  </div>

                  {/* Secondary Quick Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => loadAttendanceLogs(staffUser?.staff_id || 102)}
                      disabled={isLogsLoading}
                      className={`border rounded-xl py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        composeTheme === 'dark'
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isLogsLoading ? 'animate-spin' : ''}`} />
                      <span>{isLogsLoading ? 'Fetching...' : 'Refresh Logs'}</span>
                    </button>
                    <button
                      onClick={() => alert('Leave application feature connected to Kids Vatika HRMS Leave Module')}
                      className={`border rounded-xl py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        composeTheme === 'dark'
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      <span>Apply Leave</span>
                    </button>
                  </div>

                  {/* HISTORICAL ATTENDANCE LOGS COMPOSE COMPONENT IN EMULATOR */}
                  <div className="mt-4 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${composeTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${
                          composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          ATTENDANCE LOGS & HISTORY
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold ${
                        composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {attendanceLogs.length} Records
                      </span>
                    </div>

                    {/* Summary Metrics Pill */}
                    {attendanceSummary && (
                      <div className={`border rounded-xl p-2.5 grid grid-cols-4 gap-1 text-center transition-colors ${
                        composeTheme === 'dark'
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-extrabold text-emerald-500">{attendanceSummary.present_count}</span>
                          <span className={`text-[9px] ${composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Present</span>
                        </div>
                        <div className={`flex flex-col items-center border-l ${
                          composeTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          <span className="text-xs font-extrabold text-amber-500">{attendanceSummary.late_count}</span>
                          <span className={`text-[9px] ${composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Late</span>
                        </div>
                        <div className={`flex flex-col items-center border-l ${
                          composeTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          <span className="text-xs font-extrabold text-sky-500">{attendanceSummary.half_day_count}</span>
                          <span className={`text-[9px] ${composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Half Day</span>
                        </div>
                        <div className={`flex flex-col items-center border-l ${
                          composeTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          <span className="text-xs font-extrabold text-rose-500">{attendanceSummary.absent_count}</span>
                          <span className={`text-[9px] ${composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Absent</span>
                        </div>
                      </div>
                    )}

                    {/* Attendance Logs List */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                      {isLogsLoading && attendanceLogs.length === 0 ? (
                        <div className={`p-4 text-center text-xs rounded-xl border ${
                          composeTheme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                        }`}>
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mx-auto mb-1" />
                          <span>Loading verified records from server...</span>
                        </div>
                      ) : attendanceLogs.length === 0 ? (
                        <div className={`p-3 text-center text-xs rounded-xl border ${
                          composeTheme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                        }`}>
                          No logs found.
                        </div>
                      ) : (
                        attendanceLogs.map(item => {
                          const isExpanded = expandedLogId === item.id;
                          const statusColor =
                            item.statusCode === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : item.statusCode === 'LATE'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : item.statusCode === 'HALF_DAY'
                              ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                              : item.statusCode === 'WEEKLY_OFF'
                              ? 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/30';

                          return (
                            <div
                              key={item.id}
                              onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                              className={`border rounded-xl p-2.5 transition-colors cursor-pointer ${
                                composeTheme === 'dark'
                                  ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 text-white'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                              }`}
                            >
                              {/* Top Bar: Date & Status */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    item.statusCode === 'PRESENT' ? 'bg-emerald-400' :
                                    item.statusCode === 'LATE' ? 'bg-amber-400' :
                                    item.statusCode === 'HALF_DAY' ? 'bg-sky-400' : 'bg-slate-400'
                                  }`} />
                                  <span className={`text-xs font-bold ${
                                    composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>{item.formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.syncStatus === 'PENDING_SYNC' ? (
                                    <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                      <Clock className="w-2 h-2" />
                                      PENDING SYNC
                                    </span>
                                  ) : (
                                    <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                                      composeTheme === 'dark'
                                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                      ROOM
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusColor}`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              {/* Time Row */}
                              <div className={`mt-2 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs ${
                                composeTheme === 'dark' ? 'bg-slate-950/70' : 'bg-slate-100/90'
                              }`}>
                                <div>
                                  <span className={`text-[9px] uppercase block font-semibold ${
                                    composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>Check-In</span>
                                  <span className="font-mono font-bold text-emerald-500">{item.checkIn}</span>
                                </div>
                                <ArrowRight className={`w-3.5 h-3.5 ${composeTheme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
                                <div>
                                  <span className={`text-[9px] uppercase block font-semibold ${
                                    composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>Check-Out</span>
                                  <span className={`font-mono font-bold ${item.checkOut !== '--:--' ? 'text-rose-500' : composeTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {item.checkOut}
                                  </span>
                                </div>
                                {item.workingHours && (
                                  <div className="text-right">
                                    <span className={`text-[9px] uppercase block font-semibold ${
                                      composeTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                    }`}>Hours</span>
                                    <span className={`font-mono text-[10px] font-semibold ${
                                      composeTheme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
                                    }`}>{item.workingHours}</span>
                                  </div>
                                )}
                              </div>

                              {/* Expandable Details */}
                              {isExpanded && (
                                <div className={`mt-2 pt-2 border-t text-[10px] space-y-1 p-2 rounded-lg ${
                                  composeTheme === 'dark'
                                    ? 'border-slate-800/80 text-slate-400 bg-slate-950/40'
                                    : 'border-slate-200 text-slate-600 bg-slate-50'
                                }`}>
                                  <div className="flex justify-between">
                                    <span>Log ID:</span>
                                    <span className="font-mono">{item.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Verification:</span>
                                    <span className="text-emerald-500 font-medium">{item.verificationType}</span>
                                  </div>
                                  {item.checkInLocation && (
                                    <div className="flex justify-between">
                                      <span>In Location:</span>
                                      <span className="text-blue-500">{item.checkInLocation}</span>
                                    </div>
                                  )}
                                  {item.checkOutLocation && (
                                    <div className="flex justify-between">
                                      <span>Out Location:</span>
                                      <span className="text-rose-500">{item.checkOutLocation}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* School Rules Footer */}
                  <div className="mt-auto pt-3">
                    <div className={`border rounded-xl p-2.5 text-[10px] space-y-1 ${
                      composeTheme === 'dark'
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                    }`}>
                      <div className={`flex items-center justify-between font-semibold ${
                        composeTheme === 'dark' ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <span>Kids Vatika Campus</span>
                        <span className="text-blue-500">Lat: 30.6391, Lng: 76.8182</span>
                      </div>
                      <p>• Geofence radius: 120m • Max accuracy: 150m</p>
                      <p>• Anti-spoofing dynamic camera prompt active</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ROUTE 3: ATTENDANCE & CAMERAX LIVENESS SCREEN */}
              {currentRoute === 'attendance' && (
                <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
                  {/* Step 1: Checking GPS Location */}
                  {attendanceStep === 'checking_gps' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-cyan-400 animate-pulse" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Verifying GPS Location</h3>
                      <p className="text-xs text-slate-400 max-w-[240px]">
                        Checking high-accuracy coordinates against Kids Vatika 120m campus boundary...
                      </p>
                      <div className="mt-4 text-xs font-mono bg-slate-900 px-3 py-1 rounded-full text-cyan-300 border border-slate-800">
                        GPS Accuracy: {currentLocation.accuracy}m
                      </div>
                    </div>
                  )}

                  {/* Step 2: Requesting Challenge Token */}
                  {attendanceStep === 'requesting_challenge' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Requesting Security Challenge</h3>
                      <p className="text-xs text-slate-400 max-w-[240px]">
                        Generating anti-spoofing dynamic liveness challenge from server...
                      </p>
                    </div>
                  )}

                  {/* Step 2.5: Hardware Authentication & BiometricPrompt Verification Gate */}
                  {attendanceStep === 'biometric_verification' && (
                    <div className="flex-1 flex flex-col items-center justify-between p-6 bg-slate-950 text-white relative">
                      <div className="w-full text-center pt-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Android BiometricPrompt</span>
                        </div>
                        <h3 className="text-base font-bold text-white">Hardware Authentication</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-[270px] mx-auto leading-relaxed">
                          StrongBox TEE KeyStore verification required before activating the live attendance selfie camera.
                        </p>
                      </div>

                      {/* Fingerprint / Biometric Sensor Area */}
                      <div className="flex flex-col items-center my-auto">
                        <button
                          onClick={handleSimulateBiometricSuccess}
                          className={`w-28 h-28 rounded-full flex items-center justify-center relative transition-all duration-300 ${
                            biometricFeedback === 'scanning'
                              ? 'bg-cyan-950/80 border-2 border-cyan-400 scale-105 shadow-[0_0_35px_rgba(6,182,212,0.4)]'
                              : biometricFeedback === 'success'
                              ? 'bg-emerald-950/80 border-2 border-emerald-400 scale-105 shadow-[0_0_35px_rgba(34,197,94,0.4)]'
                              : biometricFeedback === 'failed'
                              ? 'bg-rose-950/80 border-2 border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.4)]'
                              : 'bg-slate-900 border-2 border-slate-700 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95'
                          }`}
                        >
                          {biometricFeedback === 'scanning' && (
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                          )}
                          <Fingerprint
                            className={`w-14 h-14 transition-colors ${
                              biometricFeedback === 'success'
                                ? 'text-emerald-400'
                                : biometricFeedback === 'failed'
                                ? 'text-rose-400'
                                : biometricFeedback === 'scanning'
                                ? 'text-cyan-300 animate-pulse'
                                : 'text-cyan-400'
                            }`}
                          />
                        </button>

                        <div className="mt-4 text-center">
                          <span className="text-xs font-semibold text-slate-200 block">
                            {staffUser?.name || 'Pooja Sharma'} ({staffUser?.staff_code || 'KV-STAFF-102'})
                          </span>
                          <span className="text-[11px] text-cyan-400 font-mono mt-0.5 block">
                            {biometricFeedback === 'scanning'
                              ? 'Reading fingerprint sensor...'
                              : biometricFeedback === 'success'
                              ? 'Biometric Verified! Opening Camera...'
                              : biometricFeedback === 'failed'
                              ? (biometricErrorMessage || 'Fingerprint Mismatch')
                              : 'Touch Fingerprint Sensor'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="w-full space-y-2 pb-2">
                        <button
                          onClick={handleSimulateBiometricSuccess}
                          className="w-full py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-98"
                        >
                          <Fingerprint className="w-4 h-4" />
                          <span>Scan Fingerprint / Face</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleSimulateBiometricMismatch}
                            className="py-2 px-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 hover:text-rose-300 hover:border-rose-900 transition-colors"
                          >
                            Simulate Mismatch
                          </button>
                          <button
                            onClick={() => {
                              setAttendanceStep('idle');
                              setCurrentRoute('dashboard');
                            }}
                            className="py-2 px-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: CameraX Preview with Face Cutout Overlay */}
                  {attendanceStep === 'camera_active' && (
                    <div className="flex-1 flex flex-col justify-between relative bg-black">
                      {/* Video / Simulator Viewport */}
                      <div className="absolute inset-0 z-0">
                        {useRealCamera ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform -scale-x-100"
                          />
                        ) : (
                          // Interactive Simulated Camera
                          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Scanning Grid Background */}
                            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                            
                            {/* Simulated Face Outline */}
                            <div
                              className={`w-44 h-56 rounded-full border-2 border-dashed border-cyan-400/60 flex flex-col items-center justify-center relative transition-transform duration-300 ${
                                headPose === 'left' ? '-translate-x-6' : headPose === 'smile' ? 'scale-105' : ''
                              }`}
                            >
                              {/* Eyeballs / Expression */}
                              <div className="flex gap-10 mb-4">
                                <div className={`w-4 h-4 rounded-full bg-cyan-300 ${headPose === 'blink' ? 'scale-y-[0.1]' : ''}`} />
                                <div className={`w-4 h-4 rounded-full bg-cyan-300 ${headPose === 'blink' ? 'scale-y-[0.1]' : ''}`} />
                              </div>
                              {/* Nose */}
                              <div className="w-2 h-6 bg-cyan-500/60 rounded-full mb-3" />
                              {/* Mouth */}
                              <div
                                className={`w-12 h-4 border-b-2 border-cyan-300 rounded-b-full transition-all ${
                                  headPose === 'smile' ? 'scale-125 border-emerald-400' : ''
                                }`}
                              />

                              <span className="absolute -bottom-8 text-[10px] text-cyan-400/80 font-mono tracking-wider">
                                SIMULATED FRONT CAM
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CIRCULAR FACE CUTOUT OVERLAY */}
                      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                        {/* Semi-transparent Dark Mask with Circular Transparent Cutout */}
                        <div className="relative w-full h-full">
                          <svg className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                              <mask id="faceHole">
                                <rect width="100%" height="100%" fill="white" />
                                <circle cx="50%" cy="42%" r="130" fill="black" />
                              </mask>
                            </defs>
                            <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.75)" mask="url(#faceHole)" />
                          </svg>

                          {/* Glowing Animated Circular Border */}
                          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full border-4 border-emerald-400 shadow-[0_0_25px_rgba(34,197,94,0.4)] pointer-events-none animate-pulse" />
                          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[285px] h-[285px] rounded-full border border-emerald-400/30 pointer-events-none" />
                        </div>
                      </div>

                      {/* Dynamic Action Required Banner on TOP */}
                      <div className="relative z-20 pt-4 px-4 flex flex-col items-center">
                        <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-3 shadow-xl text-center max-w-[320px] w-full backdrop-blur-md">
                          <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Anti-Spoofing Liveness</span>
                          </div>
                          <div className="text-base font-extrabold text-white tracking-wide">
                            {challengeData?.action || 'BLINK TWICE'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-2">
                            <span>Fit face inside circle</span>
                            <span>•</span>
                            <span className={secondsRemaining <= 10 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                              Expires in {secondsRemaining}s
                            </span>
                          </div>
                        </div>

                        {/* Interactive Gesture Buttons when in Simulated Mode */}
                        {!useRealCamera && (
                          <div className="mt-2 flex gap-1.5">
                            <button
                              onClick={() => setHeadPose('left')}
                              className="text-[10px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-700"
                            >
                              Turn Left
                            </button>
                            <button
                              onClick={() => setHeadPose('blink')}
                              className="text-[10px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-700"
                            >
                              Blink
                            </button>
                            <button
                              onClick={() => setHeadPose('smile')}
                              className="text-[10px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-700"
                            >
                              Smile
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bottom Controls */}
                      <div className="relative z-20 pb-8 px-6 flex items-center justify-between">
                        {/* Cancel Button */}
                        <button
                          onClick={() => {
                            setAttendanceStep('idle');
                            setCurrentRoute('dashboard');
                          }}
                          className="w-12 h-12 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-lg"
                          title="Cancel"
                        >
                          ✕
                        </button>

                        {/* Camera Shutter Capture Button */}
                        <button
                          onClick={handleCaptureAndPunch}
                          className="w-18 h-18 rounded-full bg-white p-1 shadow-2xl active:scale-95 transition-transform flex items-center justify-center ring-4 ring-emerald-500/50"
                        >
                          <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white">
                            <Camera className="w-7 h-7" />
                          </div>
                        </button>

                        {/* Camera Mode Toggle (Webcam vs Simulator) */}
                        <button
                          onClick={() => setUseRealCamera(!useRealCamera)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-lg transition-colors ${
                            useRealCamera
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'bg-slate-800/90 border-slate-700 text-cyan-400'
                          }`}
                          title={useRealCamera ? 'Using Physical Webcam' : 'Using Animated Simulator'}
                        >
                          <Video className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Submitting Punch */}
                  {attendanceStep === 'submitting' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-400 animate-spin flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Encoding & Submitting Punch</h3>
                      <p className="text-xs text-slate-400 max-w-[240px]">
                        Compressing JPEG (800x800) • Base64 Encoding • Transmitting to Kids Vatika Backend...
                      </p>
                    </div>
                  )}

                  {/* Step 5: Success Result Dialog / Screen */}
                  {attendanceStep === 'result' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                      <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 shadow-lg ${
                        resultData?.isOffline
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-amber-500/20'
                          : 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-emerald-500/20'
                      }`}>
                        {resultData?.isOffline ? (
                          <Database className="w-10 h-10 stroke-[2.5]" />
                        ) : (
                          <Check className="w-10 h-10 stroke-[3]" />
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white mb-1 tracking-tight">
                        {resultData?.isOffline
                          ? 'OFFLINE PUNCH SAVED'
                          : isCheckInResult
                          ? 'CHECK-IN RECORDED!'
                          : 'CHECK-OUT RECORDED!'}
                      </h3>
                      <p className="text-xs text-slate-300 mb-4 px-2 leading-relaxed">
                        {resultData?.message}
                      </p>

                      {/* Detail Card */}
                      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Staff Member</span>
                          <span className="text-white font-semibold">{staffUser?.name || 'Authorized Staff'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Recorded Time</span>
                          <span className="text-cyan-300 font-mono font-semibold">
                            {resultData?.punch_time || timeString}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Persistence</span>
                          <span className={`font-semibold flex items-center gap-1 ${resultData?.isOffline ? 'text-amber-400' : 'text-emerald-400'}`}>
                            <Database className="w-3 h-3" />
                            {resultData?.isOffline ? 'Room Database (Offline)' : 'Live Server + Room DB'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sync Status</span>
                          <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            resultData?.isOffline
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {resultData?.isOffline ? 'PENDING_SYNC (WorkManager)' : 'SYNCED (Live)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Proximity to School</span>
                          <span className="text-emerald-400 font-semibold">
                            {resultData?.distance_metres !== undefined
                              ? `${resultData.distance_metres}m (Inside 120m)`
                              : 'Inside Campus (24m)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Punch Reference</span>
                          <span className="text-slate-200 font-mono text-[11px]">
                            {resultData?.attendance_id || 'KV-ATT-84920'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setAttendanceStep('idle');
                          setCurrentRoute('dashboard');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-600/30"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  )}

                  {/* Step 6: Attendance Error / Rejection Screen */}
                  {attendanceStep === 'error' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                      <div className="w-18 h-18 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-9 h-9 text-rose-400" />
                      </div>
                      <h3 className="text-base font-bold text-rose-400 mb-1">Attendance Rejected</h3>
                      <p className="text-xs text-slate-300 mb-6 bg-slate-900 border border-slate-800 p-3 rounded-xl leading-relaxed">
                        {attendanceError || 'Validation failed against Kids Vatika security criteria.'}
                      </p>

                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => {
                            setAttendanceStep('idle');
                            setCurrentRoute('dashboard');
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={handleStartCheckIn}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/30"
                        >
                          Retry Punch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ROUTE 4: GOOGLE ML KIT QR SCANNER SCREEN (Jetpack Compose Viewport + Laser Overlay + Torch) */}
              {currentRoute === 'qr_scanner' && (
                <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden select-none">
                  {/* Torch / Flash Ambient Glow Simulation */}
                  {isTorchOn && (
                    <div className="absolute inset-0 pointer-events-none z-10 bg-radial from-amber-300/25 via-amber-400/5 to-transparent animate-pulse" />
                  )}

                  {/* Top Bar Controls */}
                  <div className="relative z-20 pt-8 pb-3 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                    <button
                      type="button"
                      onClick={() => {
                        setQrDebounceLocked(false);
                        setCurrentRoute('dashboard');
                      }}
                      className="w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                      title="Back to Dashboard"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 flex items-center gap-1.5 shadow-lg shadow-cyan-950/50">
                      <ScanLine className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black tracking-wider text-cyan-300">
                        ML KIT QR SCANNER
                      </span>
                    </div>

                    {/* Torch Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsTorchOn(!isTorchOn)}
                      className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
                        isTorchOn
                          ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/50 scale-105'
                          : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white'
                      }`}
                      title={isTorchOn ? 'Turn Flash Off' : 'Turn Flash On'}
                    >
                      <Flashlight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* CameraX Viewfinder & Animated Laser Overlay Area */}
                  <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
                    {/* Simulated Background Camera Texture */}
                    <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black flex items-center justify-center opacity-90">
                      <div className="w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                    </div>

                    {/* QR Viewport Frame (220px x 220px) */}
                    <div className="relative w-56 h-56 rounded-3xl z-20 flex items-center justify-center shadow-2xl">
                      {/* Dark Vignette outside frame */}
                      <div className="absolute inset-0 border-2 border-cyan-400/40 rounded-3xl bg-slate-950/20 backdrop-blur-[1px]" />

                      {/* Corner Reticles */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl shadow-[0_0_10px_#22d3ee]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl shadow-[0_0_10px_#22d3ee]" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl shadow-[0_0_10px_#22d3ee]" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-2xl shadow-[0_0_10px_#22d3ee]" />

                      {/* Animated Laser Scanline */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-bounce duration-1000" />

                      {/* Center Target Indicator */}
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <div className="w-20 h-20 bg-white p-2 rounded-xl shadow-lg flex flex-col items-center justify-center relative group">
                          <QrCode className="w-16 h-16 text-slate-900" />
                          {isScanningQr && (
                            <div className="absolute inset-0 bg-cyan-500/30 rounded-xl flex items-center justify-center backdrop-blur-xs">
                              <Sparkles className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-cyan-300 mt-2 tracking-wider">
                          {selectedCampusQr.gateCode}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="relative z-20 mt-4 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Align school gate QR code inside reticle</span>
                    </div>
                  </div>

                  {/* Bottom Control Drawer: Campus Targets & Scanner Dispatch */}
                  <div className="relative z-20 bg-slate-900/95 border-t border-slate-800 p-4 rounded-t-3xl backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Campus QR Checkpoints
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 font-bold">
                        Barcode.FORMAT_QR_CODE
                      </span>
                    </div>

                    {/* Checkpoint Target Selector */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {CAMPUS_QR_TARGETS.map(target => {
                        const isSelected = selectedCampusQr.id === target.id;
                        return (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => {
                              setSelectedCampusQr(target);
                              setQrDebounceLocked(false);
                            }}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              isSelected
                                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-950/60'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="text-[10px] font-bold block truncate">{target.name}</span>
                            <span className="text-[8px] font-mono text-cyan-400 block truncate">{target.gateCode}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Checkpoint Info */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="text-[11px] font-bold text-white block truncate">{selectedCampusQr.name}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{selectedCampusQr.locationTag}</span>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                        IN GEOFENCE
                      </span>
                    </div>

                    {/* Scan QR Code Trigger Button */}
                    <button
                      type="button"
                      disabled={isScanningQr}
                      onClick={() => handleTriggerQrScan(selectedCampusQr)}
                      className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {isScanningQr ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Processing ML Kit Barcode Analyzer...</span>
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                          <span>Simulate ML Kit Scan & Biometric Gate</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* QR Scan Result Modal */}
                  {qrScanResultData && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="w-full max-w-[320px] bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>

                        <div>
                          <h3 className="text-base font-black text-white tracking-wide">
                            QR CHECK-IN RECORDED!
                          </h3>
                          <p className="text-xs text-slate-300 mt-1 font-medium">
                            {qrScanResultData.message}
                          </p>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-left space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Punch Time:</span>
                            <span className="font-mono font-bold text-emerald-400">{qrScanResultData.punch_time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Campus Gate:</span>
                            <span className="font-semibold text-white truncate max-w-[170px]">{qrScanResultData.gateName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Attendance ID:</span>
                            <span className="font-mono text-cyan-300">{qrScanResultData.attendance_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Security Gate:</span>
                            <span className="text-emerald-400 font-bold">Biometric Strong ✓</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setQrScanResultData(null);
                            setQrDebounceLocked(false);
                            setCurrentRoute('dashboard');
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-700/30"
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ROUTE 5: PRINCIPAL & MANAGEMENT EXECUTIVE DASHBOARD (RBAC Gated) */}
              {currentRoute === 'admin_dashboard' && (
                <div className={`flex-1 flex flex-col p-4 ${
                  composeTheme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
                } transition-colors duration-200 overflow-y-auto custom-scrollbar relative`}>
                  {/* Executive Top Header */}
                  <div className={`flex items-center justify-between pb-3 border-b ${
                    composeTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-black text-xs shadow-sm">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className={`text-xs font-bold leading-tight ${
                            composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>Campus Management</h2>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {staffUser?.role || 'PRINCIPAL'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {staffUser?.name || 'Dr. Rajesh Verma'} • Executive Portal
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Broadcast Circular Button */}
                      <button
                        type="button"
                        onClick={() => setShowBroadcastModal(true)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                        title="Broadcast Immediate Notice (FCM Push)"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                      </button>

                      {/* Theme Toggle */}
                      <button
                        type="button"
                        onClick={() => setComposeTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          composeTheme === 'dark'
                            ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                            : 'bg-white hover:bg-slate-50 text-indigo-700 border-slate-300'
                        }`}
                        title="Toggle Theme"
                      >
                        {composeTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      </button>

                      {/* Switch to Personal Staff Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentRoute('dashboard');
                          loadAttendanceLogs(staffUser?.staff_id || 101);
                        }}
                        className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-cyan-400 border border-blue-500/30 transition-colors"
                        title="Switch to Personal Staff Dashboard"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={() => {
                          setStaffUser(null);
                          setCurrentRoute('login');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Sign Out"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Offline / Cache Banner */}
                  {isRosterOffline && (
                    <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3 text-amber-400" />
                        <span>Room Database: Displaying offline cached campus roster</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => loadCampusRoster(true)}
                        className="underline font-bold text-amber-400 hover:text-amber-300"
                      >
                        Retry Sync
                      </button>
                    </div>
                  )}

                  {/* METRIC BANNER: Real-Time Campus Occupancy */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>Campus Live Occupancy</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {dateString || 'Today'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <div className={`p-2 rounded-2xl border text-center ${
                        composeTheme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                        <span className="text-base font-black text-cyan-400">{rosterSummary.total}</span>
                      </div>
                      <div className={`p-2 rounded-2xl border text-center ${
                        composeTheme === 'dark' ? 'bg-emerald-950/40 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <span className="text-[10px] text-emerald-500 block font-medium">Present</span>
                        <span className="text-base font-black text-emerald-400">{rosterSummary.present}</span>
                      </div>
                      <div className={`p-2 rounded-2xl border text-center ${
                        composeTheme === 'dark' ? 'bg-amber-950/40 border-amber-800/40' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <span className="text-[10px] text-amber-500 block font-medium">Late</span>
                        <span className="text-base font-black text-amber-400">{rosterSummary.late}</span>
                      </div>
                      <div className={`p-2 rounded-2xl border text-center ${
                        composeTheme === 'dark' ? 'bg-rose-950/40 border-rose-800/40' : 'bg-rose-50 border-rose-200'
                      }`}>
                        <span className="text-[10px] text-rose-500 block font-medium">Absent</span>
                        <span className="text-base font-black text-rose-400">{rosterSummary.absent}</span>
                      </div>
                    </div>
                  </div>

                  {/* QUICK FILTER CHIPS (All, Present, Late, Absent, Leaves) */}
                  <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {(['ALL', 'PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE'] as const).map(chip => {
                      const isSelected = rosterFilter === chip;
                      const label = chip === 'ALL' ? 'All Staff' : chip === 'ON_LEAVE' ? 'On Leave' : chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setRosterFilter(chip)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-500 shadow-xs shadow-purple-900/40'
                              : composeTheme === 'dark'
                              ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* SEARCH BAR & SWIPE/POLL REFRESH */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={rosterSearch}
                        onChange={e => setRosterSearch(e.target.value)}
                        placeholder="Search by staff name or dept..."
                        className={`w-full text-xs rounded-xl py-1.5 pl-8 pr-3 border focus:outline-none transition-colors ${
                          composeTheme === 'dark'
                            ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-purple-400'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-600'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => loadCampusRoster(true)}
                      disabled={isRosterRefreshing}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Refresh Campus Roster"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRosterRefreshing ? 'animate-spin text-purple-400' : ''}`} />
                    </button>
                  </div>

                  {/* STAFF ATTENDANCE CARDS LIST */}
                  <div className="mt-3 space-y-2 flex-1 pb-16">
                    {(() => {
                      const filtered = campusRoster.filter(staff => {
                        const matchesFilter =
                          rosterFilter === 'ALL' || staff.punchStatus === rosterFilter;
                        const q = rosterSearch.toLowerCase();
                        const matchesSearch =
                          !q ||
                          staff.name.toLowerCase().includes(q) ||
                          staff.department.toLowerCase().includes(q) ||
                          staff.designation.toLowerCase().includes(q) ||
                          staff.staffCode.toLowerCase().includes(q);
                        return matchesFilter && matchesSearch;
                      });

                      if (isRosterLoading) {
                        return (
                          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                            <span className="text-xs">Fetching Campus Attendance Roster...</span>
                          </div>
                        );
                      }

                      if (filtered.length === 0) {
                        return (
                          <div className="py-10 text-center text-slate-400 text-xs">
                            No staff found matching current criteria.
                          </div>
                        );
                      }

                      return filtered.map(staff => {
                        const isPresent = staff.punchStatus === 'PRESENT';
                        const isLate = staff.punchStatus === 'LATE';
                        const isAbsent = staff.punchStatus === 'ABSENT';
                        const isOnLeave = staff.punchStatus === 'ON_LEAVE';

                        return (
                          <div
                            key={staff.staffId}
                            className={`p-3 rounded-2xl border transition-all ${
                              composeTheme === 'dark'
                                ? 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                                : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              {/* Left Profile Avatar & Name */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  isPresent
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isLate
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : isAbsent
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-blue-500/20 text-cyan-400 border border-blue-500/30'
                                }`}>
                                  {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className={`text-xs font-bold truncate ${
                                      composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                                    }`}>
                                      {staff.name}
                                    </h4>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {staff.staffCode}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {staff.designation} • {staff.department}
                                  </p>
                                </div>
                              </div>

                              {/* Right Status Badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex-shrink-0 border ${
                                isPresent
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isLate
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : isAbsent
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : 'bg-blue-500/10 text-cyan-400 border-blue-500/30'
                              }`}>
                                {staff.punchStatus.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Punch Details Strip */}
                            {(staff.checkInTime || staff.verificationMode) && (
                              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-cyan-400" />
                                  <span>In: <strong className="text-slate-200">{staff.checkInTime}</strong></span>
                                </div>
                                {staff.checkInDistanceMetres !== null && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-emerald-400" />
                                    <span>{staff.checkInDistanceMetres}m from gate</span>
                                  </div>
                                )}
                                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {staff.verificationMode || 'Biometric'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    })()}
                  </div>

                  {/* FLOATING ACTION BUTTON: APPROVAL QUEUE */}
                  <div className="absolute bottom-4 right-4 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentRoute('approval_queue');
                        loadPendingApprovals();
                      }}
                      className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-900/50 flex items-center gap-2 active:scale-95 transition-all group"
                    >
                      <Inbox className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
                      <span>Approval Engine</span>
                      {pendingApprovals.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border border-rose-300">
                          {pendingApprovals.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ROUTE 6: APPROVAL QUEUE SCREEN (Leave & Regularization Engine) */}
              {currentRoute === 'approval_queue' && (
                <div className={`flex-1 flex flex-col p-4 ${
                  composeTheme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
                } transition-colors duration-200 overflow-y-auto custom-scrollbar relative`}>
                  {/* Top Header */}
                  <div className={`flex items-center justify-between pb-3 border-b ${
                    composeTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentRoute('admin_dashboard')}
                        className="p-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
                        title="Back to Campus Management"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <div>
                        <h2 className={`text-xs font-bold leading-tight ${
                          composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>Leave & Regularization Engine</h2>
                        <span className="text-[10px] text-purple-400 font-medium">
                          Executive Approval Queue ({pendingApprovals.length} Pending)
                        </span>
                      </div>
                    </div>

                    {queuedApprovalsCount > 0 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-amber-400" />
                        <span>{queuedApprovalsCount} Queued</span>
                      </span>
                    )}
                  </div>

                  {/* Notification / Banner */}
                  {approvalsBannerMsg && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>{approvalsBannerMsg}</span>
                    </div>
                  )}

                  {/* List of Pending Requests */}
                  <div className="mt-3 space-y-3 flex-1 pb-6">
                    {isApprovalsLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                        <span className="text-xs">Loading Pending Requests...</span>
                      </div>
                    ) : pendingApprovals.length === 0 ? (
                      <div className="py-14 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                          <CheckCheck className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-bold text-white">All Caught Up!</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                          Zero pending leave applications or punch regularizations awaiting administrative review.
                        </p>
                        <button
                          type="button"
                          onClick={() => setCurrentRoute('admin_dashboard')}
                          className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                        >
                          Return to Campus Roster
                        </button>
                      </div>
                    ) : (
                      pendingApprovals.map(item => {
                        const isLeave = item.requestType === 'LEAVE_APPLICATION';
                        return (
                          <div
                            key={item.approvalId}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              composeTheme === 'dark'
                                ? 'bg-slate-900/90 border-slate-800 shadow-md'
                                : 'bg-white border-slate-200 shadow-xs'
                            }`}
                          >
                            {/* Request Header */}
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                isLeave
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              }`}>
                                {isLeave ? 'Leave Application' : 'Missed Punch Regularization'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.approvalId}
                              </span>
                            </div>

                            {/* Staff Member & Date */}
                            <div className="mb-2">
                              <h4 className={`text-xs font-bold ${
                                composeTheme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {item.staffName} ({item.staffCode})
                              </h4>
                              <p className="text-[11px] text-purple-300/90 font-medium mt-0.5">
                                Period: {item.dateRangeOrPunchDate}
                              </p>
                            </div>

                            {/* Reason Box */}
                            <div className={`p-2 rounded-xl text-xs leading-relaxed mb-3 border ${
                              composeTheme === 'dark'
                                ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              "{item.reason}"
                            </div>

                            {/* Emerald Approve / Crimson Reject Dual Actions */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setApprovalTarget({ item, decision: 'REJECTED' });
                                  setRejectionRemarks('');
                                  setShowRemarksModal(true);
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  // Prompt executive biometric confirmation before critical approval
                                  setApprovalTarget({ item, decision: 'APPROVED' });
                                  setShowBiometricApprovalModal(true);
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 active:scale-95 transition-all"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Approve</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* MODAL 1: BROADCAST CIRCULAR NOTICE (Principal Priority Push Alert) */}
              {showBroadcastModal && (
                <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white">Broadcast School Circular</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBroadcastModal(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-300 font-semibold block mb-1">Target Staff</label>
                        <select
                          value={broadcastDept}
                          onChange={e => setBroadcastDept(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="ALL">All School Staff (All Wings)</option>
                          <option value="PRIMARY">Primary Wing Teachers</option>
                          <option value="SECONDARY">Secondary Wing Faculty</option>
                          <option value="ADMIN">Administrative Staff Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 font-semibold block mb-1">Notice Title</label>
                        <input
                          type="text"
                          value={broadcastTitle}
                          onChange={e => setBroadcastTitle(e.target.value)}
                          placeholder="e.g. Urgent Faculty Meeting"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 font-semibold block mb-1">Notice Message Body</label>
                        <textarea
                          rows={3}
                          value={broadcastContent}
                          onChange={e => setBroadcastContent(e.target.value)}
                          placeholder="Type notice details..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                        />
                      </div>

                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>Dispatches Firebase Cloud Messaging (FCM) high-priority push alert.</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowBroadcastModal(false)}
                          className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isBroadcastingNotice}
                          onClick={handleBroadcastCircular}
                          className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 disabled:opacity-50"
                        >
                          {isBroadcastingNotice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Send Alert</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 2: BIOMETRIC CONFIRMATION FOR APPROVALS */}
              {showBiometricApprovalModal && approvalTarget && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                      <Fingerprint className="w-8 h-8" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Executive Biometric Authorization</h3>
                    <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-snug">
                      Confirm biometric credential to authorize {approvalTarget.item.requestType === 'LEAVE_APPLICATION' ? 'Leave' : 'Regularization'} for <strong>{approvalTarget.item.staffName}</strong>.
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBiometricApprovalModal(false);
                          setApprovalTarget(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBiometricApprovalModal(false);
                          executeApprovalDecision(approvalTarget.item, 'APPROVED');
                          setApprovalTarget(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-700/30"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Authorize</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 3: REJECTION REMARKS MODAL */}
              {showRemarksModal && approvalTarget && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-3">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-bold text-white">Specify Rejection Remarks</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Please enter reviewer remarks for {approvalTarget.item.staffName}:
                    </p>
                    <textarea
                      rows={3}
                      value={rejectionRemarks}
                      onChange={e => setRejectionRemarks(e.target.value)}
                      placeholder="e.g. Insufficient coverage during board examinations..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-400 resize-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRemarksModal(false);
                          setApprovalTarget(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRemarksModal(false);
                          executeApprovalDecision(
                            approvalTarget.item,
                            'REJECTED',
                            rejectionRemarks || 'Rejected by administration'
                          );
                          setApprovalTarget(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREENSHOT BLOCKED TOAST (FLAG_SECURE ENFORCEMENT) */}
              {screenshotBlockedToast && (
                <div className="absolute bottom-16 left-3 right-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="bg-slate-900/95 border border-rose-500/70 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs ring-1 ring-rose-500/40">
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold block text-[11px] text-rose-300">Screenshot Blocked by Policy</span>
                      <span className="text-[10px] text-slate-300 leading-tight block">
                        FLAG_SECURE is active. WindowManager prohibits screen capture of sensitive HRMS records.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 4: QA DEVELOPER SETTINGS DRAWER */}
              {showQaDevDrawer && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95 space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs font-bold text-white">QA Developer Settings</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQaDevDrawer(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Endpoint Switcher */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        API Routing Target
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            HrmsApiService.setMockWebServerActive(false);
                            setRoomNotice('Network switched to Live Backend');
                          }}
                          className={`py-1.5 px-2 rounded-xl border font-bold text-[10px] truncate ${
                            !HrmsApiService.getMockWebServerActive()
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          Live Server
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            HrmsApiService.setMockWebServerActive(true);
                            setRoomNotice('Network switched to MockWebServer');
                          }}
                          className={`py-1.5 px-2 rounded-xl border font-bold text-[10px] truncate ${
                            HrmsApiService.getMockWebServerActive()
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          MockWebServer
                        </button>
                      </div>
                    </div>

                    {/* Latency & Offline */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Network Latency Simulation
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {[0, 350, 1200].map(ms => (
                          <button
                            key={ms}
                            type="button"
                            onClick={() => {
                              HrmsApiService.setSimulatedLatency(ms);
                              setRoomNotice(ms === 0 ? 'Latency reset' : `Latency set to ${ms}ms`);
                            }}
                            className={`py-1 rounded-lg border font-mono font-bold ${
                              HrmsApiService.getSimulatedLatency() === ms
                                ? 'bg-cyan-600 text-white border-cyan-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {ms === 0 ? '0ms' : `${ms}ms`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* GPS Preset Pickers */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Simulate Field Coordinates
                      </label>
                      <div className="space-y-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentLocation(PRESET_LOCATIONS[0]);
                            setCustomLat(PRESET_LOCATIONS[0].latitude);
                            setCustomLng(PRESET_LOCATIONS[0].longitude);
                            setRoomNotice('Set GPS to Campus Center (0m)');
                          }}
                          className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg flex items-center justify-between text-slate-300"
                        >
                          <span>Campus Center</span>
                          <span className="text-emerald-400 font-bold font-mono">0m (VALID)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const outside = { label: 'Perimeter Breach (159m)', latitude: 30.6405, longitude: 76.818226, accuracy: 15 };
                            setCurrentLocation(outside);
                            setCustomLat(30.6405);
                            setCustomLng(76.818226);
                            setRoomNotice('Set GPS outside geofence (159m)');
                          }}
                          className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg flex items-center justify-between text-slate-300"
                        >
                          <span>Outside Boundary</span>
                          <span className="text-rose-400 font-bold font-mono">159m (REJECT)</span>
                        </button>
                      </div>
                    </div>

                    {/* FLAG_SECURE Test Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowQaDevDrawer(false);
                        setScreenshotBlockedToast(true);
                        setTimeout(() => setScreenshotBlockedToast(false), 3500);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Test FLAG_SECURE Screenshot Block</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowQaDevDrawer(false)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* BIOMETRIC APP LOCK SCREEN OVERLAY (Simulating App Launch / Resume Gate) */}
              {isAppLockedByBiometric && !showBiometricPrompt && (
                <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                  <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/60">
                    <Fingerprint className="w-10 h-10" />
                  </div>

                  <h3 className="text-base font-black text-white tracking-wide">
                    BIOMETRIC SECURITY LOCK
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                    Welcome back, {staffUser?.name || 'Staff'}. Kids Vatika HRMS requires fingerprint authentication on launch.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setBiometricGateMode('app_launch');
                      setShowBiometricPrompt(true);
                    }}
                    className="mt-6 w-full max-w-[240px] bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/40 flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Unlock with Biometrics</span>
                  </button>
                </div>
              )}

              {/* ANDROID BIOMETRICPROMPT BOTTOM SHEET MODAL */}
              {showBiometricPrompt && (
                <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
                  <div className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 shadow-2xl flex flex-col items-center">
                    {/* Handle bar */}
                    <div className="w-10 h-1 bg-slate-700 rounded-full mb-3" />

                    {/* School Branding & Title */}
                    <div className="w-full flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                        <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 tracking-wide uppercase">
                        Kids Vatika HRMS
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white self-start">
                      {biometricGateMode === 'app_launch'
                        ? 'App Launch Security Challenge'
                        : biometricGateMode === 'qr_scan'
                        ? 'Authorize QR Gate Attendance'
                        : 'Staff Biometric Verification'}
                    </h3>
                    <p className="text-[11px] text-slate-400 self-start mt-0.5 leading-snug">
                      {biometricGateMode === 'app_launch'
                        ? 'Confirm hardware biometric identity or device credentials to access staff portal.'
                        : biometricGateMode === 'qr_scan'
                        ? `Confirm biometric identity for ${detectedQrData?.name || selectedCampusQr.name} check-in.`
                        : 'Touch fingerprint sensor or authenticate to authorize attendance check-in.'}
                    </p>

                    {/* Central Biometric Sensor Touch Target */}
                    <div className="my-5 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={handleSimulateBiometricSuccess}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                          biometricFeedback === 'failed'
                            ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-400'
                            : biometricFeedback === 'success'
                            ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 scale-105'
                            : biometricFeedback === 'scanning'
                            ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 animate-pulse'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-400 text-cyan-400'
                        }`}
                        title="Touch Fingerprint Sensor"
                      >
                        {biometricFeedback === 'idle' && (
                          <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" />
                        )}
                        {biometricFeedback === 'success' ? (
                          <Check className="w-10 h-10 stroke-[3]" />
                        ) : (
                          <Fingerprint className="w-11 h-11" />
                        )}
                      </button>

                      {/* Status feedback text */}
                      <span
                        className={`text-xs font-semibold mt-2.5 ${
                          biometricFeedback === 'failed'
                            ? 'text-rose-400'
                            : biometricFeedback === 'success'
                            ? 'text-emerald-400 font-bold'
                            : biometricFeedback === 'scanning'
                            ? 'text-cyan-300'
                            : 'text-slate-300'
                        }`}
                      >
                        {biometricFeedback === 'scanning' && 'Verifying biometric signature...'}
                        {biometricFeedback === 'success' && 'Biometric Verified ✓'}
                        {biometricFeedback === 'failed' && (biometricErrorMessage || 'Fingerprint not recognized')}
                        {biometricFeedback === 'idle' && 'Touch the fingerprint sensor'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Android BiometricPrompt API (BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
                      </span>
                    </div>

                    {/* Secondary Actions: PIN / Mismatch / Cancel */}
                    <div className="w-full space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSimulateBiometricSuccess}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/40 flex items-center justify-center gap-1.5"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>Verify (Match)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulateBiometricSuccess}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5"
                          title="Simulate Device PIN / Pattern Fallback"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Use PIN</span>
                        </button>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <button
                          type="button"
                          onClick={handleSimulateBiometricMismatch}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                        >
                          Simulate Mismatch
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBiometricPrompt(false);
                            setQrDebounceLocked(false);
                            if (biometricGateMode === 'attendance_selfie') {
                              setAttendanceStep('error');
                              setAttendanceError('Biometric authentication was cancelled by staff.');
                            }
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-300 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Android Navigation Bar Indicator */}
            <div className={`h-5 w-full flex items-center justify-center transition-colors ${
              composeTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
            }`}>
              <div className={`w-28 h-1 rounded-full ${
                composeTheme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive QA & GPS Simulation Controls Panel */}
      <div className="w-full lg:w-[480px] space-y-4">

        {/* ML Kit QR & Biometric Security Controller */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 shadow-xl space-y-3.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-cyan-400" />
              <span>Google ML Kit & Biometric Security</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              v17.3.0
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Enterprise QR scanning engine powered by Google ML Kit (<code className="text-cyan-300">Barcode.FORMAT_QR_CODE</code>) coupled with lifecycle-aware <code className="text-cyan-300">BiometricSecurityManager</code> (Hardware biometric authentication + Room Database offline cache).
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setQrDebounceLocked(false);
                setDetectedQrData(null);
                setQrScanResultData(null);
                setCurrentRoute('qr_scanner');
              }}
              className="bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-md shadow-cyan-900/40 flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Open ML Kit Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAppLockedByBiometric(true);
                setBiometricGateMode('app_launch');
                setShowBiometricPrompt(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span>Lock App (Launch Gate)</span>
            </button>
          </div>

          {/* Architecture Checklist */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span>ML Kit Barcode Format:</span>
              <span className="font-mono text-cyan-300 font-semibold">Barcode.FORMAT_QR_CODE</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Biometric Security Level:</span>
              <span className="font-mono text-emerald-400 font-semibold">BIOMETRIC_STRONG | PIN</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Debounce / Thread Safety:</span>
              <span className="font-mono text-cyan-300 font-semibold">AtomicBoolean + 1500ms</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Offline Fallback:</span>
              <span className="font-mono text-emerald-400 font-semibold">Room DB + WorkManager</span>
            </div>
          </div>
        </div>

        {/* Room Database & WorkManager Offline Sync Inspector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Room Database & WorkManager</span>
            </h3>
            <button
              onClick={handleToggleNetwork}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                isNetworkOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              {isNetworkOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>ONLINE (LIVE API)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>OFFLINE (ROOM CACHE)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Local SQLite persistence using <code className="text-cyan-300">androidx.room</code> and <code className="text-cyan-300">androidx.work:work-runtime-ktx</code>. Caches user credentials and attendance logs for offline access. Offline punches are queued as <code className="text-amber-300">PENDING_SYNC</code> and automatically uploaded when network connectivity returns.
          </p>

          {/* WorkManager & Network Constraint Status Strip */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">WorkManager State:</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                workManagerStatus === WorkManagerStatus.RUNNING
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                  : workManagerStatus === WorkManagerStatus.ENQUEUED
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : workManagerStatus === WorkManagerStatus.SUCCEEDED
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : workManagerStatus === WorkManagerStatus.FAILED
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {workManagerStatus}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">Network Constraint:</span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                isNetworkOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {isNetworkOnline ? 'NetworkType.CONNECTED (Met)' : 'NetworkType.CONNECTED (Blocked)'}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block truncate">Logs</span>
              <span className="text-sm font-extrabold text-cyan-400 font-mono">{roomDbLogs.length}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block truncate">Requests</span>
              <span className="text-sm font-extrabold text-purple-400 font-mono">{roomDbRequests.length}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block truncate">Pending</span>
              <span className={`text-sm font-extrabold font-mono ${pendingSyncCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                {pendingSyncCount}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block truncate">Users</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">{roomDbStaff.length}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleNetwork}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                isNetworkOnline
                  ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
              }`}
            >
              {isNetworkOnline ? (
                <>
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Simulate Offline Mode</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Restore Network</span>
                </>
              )}
            </button>

            <button
              onClick={handleRunWorkManagerSync}
              disabled={isSyncingWorkManager}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                pendingSyncCount > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWorkManager ? 'animate-spin text-cyan-400' : 'text-blue-400'}`} />
              <span>{isSyncingWorkManager ? 'Syncing...' : 'WorkManager Sync'}</span>
            </button>
          </div>

          {/* Room Database Table Inspector Tabs */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                <span>Table Inspector</span>
              </span>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <button
                  onClick={() => setRoomDbInspectorTab('attendance')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    roomDbInspectorTab === 'attendance'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  logs ({roomDbLogs.length})
                </button>
                <button
                  onClick={() => setRoomDbInspectorTab('requests')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    roomDbInspectorTab === 'requests'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  requests ({roomDbRequests.length})
                </button>
                <button
                  onClick={() => setRoomDbInspectorTab('staff')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    roomDbInspectorTab === 'staff'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  staff ({roomDbStaff.length})
                </button>
                <button
                  onClick={() => setRoomDbInspectorTab('sync_queue')}
                  className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                    roomDbInspectorTab === 'sync_queue'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  queue ({pendingSyncCount})
                </button>
              </div>
            </div>

            {/* Tab 1: attendance_logs */}
            {roomDbInspectorTab === 'attendance' && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-[11px] custom-scrollbar">
                {roomDbLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-2">No records in SQLite attendance_logs</p>
                ) : (
                  roomDbLogs.map((log, i) => (
                    <div
                      key={log.id || i}
                      className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{log.formattedDate}</span>
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            log.syncStatus === 'PENDING_SYNC'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {log.syncStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          In: {log.checkInTime || '--'} • Out: {log.checkOutTime || '--'} • {log.checkInLocation || 'Campus'}
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-[80px]">
                        {log.id}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: cached_check_in_requests */}
            {roomDbInspectorTab === 'requests' && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-[11px] custom-scrollbar">
                {roomDbRequests.length === 0 ? (
                  <p className="text-slate-500 text-center py-2">No cached requests in SQLite cached_check_in_requests</p>
                ) : (
                  roomDbRequests.map((req, i) => (
                    <div
                      key={req.requestId || i}
                      className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-300">{req.requestId}</span>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          req.syncStatus === 'PENDING_SYNC'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {req.syncStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span>Staff: <strong className="text-white">{req.staffCode}</strong> ({req.staffId})</span>
                        <span>Punch: {req.punchTimeFormatted}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono truncate">
                        GPS: {req.latitude.toFixed(5)}, {req.longitude.toFixed(5)} ({req.distanceToSchoolMetres}m to campus) • Retries: {req.retryCount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: staff_credentials */}
            {roomDbInspectorTab === 'staff' && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-[11px] custom-scrollbar">
                {roomDbStaff.map((staff, i) => (
                  <div
                    key={staff.staffId || i}
                    className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white text-xs">{staff.name} ({staff.staffCode})</p>
                      <p className="text-[10px] text-slate-400">{staff.designation} • {staff.department}</p>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono">
                      Offline Auth Ready
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: sync_queue */}
            {roomDbInspectorTab === 'sync_queue' && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-[11px] custom-scrollbar">
                {roomDbLogs.filter(l => l.syncStatus === 'PENDING_SYNC').length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="font-medium text-slate-300">Sync Queue Clear</p>
                    <p className="text-[10px]">All offline punches are synchronized with Kids Vatika backend.</p>
                  </div>
                ) : (
                  roomDbLogs
                    .filter(l => l.syncStatus === 'PENDING_SYNC')
                    .map((pending, i) => (
                      <div
                        key={pending.id || i}
                        className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-300">{pending.id}</span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded font-bold">
                            AWAITING WORKMANAGER
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">
                          Punch Time: <strong className="text-white">{pending.checkInTime}</strong> • Date: {pending.date}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">
                          Payload: JPEG Base64 selfie + GPS coords ({pending.distanceMetres}m to school)
                        </p>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* GPS Geofence & Location Selector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Campus Geofence Simulator</span>
            </h3>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                geofenceResult.canCheckIn
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {geofenceResult.canCheckIn ? 'ALLOW PUNCH' : 'PUNCH BLOCKED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Kids Vatika School rule enforces: <strong className="text-slate-200">120m maximum radius</strong> from{' '}
            <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">30.6390703, 76.818226</code> and GPS accuracy{' '}
            <strong className="text-slate-200">&le; 150m</strong>.
          </p>

          {/* Preset Buttons */}
          <div className="space-y-2 mb-4">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Test Presets (Click to Simulate Position):
            </span>
            {PRESET_LOCATIONS.map((preset, idx) => {
              const evalRes = evaluateGeofence(preset.latitude, preset.longitude, preset.accuracy);
              const isSelected = currentLocation.label === preset.label;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentLocation(preset);
                    setCustomLat(preset.latitude);
                    setCustomLng(preset.longitude);
                    setCustomAccuracy(preset.accuracy);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium">{preset.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Distance: {evalRes.distanceMetres}m • Acc: {preset.accuracy}m
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex-shrink-0 ${
                      evalRes.canCheckIn
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {evalRes.canCheckIn ? 'Pass' : 'Reject'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Browser Real GPS Button */}
          <button
            onClick={handleUseRealBrowserGps}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors mb-3"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Acquire Device's Real GPS Coordinates</span>
          </button>

          {/* Current Evaluation Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Haversine Distance to School:</span>
              <span className={`font-bold font-mono ${geofenceResult.isWithinRadius ? 'text-emerald-400' : 'text-rose-400'}`}>
                {geofenceResult.distanceMetres} metres ({geofenceResult.isWithinRadius ? 'Within 120m' : 'Exceeds 120m'})
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>GPS Accuracy Rating:</span>
              <span className={`font-mono font-semibold ${geofenceResult.isAccuracyAcceptable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentLocation.accuracy}m ({geofenceResult.isAccuracyAcceptable ? 'Good <= 150m' : 'Rejected > 150m'})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              Evaluation: {geofenceResult.statusText}
            </p>
          </div>
        </div>

        {/* BiometricPrompt API Security Gate Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span>BiometricPrompt API Security</span>
            </h3>
            <button
              onClick={() => setEnforceBiometric(!enforceBiometric)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                enforceBiometric
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${enforceBiometric ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
              {enforceBiometric ? 'ENFORCED (ACTIVE)' : 'DISABLED (BYPASS)'}
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Integrates the official <code className="text-cyan-300">androidx.biometric:biometric</code> API as a mandatory two-factor gate. After CameraX liveness verification, staff must authenticate via hardware fingerprint or device credentials prior to check-in transmission.
          </p>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-[11px] space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-medium">Authenticator Class:</span>
              <span className="font-mono text-cyan-300">BIOMETRIC_STRONG | DEVICE_CREDENTIAL</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-medium">Activity Architecture:</span>
              <span className="font-mono text-emerald-400">FragmentActivity (Compose NavHost)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-medium">Credential Fallback:</span>
              <span className="text-slate-400">PIN / Pattern / Password</span>
            </div>
          </div>
        </div>

        {/* FCM Push Notification Simulator Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-cyan-400" />
              <span>Firebase Cloud Messaging (FCM)</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Receiver Active
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Simulates <code className="text-cyan-300">HrmsFirebaseMessagingService</code> receiving foreground/background push payloads. Sends check-in shift reminders and approval alerts directly to the device.
          </p>

          {/* FCM Registration Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-[11px] space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-medium">Device Token:</span>
              <button
                onClick={handleRegisterFcmToken}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                title="Regenerate & Re-register Token"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Rotate Token</span>
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-[10px] text-cyan-300/90 break-all select-all">
              {fcmToken}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
              <span>Channel Config:</span>
              <span className="text-slate-300">Android 8+ NotificationManagerCompat</span>
            </div>
          </div>

          {/* Quick-Fire Preset Triggers */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              1-Click Staff Push Triggers:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTriggerPush('checkin_reminder')}
                disabled={isSendingPush}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 p-2.5 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300 mb-0.5">
                  <Bell className="w-3.5 h-3.5 text-blue-400 group-hover:animate-bounce" />
                  <span>Shift Check-In Ping</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Dispatches 08:45 AM reminder with instant "Check In Now" action.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerPush('approval_alert')}
                disabled={isSendingPush}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 p-2.5 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Approval Notice</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Alerts staff of approved leave request with "View Records" action.
                </p>
              </button>
            </div>
          </div>

          {/* Custom Notification Dispatch Form */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Custom FCM Notification Composer
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Payload Type</label>
                <select
                  value={customPushType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setCustomPushType(t);
                    if (t === 'checkin_reminder') {
                      setCustomPushTitle('Kids Vatika Check-In Reminder 🏫');
                      setCustomPushBody('Good morning Amit! School gates close at 9:00 AM. Please verify your selfie punch inside the campus.');
                    } else if (t === 'approval_alert') {
                      setCustomPushTitle('Leave Request Approved ✅');
                      setCustomPushBody('Your Half-Day leave request for Sep 24 has been APPROVED by Principal Sharma.');
                    } else {
                      setCustomPushTitle('Kids Vatika HRMS Notice 📢');
                      setCustomPushBody('Special staff assembly scheduled in main auditorium tomorrow at 8:30 AM.');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-xs text-white"
                >
                  <option value="checkin_reminder">Check-In Reminder</option>
                  <option value="approval_alert">Approval Alert</option>
                  <option value="general">General Notice</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Channel</label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-xs text-slate-300 font-mono">
                  {customPushType === 'checkin_reminder' ? 'reminders_channel' : 'approvals_channel'}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Notification Title</label>
              <input
                type="text"
                value={customPushTitle}
                onChange={e => setCustomPushTitle(e.target.value)}
                placeholder="Alert Title"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Message Body</label>
              <textarea
                rows={2}
                value={customPushBody}
                onChange={e => setCustomPushBody(e.target.value)}
                placeholder="Write notification message..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleTriggerPush(customPushType, customPushTitle, customPushBody)}
              disabled={isSendingPush}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 transition-all"
            >
              {isSendingPush ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to FCM...</span>
                </>
              ) : (
                <>
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Dispatch FCM Push to Emulator</span>
                </>
              )}
            </button>
          </div>

          {/* FCM Message Delivery History */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Recent Push Messages ({pushNotificationHistory.length}):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {pushNotificationHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                    <p className="text-slate-400 truncate">{item.body}</p>
                    <span className="text-[9px] text-cyan-400 font-mono mt-0.5 block">
                      Channel: {item.channelId} • DeepLink: {item.deepLink}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl text-xs space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Spoofing & Device Binding</span>
          </h3>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              <div>
                <strong className="text-slate-200">Device Hardware ID Binding:</strong>
                <p className="text-slate-400 text-[11px]">
                  Uses <code className="text-cyan-300">Settings.Secure.ANDROID_ID</code> with SHA-256 hardware salt to prohibit staff from punching in on other phones or emulation proxies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              <div>
                <strong className="text-slate-200">Front Camera Enforcement:</strong>
                <p className="text-slate-400 text-[11px]">
                  CameraX is strictly bound to <code className="text-cyan-300">DEFAULT_FRONT_CAMERA</code>. Gallery photo uploads are prohibited in code.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              <div>
                <strong className="text-slate-200">Dynamic Liveness Tokens:</strong>
                <p className="text-slate-400 text-[11px]">
                  Dynamic action tokens (<code className="text-cyan-300">TURN HEAD LEFT</code>, <code className="text-cyan-300">BLINK TWICE</code>) expire in 60 seconds to prevent replay attacks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              <div>
                <strong className="text-slate-200">BiometricPrompt Two-Factor Gate:</strong>
                <p className="text-slate-400 text-[11px]">
                  Authenticates staff with Android BiometricPrompt (Fingerprint or Face) before final payload encryption and submission.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">5.</span>
              <div>
                <strong className="text-slate-200">Optimized Payload:</strong>
                <p className="text-slate-400 text-[11px]">
                  Selfies are scaled to max 800x800, compressed to JPEG at 80% quality, and encoded as Base64 (NO_WRAP).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
