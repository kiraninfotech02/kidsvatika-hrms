package com.kidsvatika.hrms.data.model

import com.google.gson.annotations.SerializedName

/**
 * Role-Based Access Control (RBAC) User Roles
 */
enum class UserRole {
    @SerializedName("STAFF")
    STAFF,

    @SerializedName("PRINCIPAL")
    PRINCIPAL,

    @SerializedName("ADMIN")
    ADMIN,

    @SerializedName("SUPER_ADMIN")
    SUPER_ADMIN;

    val isExecutiveOrAdmin: Boolean
        get() = this == PRINCIPAL || this == ADMIN || this == SUPER_ADMIN
}

/**
 * Live Backend Contract Models for Kids Vatika HRMS
 * Base URL: https://hrms.kidsvatika.com/api.php
 */

// 1. Ping / Health Check
data class PingResponse(
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String? = null,
    @SerializedName("server_time") val serverTime: String? = null
)

// 2. Location Pre-check
data class VerifyLocationRequest(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Float
)

data class VerifyLocationResponse(
    @SerializedName("status") val status: String,
    @SerializedName("within_geofence") val withinGeofence: Boolean,
    @SerializedName("distance_metres") val distanceMetres: Double? = null,
    @SerializedName("message") val message: String? = null
)

// 3. Request Challenge
data class RequestChallengeRequest(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("device_id") val deviceId: String
)

data class ChallengeDetails(
    @SerializedName("challenge_token") val challengeToken: String,
    @SerializedName("action_required") val actionRequired: String,
    @SerializedName("expires_at") val expiresAt: String
)

data class ChallengeResponse(
    @SerializedName("status") val status: String,
    @SerializedName("challenge") val challenge: ChallengeDetails? = null,
    @SerializedName("message") val message: String? = null
)

// 4. Check-In
data class CheckInRequest(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Float,
    @SerializedName("challenge_token") val challengeToken: String,
    @SerializedName("selfie_image") val selfieImageBase64: String
)

data class CheckInResponse(
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String,
    @SerializedName("punch_time") val punchTime: String? = null,
    @SerializedName("attendance_id") val attendanceId: String? = null,
    @SerializedName("distance_metres") val distanceMetres: Double? = null
)

// 5. Check-Out
data class CheckOutRequest(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Float
)

data class CheckOutResponse(
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String,
    @SerializedName("punch_time") val punchTime: String? = null,
    @SerializedName("attendance_id") val attendanceId: String? = null
)

// 6. Login & Authenticated Staff User with Role
data class LoginRequest(
    @SerializedName("login_id") val loginId: String,
    @SerializedName("password") val password: String,
    @SerializedName("device_id") val deviceId: String
)

data class StaffUser(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("staff_code") val staffCode: String,
    @SerializedName("name") val name: String,
    @SerializedName("designation") val designation: String,
    @SerializedName("department") val department: String? = null,
    @SerializedName("role") val role: String = "STAFF",
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("profile_image_url") val profileImageUrl: String? = null
) {
    val userRole: UserRole
        get() = try {
            UserRole.valueOf(role.uppercase())
        } catch (_: Exception) {
            UserRole.STAFF
        }

    val isExecutiveOrAdmin: Boolean
        get() = userRole.isExecutiveOrAdmin
}

data class LoginResponse(
    @SerializedName("status") val status: String,
    @SerializedName("token") val token: String? = null,
    @SerializedName("staff") val staff: StaffUser? = null,
    @SerializedName("message") val message: String? = null
)

// 7. Historical Attendance Records
data class AttendanceLogItem(
    @SerializedName("id") val id: String,
    @SerializedName("date") val date: String,
    @SerializedName("formatted_date") val formattedDate: String,
    @SerializedName("check_in") val checkIn: String,
    @SerializedName("check_out") val checkOut: String,
    @SerializedName("status") val status: String,
    @SerializedName("status_code") val statusCode: String,
    @SerializedName("working_hours") val workingHours: String? = null,
    @SerializedName("verification_type") val verificationType: String? = null,
    @SerializedName("check_in_location") val checkInLocation: String? = null,
    @SerializedName("check_out_location") val checkOutLocation: String? = null
)

