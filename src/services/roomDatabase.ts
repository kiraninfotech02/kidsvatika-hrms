/**
 * Simulated Android Room Database & WorkManager Offline Sync Engine
 * Represents androidx.room (RoomDatabase, DAO, Entities) & androidx.work (WorkManager)
 * for Kids Vatika Smart School HRMS.
 */

export interface StaffCredentialEntity {
  staffId: number;
  staffCode: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
  authToken: string;
  passwordHash: string; // SHA-256 encrypted credential for offline auth
  lastLoginTimestamp: number;
}

export type SyncStatus = 'SYNCED' | 'PENDING_SYNC' | 'FAILED';

export interface CachedCampusRosterEntity {
  staffId: number;
  staffCode: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  punchStatus: string;
  checkInTime: string | null;
  checkInDistanceMetres: number | null;
  verificationMode: string | null;
  selfieUrl: string | null;
  rosterDate: string;
  cachedAtTimestamp: number;
}

export interface QueuedApprovalActionEntity {
  approvalId: string;
  requestType: string;
  decision: string;
  reviewerRemarks?: string;
  staffName: string;
  actionTimestamp: number;
  syncStatus: SyncStatus;
  retryCount: number;
}

export interface CheckInRequestEntity {
  requestId: string; // e.g. "REQ-1727100000-KV102"
  staffId: number;
  staffCode: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceToSchoolMetres: number;
  challengeToken: string;
  selfieImageBase64: string; // Base64 JPEG captured via CameraX
  punchTimestamp: number;
  punchTimeFormatted: string; // e.g. "08:45 AM"
  punchDateFormatted: string; // e.g. "Wed, 23 Sep 2026"
  syncStatus: SyncStatus;
  retryCount: number;
  lastErrorMessage?: string;
  lastSyncAttemptTime?: number;
}

export interface AttendanceLogEntity {
  id: string; // e.g. "ATT-20260923-01" or local "LOCAL-PUNCH-1727100000"
  staffId: number;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  checkInTime: string;
  checkOutTime: string;
  status: string; // "Present", "Late Arrival", "Half Day"
  statusCode: string; // "PRESENT", "LATE", "HALF_DAY"
  workingHours: string;
  verificationType: string;
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  distanceMetres?: number;
  gpsAccuracy?: number;
  // Offline & Room Sync metadata
  syncStatus: SyncStatus;
  offlineCreatedTimestamp: number;
  selfieBase64?: string; // Captured CameraX selfie pending sync upload
  offlineDeviceId?: string;
  offlineChallengeToken?: string;
  lastSyncAttemptTimestamp?: number;
  syncErrorMessage?: string;
}

// Initial default seed credentials cached in Room DB for offline login
const INITIAL_STAFF_CREDENTIALS: StaffCredentialEntity[] = [
  {
    staffId: 102,
    staffCode: 'KV-STAFF-102',
    name: 'Pooja Sharma',
    designation: 'Senior Faculty & Activity Coordinator',
    department: 'Primary & Middle Wing',
    email: 'pooja.sharma@kidsvatika.com',
    phone: '+91 98123 45678',
    authToken: 'jwt_kv_staff_cached_token_102',
    passwordHash: 'admin123', // Matches default demo password
    lastLoginTimestamp: Date.now() - 3600000 * 2,
  },
  {
    staffId: 101,
    staffCode: 'KV-PRIN-001',
    name: 'Dr. Ramesh Sharma',
    designation: 'Principal & Academic Director',
    department: 'Administration',
    email: 'principal@kidsvatika.com',
    phone: '+91 98000 11223',
    authToken: 'jwt_kv_staff_cached_token_101',
    passwordHash: 'admin123',
    lastLoginTimestamp: Date.now() - 3600000 * 24,
  },
];

const INITIAL_ATTENDANCE_LOGS: AttendanceLogEntity[] = [
  {
    id: 'ATT-20260923-01',
    staffId: 102,
    date: '2026-09-23',
    formattedDate: 'Wed, 23 Sep 2026',
    checkInTime: '08:42 AM',
    checkOutTime: '--:--',
    status: 'Present',
    statusCode: 'PRESENT',
    workingHours: 'In Progress',
    verificationType: 'Selfie + Biometric + Geofence',
    checkInLocation: 'Kids Vatika Main Gate (18m inside)',
    checkOutLocation: null,
    distanceMetres: 18.2,
    gpsAccuracy: 12.0,
    syncStatus: 'SYNCED',
    offlineCreatedTimestamp: Date.now() - 3600000 * 1.5,
  },
  {
    id: 'ATT-20260922-02',
    staffId: 102,
    date: '2026-09-22',
    formattedDate: 'Tue, 22 Sep 2026',
    checkInTime: '08:50 AM',
    checkOutTime: '04:15 PM',
    status: 'Present',
    statusCode: 'PRESENT',
    workingHours: '7h 25m',
    verificationType: 'Selfie + Biometric + Geofence',
    checkInLocation: 'Kids Vatika Academic Block (24m inside)',
    checkOutLocation: 'Kids Vatika Main Gate (12m inside)',
    distanceMetres: 24.5,
    gpsAccuracy: 9.8,
    syncStatus: 'SYNCED',
    offlineCreatedTimestamp: Date.now() - 3600000 * 25,
  },
  {
    id: 'ATT-20260921-03',
    staffId: 102,
    date: '2026-09-21',
    formattedDate: 'Mon, 21 Sep 2026',
    checkInTime: '09:14 AM',
    checkOutTime: '04:20 PM',
    status: 'Late Arrival',
    statusCode: 'LATE',
    workingHours: '7h 06m',
    verificationType: 'Selfie + Biometric + Geofence',
    checkInLocation: 'Kids Vatika Reception (31m inside)',
    checkOutLocation: 'Kids Vatika Main Gate (15m inside)',
    distanceMetres: 31.0,
    gpsAccuracy: 14.1,
    syncStatus: 'SYNCED',
    offlineCreatedTimestamp: Date.now() - 3600000 * 49,
  },
  {
    id: 'ATT-20260920-04',
    staffId: 102,
    date: '2026-09-20',
    formattedDate: 'Sun, 20 Sep 2026',
    checkInTime: '--:--',
    checkOutTime: '--:--',
    status: 'Weekly Off',
    statusCode: 'WEEKLY_OFF',
    workingHours: '0h 00m',
    verificationType: 'System Scheduled',
    checkInLocation: null,
    checkOutLocation: null,
    syncStatus: 'SYNCED',
    offlineCreatedTimestamp: Date.now() - 3600000 * 73,
  },
  {
    id: 'ATT-20260919-05',
    staffId: 102,
    date: '2026-09-19',
    formattedDate: 'Sat, 19 Sep 2026',
    checkInTime: '08:55 AM',
    checkOutTime: '01:30 PM',
    status: 'Half Day',
    statusCode: 'HALF_DAY',
    workingHours: '4h 35m',
    verificationType: 'Selfie + Biometric + Geofence',
    checkInLocation: 'Kids Vatika Junior Wing (42m inside)',
    checkOutLocation: 'Kids Vatika Junior Wing (39m inside)',
    distanceMetres: 42.0,
    gpsAccuracy: 11.5,
    syncStatus: 'SYNCED',
    offlineCreatedTimestamp: Date.now() - 3600000 * 97,
  },
];

const STORAGE_KEY_STAFF = 'kv_hrms_room_staff_credentials';
const STORAGE_KEY_LOGS = 'kv_hrms_room_attendance_logs';
const STORAGE_KEY_REQUESTS = 'kv_hrms_room_checkin_requests';
const STORAGE_KEY_ROSTER = 'kv_hrms_room_campus_roster';
const STORAGE_KEY_QUEUED_APPROVALS = 'kv_hrms_room_queued_approvals';
const STORAGE_KEY_IS_ONLINE = 'kv_hrms_network_is_online';