data class AttendanceSummary(
    @SerializedName("total_days") val totalDays: Int = 0,
    @SerializedName("present_count") val presentCount: Int = 0,
    @SerializedName("late_count") val lateCount: Int = 0,
    @SerializedName("half_day_count") val halfDayCount: Int = 0,
    @SerializedName("absent_count") val absentCount: Int = 0
)

data class AttendanceHistoryResponse(
    @SerializedName("status") val status: String,
    @SerializedName("logs") val logs: List<AttendanceLogItem> = emptyList(),
    @SerializedName("summary") val summary: AttendanceSummary? = null,
    @SerializedName("message") val message: String? = null
)

// 8. FCM Device Token Registration
data class UpdateFcmTokenRequest(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("fcm_token") val fcmToken: String,
    @SerializedName("device_model") val deviceModel: String = "Android Device",
    @SerializedName("os_version") val osVersion: String = "Android 15 (API 35)",
    @SerializedName("app_version") val appVersion: String = "1.0.0"
)

data class UpdateFcmTokenResponse(
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String,
    @SerializedName("registered_at") val registeredAt: String? = null,
    @SerializedName("device_model") val deviceModel: String? = null
)

// 9. FCM Push Notification
data class FcmNotificationBody(
    @SerializedName("title") val title: String,
    @SerializedName("body") val body: String,
    @SerializedName("sound") val sound: String = "default",
    @SerializedName("priority") val priority: String = "high"
)

data class SendPushNotificationRequest(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("notification_type") val notificationType: String,
    @SerializedName("channel_id") val channelId: String = "reminders_channel",
    @SerializedName("notification") val notification: FcmNotificationBody,
    @SerializedName("data") val data: Map<String, String> = emptyMap()
)

data class SendPushNotificationResponse(
    @SerializedName("status") val status: String,
    @SerializedName("message_id") val messageId: String? = null,
    @SerializedName("sent_at") val sentAt: String? = null,
    @SerializedName("channel_id") val channelId: String? = null
)

// =========================================================================
// EXECUTIVE & PRINCIPAL MANAGEMENT CONTRACT MODELS
// =========================================================================

/**
 * Real-time Campus Attendance Roster Staff Member DTO
 */
data class StaffAttendanceStatusItem(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("staff_code") val staffCode: String,
    @SerializedName("name") val name: String,
    @SerializedName("designation") val designation: String,
    @SerializedName("department") val department: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("punch_status") val punchStatus: String, // "PRESENT", "ABSENT", "LATE", "ON_LEAVE"
    @SerializedName("check_in_time") val checkInTime: String?,
    @SerializedName("check_in_distance_metres") val checkInDistanceMetres: Double?,
    @SerializedName("verification_mode") val verificationMode: String?, // "Selfie + Geofence", "ML Kit QR", "Offline Sync"
    @SerializedName("selfie_url") val selfieUrl: String?
)

/**
 * Real-Time Campus Roster API Response
 */
data class CampusRosterResponse(
    @SerializedName("status") val status: String,
    @SerializedName("date") val date: String,
    @SerializedName("total_staff") val totalStaff: Int,
    @SerializedName("present_count") val presentCount: Int,
    @SerializedName("late_count") val lateCount: Int,
    @SerializedName("absent_count") val absentCount: Int,
    @SerializedName("leave_count") val leaveCount: Int,
    @SerializedName("roster") val roster: List<StaffAttendanceStatusItem> = emptyList(),
    @SerializedName("message") val message: String? = null
)

/**
 * Pending Approval Item for Leave & Regularization Engine
 */
data class PendingApprovalItem(
    @SerializedName("approval_id") val approvalId: String,
    @SerializedName("request_type") val requestType: String, // "LEAVE_APPLICATION" or "MISSED_PUNCH_REGULARIZATION"
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("staff_name") val staffName: String,
    @SerializedName("staff_code") val staffCode: String,
    @SerializedName("submitted_date") val submittedDate: String,
    @SerializedName("date_range_or_punch_date") val dateRangeOrPunchDate: String,
    @SerializedName("reason") val reason: String,
    @SerializedName("current_status") val currentStatus: String // "PENDING", "APPROVED", "REJECTED"
)

/**
 * Pending Approvals API Response
 */
data class PendingApprovalsResponse(
    @SerializedName("status") val status: String,
    @SerializedName("pending_count") val pendingCount: Int,
    @SerializedName("approvals") val approvals: List<PendingApprovalItem> = emptyList(),
    @SerializedName("message") val message: String? = null
)

/**
 * Payload sent by Principal/Admin to approve or reject a request
 */
data class ApprovalActionPayload(
    @SerializedName("approval_id") val approvalId: String,
    @SerializedName("request_type") val requestType: String,
    @SerializedName("decision") val decision: String, // "APPROVED" or "REJECTED"
    @SerializedName("reviewer_remarks") val reviewerRemarks: String? = null
)

/**
 * Payload to broadcast an immediate circular/notice to all school staff
 */
data class BroadcastCircularRequest(
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String,
    @SerializedName("target_department") val targetDepartment: String = "ALL",
    @SerializedName("priority") val priority: String = "HIGH", // "NORMAL", "HIGH", "CRITICAL"
    @SerializedName("broadcast_by_name") val broadcastByName: String,
    @SerializedName("broadcast_by_role") val broadcastByRole: String
)

// 10. In-App Update
data class AppUpdateInfo(
    @SerializedName("latest_version_code") val latestVersionCode: Int,
    @SerializedName("latest_version_name") val latestVersionName: String,
    @SerializedName("apk_download_url") val apkDownloadUrl: String,
    @SerializedName("release_notes") val releaseNotes: String,
    @SerializedName("is_mandatory") val isMandatory: Boolean,
    @SerializedName("min_supported_version_code") val minSupportedVersionCode: Int
)

// 11. Proxy Duty Models
data class ProxyDutyItem(
    @SerializedName("proxy_id") val proxyId: String,
    @SerializedName("original_teacher_id") val originalTeacherId: Int,
    @SerializedName("original_teacher_name") val originalTeacherName: String,
    @SerializedName("assigned_teacher_id") val assignedTeacherId: Int,
    @SerializedName("assigned_teacher_name") val assignedTeacherName: String,
    @SerializedName("period_number") val periodNumber: Int,
    @SerializedName("period_time") val periodTime: String,
    @SerializedName("class_name") val className: String,
    @SerializedName("class_id") val classId: Int,
    @SerializedName("subject") val subject: String,
    @SerializedName("room_number") val roomNumber: String,
    @SerializedName("date") val date: String,
    @SerializedName("status") val status: String
)

data class AvailableProxyStaff(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("staff_name") val staffName: String,
    @SerializedName("designation") val designation: String,
    @SerializedName("free_periods_today") val freePeriodsToday: List<Int>,
    @SerializedName("is_same_department") val isSameDepartment: Boolean
)

data class AssignProxyPayload(
    @SerializedName("absent_teacher_id") val absentTeacherId: Int,
    @SerializedName("substitute_teacher_id") val substituteTeacherId: Int,
    @SerializedName("date") val date: String,
    @SerializedName("period_number") val periodNumber: Int,
    @SerializedName("class_id") val classId: Int,
    @SerializedName("instructions") val instructions: String?
)

// 12. BLE & NFC Proximity Models
data class BeaconConfigItem(
    @SerializedName("beacon_id") val beaconId: String,
    @SerializedName("uuid") val uuid: String,
    @SerializedName("major") val major: Int,
    @SerializedName("minor") val minor: Int,
    @SerializedName("location_tag") val locationTag: String
)

data class BeaconScanResult(
    @SerializedName("uuid") val uuid: String,
    @SerializedName("major") val major: Int,
    @SerializedName("minor") val minor: Int,
    @SerializedName("rssi") val rssi: Int,
    @SerializedName("estimated_distance_meters") val estimatedDistanceMeters: Double,
    @SerializedName("beacon_location_tag") val beaconLocationTag: String
)

data class ProximityPunchRequest(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("source") val source: String,
    @SerializedName("beacon_or_nfc_token") val beaconOrNfcToken: String,
    @SerializedName("rssi") val rssi: Int?,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)

// 13. Bus Transit Models
data class BusStopItem(
    @SerializedName("stop_id") val stopId: Int,
    @SerializedName("stop_name") val stopName: String,
    @SerializedName("planned_arrival_time") val plannedArrivalTime: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("students_count") val studentsCount: Int,
    @SerializedName("students") val students: List<BusStudentItem>
)