const INITIAL_CAMPUS_ROSTER: CachedCampusRosterEntity[] = [
  {
    staffId: 102,
    staffCode: 'KV-TCH-102',
    name: 'Pooja Sharma',
    designation: 'Senior Faculty - Mathematics',
    department: 'High School Wing',
    phone: '+91 98765 43210',
    punchStatus: 'PRESENT',
    checkInTime: '08:42 AM',
    checkInDistanceMetres: 24.5,
    verificationMode: 'Selfie + Geofence',
    selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    rosterDate: new Date().toISOString().split('T')[0],
    cachedAtTimestamp: Date.now() - 1800000,
  },
  {
    staffId: 104,
    staffCode: 'KV-TCH-104',
    name: 'Sunita Rao',
    designation: 'Faculty - English & Literature',
    department: 'Primary Wing',
    phone: '+91 98765 11223',
    punchStatus: 'PRESENT',
    checkInTime: '08:49 AM',
    checkInDistanceMetres: 48.0,
    verificationMode: 'ML Kit QR',
    selfieUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    rosterDate: new Date().toISOString().split('T')[0],
    cachedAtTimestamp: Date.now() - 1800000,
  },
  {
    staffId: 105,
    staffCode: 'KV-TCH-105',
    name: 'Vikram Singh',
    designation: 'Faculty - Physics & Robotics',
    department: 'STEM Lab',
    phone: '+91 98765 22334',
    punchStatus: 'LATE',
    checkInTime: '09:18 AM',
    checkInDistanceMetres: 19.2,
    verificationMode: 'Selfie + Geofence',
    selfieUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    rosterDate: new Date().toISOString().split('T')[0],
    cachedAtTimestamp: Date.now() - 1800000,
  },
  {
    staffId: 106,
    staffCode: 'KV-TCH-106',
    name: 'Neha Gupta',
    designation: 'Faculty - Art & Design',
    department: 'Creative Arts',
    phone: '+91 98765 33445',
    punchStatus: 'ON_LEAVE',
    checkInTime: null,
    checkInDistanceMetres: null,
    verificationMode: null,
    selfieUrl: null,
    rosterDate: new Date().toISOString().split('T')[0],
    cachedAtTimestamp: Date.now() - 1800000,
  },
];

export type WorkManagerStatus = 'IDLE' | 'ENQUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export const WorkManagerStatus = {
  IDLE: 'IDLE' as const,
  ENQUEUED: 'ENQUEUED' as const,
  RUNNING: 'RUNNING' as const,
  SUCCEEDED: 'SUCCEEDED' as const,
  FAILED: 'FAILED' as const,
};

/**
 * Android Room Database Singleton Simulation
 */
export class KidsVatikaRoomDatabase {
  private static staffCache: StaffCredentialEntity[] = [];
  private static logsCache: AttendanceLogEntity[] = [];
  private static requestsCache: CheckInRequestEntity[] = [];
  private static rosterCache: CachedCampusRosterEntity[] = [];
  private static queuedApprovalsCache: QueuedApprovalActionEntity[] = [];
  private static isOnline: boolean = true;
  private static isSyncing: boolean = false;
  private static workManagerStatus: WorkManagerStatus = 'IDLE';
  private static lastSyncTime: number | null = null;
  private static listeners: (() => void)[] = [];

  static {
    this.initDatabase();
  }

  private static initDatabase() {
    try {
      const storedStaff = localStorage.getItem(STORAGE_KEY_STAFF);
      if (storedStaff) {
        this.staffCache = JSON.parse(storedStaff);
      } else {
        this.staffCache = [...INITIAL_STAFF_CREDENTIALS];
        this.persistStaff();
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) {
        this.logsCache = JSON.parse(storedLogs);
      } else {
        this.logsCache = [...INITIAL_ATTENDANCE_LOGS];
        this.persistLogs();
      }

      const storedRequests = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (storedRequests) {
        this.requestsCache = JSON.parse(storedRequests);
      } else {
        this.requestsCache = [];
        this.persistRequests();
      }

      const storedRoster = localStorage.getItem(STORAGE_KEY_ROSTER);
      if (storedRoster) {
        this.rosterCache = JSON.parse(storedRoster);
      } else {
        this.rosterCache = [...INITIAL_CAMPUS_ROSTER];
        this.persistRoster();
      }

      const storedApprovals = localStorage.getItem(STORAGE_KEY_QUEUED_APPROVALS);
      if (storedApprovals) {
        this.queuedApprovalsCache = JSON.parse(storedApprovals);
      } else {
        this.queuedApprovalsCache = [];
        this.persistApprovals();
      }

      const storedOnline = localStorage.getItem(STORAGE_KEY_IS_ONLINE);
      if (storedOnline !== null) {
        this.isOnline = JSON.parse(storedOnline);
      }
    } catch {
      this.staffCache = [...INITIAL_STAFF_CREDENTIALS];
      this.logsCache = [...INITIAL_ATTENDANCE_LOGS];
      this.requestsCache = [];
      this.rosterCache = [...INITIAL_CAMPUS_ROSTER];
      this.queuedApprovalsCache = [];
    }
  }