data class BusStudentItem(
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("admission_no") val admissionNo: String,
    @SerializedName("student_name") val studentName: String,
    @SerializedName("grade_class") val gradeClass: String,
    @SerializedName("parent_contact") val parentContact: String,
    @SerializedName("boarding_status") val boardingStatus: String
)

data class BusRouteInfo(
    @SerializedName("route_id") val routeId: Int,
    @SerializedName("route_name") val routeName: String,
    @SerializedName("bus_number") val busNumber: String,
    @SerializedName("driver_name") val driverName: String,
    @SerializedName("driver_phone") val driverPhone: String,
    @SerializedName("total_stops") val totalStops: Int,
    @SerializedName("stops") val stops: List<BusStopItem>
)

data class BoardingUpdatePayload(
    @SerializedName("route_id") val routeId: Int,
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("stop_id") val stopId: Int,
    @SerializedName("status") val status: String,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)

// 14. Visitor Pass Models
data class VisitorPassPayload(
    @SerializedName("visitor_name") val visitorName: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("purpose") val purpose: String,
    @SerializedName("host_staff_id") val hostStaffId: Int,
    @SerializedName("number_of_persons") val numberOfPersons: Int,
    @SerializedName("id_type") val idType: String,
    @SerializedName("id_number") val idNumber: String,
    @SerializedName("visitor_photo_base64") val visitorPhotoBase64: String,
    @SerializedName("id_proof_photo_base64") val idProofPhotoBase64: String?
)

data class VisitorPassItem(
    @SerializedName("pass_id") val passId: String,
    @SerializedName("visitor_name") val visitorName: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("purpose") val purpose: String,
    @SerializedName("host_staff_name") val hostStaffName: String,
    @SerializedName("host_staff_department") val hostStaffDepartment: String,
    @SerializedName("entry_time") val entryTime: String,
    @SerializedName("exit_time") val exitTime: String?,
    @SerializedName("status") val status: String,
    @SerializedName("qr_pass_token") val qrPassToken: String,
    @SerializedName("visitor_photo_url") val visitorPhotoUrl: String?
)

data class HostApprovalResponsePayload(
    @SerializedName("pass_id") val passId: String,
    @SerializedName("host_staff_id") val hostStaffId: Int,
    @SerializedName("decision") val decision: String,
    @SerializedName("remarks") val remarks: String?
)

// 15. Staff Appraisal Models
data class KpiMetricItem(
    @SerializedName("metric_key") val metricKey: String,
    @SerializedName("title") val title: String,
    @SerializedName("score") val score: Float,
    @SerializedName("max_score") val maxScore: Float,
    @SerializedName("weightage_percentage") val weightagePercentage: Float,
    @SerializedName("category") val category: String
)

data class StaffAppraisalReport(
    @SerializedName("appraisal_id") val appraisalId: String,
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("academic_year") val academicYear: String,
    @SerializedName("overall_rating") val overallRating: Float,
    @SerializedName("grade") val grade: String,
    @SerializedName("metrics") val metrics: List<KpiMetricItem>,
    @SerializedName("principal_remarks") val principalRemarks: String?,
    @SerializedName("self_appraisal_submitted") val selfAppraisalSubmitted: Boolean,
    @SerializedName("review_status") val reviewStatus: String
)

data class SubmitSelfAppraisalPayload(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("academic_year") val academicYear: String,
    @SerializedName("achievements_summary") val achievementsSummary: String,
    @SerializedName("challenges_faced") val challengesFaced: String,
    @SerializedName("training_needs") val trainingNeeds: String,
    @SerializedName("self_score_attendance") val selfScoreAttendance: Float,
    @SerializedName("self_score_curriculum") val selfScoreCurriculum: Float
)

// 16. Asset Inventory Models
data class AssetItem(
    @SerializedName("asset_id") val assetId: String,
    @SerializedName("barcode_tag") val barcodeTag: String,
    @SerializedName("asset_name") val assetName: String,
    @SerializedName("category") val category: String,
    @SerializedName("serial_number") val serialNumber: String?,
    @SerializedName("location_room") val locationRoom: String,
    @SerializedName("current_condition") val currentCondition: String,
    @SerializedName("assigned_staff_id") val assignedStaffId: Int?,
    @SerializedName("assigned_staff_name") val assignedStaffName: String?,
    @SerializedName("issued_date") val issuedDate: String?,
    @SerializedName("expected_return_date") val expectedReturnDate: String?,
    @SerializedName("is_available") val isAvailable: Boolean
)