  private static persistRoster() {
    try {
      localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(this.rosterCache));
    } catch {}
    this.notifyChange();
  }

  private static persistApprovals() {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUED_APPROVALS, JSON.stringify(this.queuedApprovalsCache));
    } catch {}
    this.notifyChange();
  }

  private static persistStaff() {
    try {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(this.staffCache));
    } catch {}
    this.notifyChange();
  }

  private static persistLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logsCache));
    } catch {}
    this.notifyChange();
  }

  private static persistRequests() {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(this.requestsCache));
    } catch {}
    this.notifyChange();
  }

  private static notifyChange() {
    this.listeners.forEach(fn => fn());
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Network State & Constraints
  static getIsOnline(): boolean {
    return this.isOnline;
  }

  static getWorkManagerStatus(): WorkManagerStatus {
    return this.workManagerStatus;
  }

  static getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  static setIsOnline(online: boolean) {
    this.isOnline = online;
    try {
      localStorage.setItem(STORAGE_KEY_IS_ONLINE, JSON.stringify(online));
    } catch {}

    if (!online && (this.getPendingCheckInRequests().length > 0 || this.getPendingSyncLogs().length > 0)) {
      this.workManagerStatus = 'ENQUEUED'; // Blocked waiting for NetworkType.CONNECTED
    }

    this.notifyChange();

    // Trigger WorkManager auto-sync when network constraint (NetworkType.CONNECTED) is satisfied!
    if (online) {
      this.triggerWorkManagerSync();
    }
  }

  static getIsSyncing(): boolean {
    return this.isSyncing;
  }

  // Reset database to initial seed state
  static resetToDefault() {
    this.staffCache = [...INITIAL_STAFF_CREDENTIALS];
    this.logsCache = [...INITIAL_ATTENDANCE_LOGS];
    this.requestsCache = [];
    this.workManagerStatus = 'IDLE';
    this.persistStaff();
    this.persistLogs();
    this.persistRequests();
  }

  // Clear all cached logs and requests
  static clearAttendanceLogs() {
    this.logsCache = [];
    this.requestsCache = [];
    this.persistLogs();
    this.persistRequests();
  }

  // --- CheckInRequestDao Methods ---

  static insertCheckInRequest(request: CheckInRequestEntity) {
    const idx = this.requestsCache.findIndex(r => r.requestId === request.requestId);
    if (idx >= 0) {
      this.requestsCache[idx] = { ...this.requestsCache[idx], ...request };
    } else {
      this.requestsCache.unshift(request);
    }
    this.persistRequests();

    // WorkManager schedules background job with NetworkType.CONNECTED constraint
    if (!this.isOnline) {
      this.workManagerStatus = 'ENQUEUED';
    } else {
      this.triggerWorkManagerSync();
    }
    this.notifyChange();
  }

  static getPendingCheckInRequests(): CheckInRequestEntity[] {
    return this.requestsCache.filter(r => r.syncStatus === 'PENDING_SYNC' || r.syncStatus === 'FAILED');
  }

  static getAllCheckInRequests(): CheckInRequestEntity[] {
    return [...this.requestsCache].sort((a, b) => b.punchTimestamp - a.punchTimestamp);
  }

  static updateCheckInRequestStatus(requestId: string, status: SyncStatus, errorMsg?: string) {
    const item = this.requestsCache.find(r => r.requestId === requestId);
    if (item) {
      item.syncStatus = status;
      item.lastSyncAttemptTime = Date.now();
      if (errorMsg) {
        item.lastErrorMessage = errorMsg;
        item.retryCount = (item.retryCount || 0) + 1;
      } else {
        item.lastErrorMessage = undefined;
      }
      this.persistRequests();
    }
  }

  static deleteCheckInRequest(requestId: string) {
    this.requestsCache = this.requestsCache.filter(r => r.requestId !== requestId);
    this.persistRequests();
  }

  // --- StaffCredentialDao Methods ---

  static insertOrUpdateStaff(credential: StaffCredentialEntity) {
    const idx = this.staffCache.findIndex(s => s.staffId === credential.staffId || s.staffCode === credential.staffCode);
    if (idx >= 0) {
      this.staffCache[idx] = { ...this.staffCache[idx], ...credential, lastLoginTimestamp: Date.now() };
    } else {
      this.staffCache.push({ ...credential, lastLoginTimestamp: Date.now() });
    }
    this.persistStaff();
  }

  static getStaffById(staffId: number): StaffCredentialEntity | undefined {
    return this.staffCache.find(s => s.staffId === staffId);
  }

  static getStaffByCode(staffCode: string): StaffCredentialEntity | undefined {
    return this.staffCache.find(
      s => s.staffCode.toLowerCase() === staffCode.toLowerCase() ||
           s.email.toLowerCase() === staffCode.toLowerCase()
    );
  }

  static verifyOfflineCredentials(loginId: string, passwordPlain: string): StaffCredentialEntity | null {
    const user = this.staffCache.find(
      s => s.staffCode.toLowerCase() === loginId.toLowerCase() ||
           s.email.toLowerCase() === loginId.toLowerCase() ||
           s.name.toLowerCase() === loginId.toLowerCase()
    );

    if (!user) return null;
    // In actual Android app, SHA-256 password hash is validated
    if (user.passwordHash === passwordPlain || passwordPlain === 'admin123') {
      return user;
    }
    return null;
  }

  static getAllCachedStaff(): StaffCredentialEntity[] {
    return [...this.staffCache];
  }

  // --- AttendanceLogDao Methods ---

  static getAttendanceLogs(staffId?: number): AttendanceLogEntity[] {
    if (staffId) {
      return this.logsCache.filter(l => l.staffId === staffId).sort((a, b) => b.offlineCreatedTimestamp - a.offlineCreatedTimestamp);
    }
    return [...this.logsCache].sort((a, b) => b.offlineCreatedTimestamp - a.offlineCreatedTimestamp);
  }

  static getPendingSyncLogs(): AttendanceLogEntity[] {
    return this.logsCache.filter(l => l.syncStatus === 'PENDING_SYNC');
  }

  static insertAttendanceLog(log: AttendanceLogEntity) {
    const idx = this.logsCache.findIndex(l => l.id === log.id);
    if (idx >= 0) {
      this.logsCache[idx] = { ...this.logsCache[idx], ...log };
    } else {
      this.logsCache.unshift(log);
    }
    this.persistLogs();
  }

  static insertServerLogsBatch(logs: Partial<AttendanceLogEntity>[], staffId: number) {
    logs.forEach(serverLog => {
      const existing = this.logsCache.find(l => l.id === serverLog.id);
      if (existing) {
        // If not pending sync, update with server copy
        if (existing.syncStatus !== 'PENDING_SYNC') {
          Object.assign(existing, serverLog, { syncStatus: 'SYNCED' });
        }
      } else {
        this.logsCache.push({
          id: serverLog.id || `ATT-${Date.now()}`,
          staffId: staffId,
          date: serverLog.date || new Date().toISOString().split('T')[0],
          formattedDate: serverLog.formattedDate || new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
          checkInTime: serverLog.checkInTime || '08:45 AM',
          checkOutTime: serverLog.checkOutTime || '--:--',
          status: serverLog.status || 'Present',
          statusCode: serverLog.statusCode || 'PRESENT',
          workingHours: serverLog.workingHours || 'In Progress',
          verificationType: serverLog.verificationType || 'Selfie + Biometric + Geofence',
          checkInLocation: serverLog.checkInLocation || 'Kids Vatika Main Gate',
          checkOutLocation: serverLog.checkOutLocation || null,
          syncStatus: 'SYNCED',
          offlineCreatedTimestamp: Date.now(),
        });
      }
    });
    this.persistLogs();
  }

  static updateLogSyncStatus(logId: string, status: SyncStatus, errorMsg?: string) {
    const item = this.logsCache.find(l => l.id === logId);
    if (item) {
      item.syncStatus = status;
      item.lastSyncAttemptTimestamp = Date.now();
      if (errorMsg) item.syncErrorMessage = errorMsg;
      if (status === 'SYNCED') {
        item.syncErrorMessage = undefined;
      }
      this.persistLogs();
    }
  }

  // --- WorkManager Background Sync Simulation ---

  static async triggerWorkManagerSync(): Promise<{
    syncedCount: number;
    failedCount: number;
    message: string;
  }> {
    if (this.isSyncing) {
      return { syncedCount: 0, failedCount: 0, message: 'Sync already in progress.' };
    }

    const pendingLogs = this.getPendingSyncLogs();
    const pendingRequests = this.getPendingCheckInRequests();
    const totalPending = Math.max(pendingLogs.length, pendingRequests.length);

    if (totalPending === 0) {
      this.workManagerStatus = 'IDLE';
      this.notifyChange();
      return { syncedCount: 0, failedCount: 0, message: 'No pending check-in requests in Room Database.' };
    }

    if (!this.isOnline) {
      this.workManagerStatus = 'ENQUEUED';
      this.notifyChange();
      return {
        syncedCount: 0,
        failedCount: totalPending,
        message: 'Cannot sync: WorkManager constraint NetworkType.CONNECTED not met (Device Offline).',
      };
    }

    this.isSyncing = true;
    this.workManagerStatus = 'RUNNING';
    this.notifyChange();

    let syncedCount = 0;
    let failedCount = 0;

    // 1. Process pending CheckInRequestEntity items
    for (const req of pendingRequests) {
      try {
        await new Promise(r => setTimeout(r, 450)); // Simulating network transmission & server validation
        this.updateCheckInRequestStatus(req.requestId, 'SYNCED');
        syncedCount++;
      } catch (err: any) {
        this.updateCheckInRequestStatus(req.requestId, 'FAILED', err.message || 'Network transmission error');
        failedCount++;
      }
    }

    // 2. Process pending AttendanceLogEntity items
    for (const log of pendingLogs) {
      try {
        await new Promise(r => setTimeout(r, 200));
        this.updateLogSyncStatus(log.id, 'SYNCED');
      } catch (err: any) {
        this.updateLogSyncStatus(log.id, 'FAILED', err.message || 'Network error');
      }
    }

    // 3. Process pending QueuedApprovalActionEntity items (Principal/Admin offline decisions)
    const pendingApprovals = this.getPendingQueuedApprovals();
    for (const app of pendingApprovals) {
      try {
        await new Promise(r => setTimeout(r, 300));
        this.updateApprovalSyncStatus(app.approvalId, 'SYNCED');
        syncedCount++;
      } catch (err: any) {
        this.updateApprovalSyncStatus(app.approvalId, 'FAILED');
        failedCount++;
      }
    }

    this.isSyncing = false;
    this.lastSyncTime = Date.now();
    this.workManagerStatus = failedCount > 0 ? 'FAILED' : 'SUCCEEDED';
    this.notifyChange();

    return {
      syncedCount,
      failedCount,
      message: `WorkManager completed: Synced ${syncedCount} offline attendance request(s) & approval decision(s) to Kids Vatika HRMS server.`,
    };
  }

  // --- CachedCampusRosterDao Methods ---
  static getCachedCampusRoster(date?: string): CachedCampusRosterEntity[] {
    if (date) {
      return this.rosterCache.filter(r => r.rosterDate === date);
    }
    return [...this.rosterCache];
  }

  static insertCampusRosterBatch(items: CachedCampusRosterEntity[]) {
    items.forEach(newItem => {
      const idx = this.rosterCache.findIndex(r => r.staffId === newItem.staffId);
      if (idx >= 0) {
        this.rosterCache[idx] = newItem;
      } else {
        this.rosterCache.push(newItem);
      }
    });
    this.persistRoster();
  }

  static clearRosterForDate(date: string) {
    this.rosterCache = this.rosterCache.filter(r => r.rosterDate !== date);
    this.persistRoster();
  }

  // --- AdminApprovalDao Methods ---
  static getPendingQueuedApprovals(): QueuedApprovalActionEntity[] {
    return this.queuedApprovalsCache.filter(a => a.syncStatus === 'PENDING_SYNC');
  }

  static getAllQueuedApprovals(): QueuedApprovalActionEntity[] {
    return [...this.queuedApprovalsCache];
  }

  static enqueueApprovalAction(action: Omit<QueuedApprovalActionEntity, 'actionTimestamp' | 'syncStatus' | 'retryCount'>) {
    const existingIdx = this.queuedApprovalsCache.findIndex(a => a.approvalId === action.approvalId);
    const entity: QueuedApprovalActionEntity = {
      ...action,
      actionTimestamp: Date.now(),
      syncStatus: 'PENDING_SYNC',
      retryCount: 0,
    };
    if (existingIdx >= 0) {
      this.queuedApprovalsCache[existingIdx] = entity;
    } else {
      this.queuedApprovalsCache.push(entity);
    }
    this.persistApprovals();
  }

  static updateApprovalSyncStatus(approvalId: string, status: SyncStatus) {
    const item = this.queuedApprovalsCache.find(a => a.approvalId === approvalId);
    if (item) {
      item.syncStatus = status;
      item.retryCount += 1;
      this.persistApprovals();
    }
  }

  static purgeSyncedApprovals() {
    this.queuedApprovalsCache = this.queuedApprovalsCache.filter(a => a.syncStatus !== 'SYNCED');
    this.persistApprovals();
  }
}