data class AssetCheckoutPayload(
    @SerializedName("asset_id") val assetId: String,
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("expected_return_date") val expectedReturnDate: String,
    @SerializedName("checkout_remarks") val checkoutRemarks: String?,
    @SerializedName("condition_at_checkout") val conditionAtCheckout: String
)

data class AssetReturnPayload(
    @SerializedName("asset_id") val assetId: String,
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("return_condition") val returnCondition: String,
    @SerializedName("damage_report_notes") val damageReportNotes: String?,
    @SerializedName("damage_photo_base64") val damagePhotoBase64: String?
)

// 17. Emergency SOS and Evacuation Models
data class SosAlertPayload(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("incident_type") val incidentType: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("gps_accuracy") val gpsAccuracy: Float,
    @SerializedName("location_tag") val locationTag: String,
    @SerializedName("brief_notes") val briefNotes: String?,
    @SerializedName("triggered_at") val triggeredAt: String
)

data class EvacuationStaffStatus(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("staff_name") val staffName: String,
    @SerializedName("designation") val designation: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("evacuation_status") val evacuationStatus: String,
    @SerializedName("marked_safe_at") val markedSafeAt: String?,
    @SerializedName("marked_by_staff_id") val markedByStaffId: Int?
)

data class ActiveEmergencyState(
    @SerializedName("emergency_id") val emergencyId: String,
    @SerializedName("incident_type") val incidentType: String,
    @SerializedName("initiated_by_name") val initiatedByName: String,
    @SerializedName("initiated_time") val initiatedTime: String,
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("safe_assembly_location") val safeAssemblyLocation: String,
    @SerializedName("evacuation_summary") val evacuationSummary: Map<String, Int>
)

// 18. Support Ticket Models
data class SubmitTicketPayload(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("category") val category: String,
    @SerializedName("subject") val subject: String,
    @SerializedName("description") val description: String,
    @SerializedName("screenshot_base64") val screenshotBase64: String?,
    @SerializedName("app_logs_dump") val appLogsDump: String?,
    @SerializedName("device_model") val deviceModel: String,
    @SerializedName("os_version") val osVersion: String
)

data class SupportTicketItem(
    @SerializedName("ticket_id") val ticketId: String,
    @SerializedName("category") val category: String,
    @SerializedName("subject") val subject: String,
    @SerializedName("status") val status: String,
    @SerializedName("created_at") val createdAt: String
)

// 19. Telemetry & Crash Reporting Models
data class DeviceMetricPayload(
    @SerializedName("staff_id") val staffId: Int,
    @SerializedName("app_version") val appVersion: String,
    @SerializedName("build_number") val buildNumber: Int,
    @SerializedName("device_model") val deviceModel: String,
    @SerializedName("os_version") val osVersion: String,
    @SerializedName("battery_percentage") val batteryPercentage: Int,
    @SerializedName("available_internal_storage_mb") val availableInternalStorageMb: Long,
    @SerializedName("avg_api_latency_ms") val avgApiLatencyMs: Long,
    @SerializedName("failed_sync_attempts_count") val failedSyncAttemptsCount: Int,
    @SerializedName("recorded_at") val recordedAt: String
)

data class CrashReportPayload(
    @SerializedName("staff_id") val staffId: Int?,
    @SerializedName("crash_timestamp") val crashTimestamp: String,
    @SerializedName("exception_type") val exceptionType: String,
    @SerializedName("stack_trace") val stackTrace: String,
    @SerializedName("last_route") val lastRoute: String?,
    @SerializedName("breadcrumbs") val breadcrumbs: List<String>,
    @SerializedName("device_info_json") val deviceInfoJson: String
)

/**
 * Generic API Status Response
 */
data class ApiResponse(
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String,
    @SerializedName("timestamp") val timestamp: String? = null
)

data class ApiErrorResponse(
    @SerializedName("status") val status: String = "error",
    @SerializedName("message") val message: String
)
