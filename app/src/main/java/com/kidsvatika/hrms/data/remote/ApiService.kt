package com.kidsvatika.hrms.data.remote

import com.kidsvatika.hrms.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * Retrofit API Interface for Kids Vatika Smart School HRMS
 * Base URL: https://hrms.kidsvatika.com/
 */
interface ApiService {

    /**
     * Health check / ping
     */
    @GET("api.php?action=ping")
    suspend fun ping(): Response<PingResponse>

    /**
     * Location pre-check against campus boundary
     */
    @POST("api.php?action=verify-location")
    suspend fun verifyLocation(
        @Body request: VerifyLocationRequest
    ): Response<VerifyLocationResponse>

    /**
     * Request dynamic anti-spoofing challenge before selfie punch
     */
    @POST("api.php?action=request-challenge")
    suspend fun requestChallenge(
        @Body request: RequestChallengeRequest
    ): Response<ChallengeResponse>

    /**
     * Submit check-in punch with geo-coordinates, challenge token, and Base64 selfie
     */
    @POST("api.php?action=check-in")
    suspend fun checkIn(
        @Body request: CheckInRequest
    ): Response<CheckInResponse>

    /**
     * Submit check-out punch
     */
    @POST("api.php?action=check-out")
    suspend fun checkOut(
        @Body request: CheckOutRequest
    ): Response<CheckOutResponse>

    /**
     * Authenticate staff member with Device ID binding & Role payload
     */
    @POST("api.php?action=login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    /**
     * Fetch historical attendance logs for staff member
     */
    @GET("api.php?action=attendance-history")
    suspend fun getAttendanceHistory(
        @Query("staff_id") staffId: Int,
        @Query("limit") limit: Int = 10
    ): Response<AttendanceHistoryResponse>

    /**
     * Register or refresh staff member's FCM push device token
     */
    @POST("api.php?action=update-fcm-token")
    suspend fun updateFcmToken(
        @Body request: UpdateFcmTokenRequest
    ): Response<UpdateFcmTokenResponse>

    /**
     * Trigger / Dispatch FCM push notification (Check-in reminder or approval alert)
     */
    @POST("api.php?action=send-push-notification")
    suspend fun sendPushNotification(
        @Body request: SendPushNotificationRequest
    ): Response<SendPushNotificationResponse>

    // =========================================================================
    // PRINCIPAL & MANAGEMENT ADMINISTRATIVE ENDPOINTS
    // =========================================================================

    /**
     * Real-time Campus Attendance Roster for School Principal & Admin
     */
    @GET("api.php?action=admin-campus-roster")
    suspend fun getCampusRoster(
        @Query("date") date: String
    ): Response<CampusRosterResponse>

    /**
     * Retrieve all pending leave applications and punch regularizations
     */
    @GET("api.php?action=admin-pending-approvals")
    suspend fun getPendingApprovals(): Response<PendingApprovalsResponse>

    /**
     * Process an individual approval decision (APPROVE / REJECT)
     */
    @POST("api.php?action=admin-process-approval")
    suspend fun processApproval(
        @Body payload: ApprovalActionPayload
    ): Response<ApiResponse>

    /**
     * Broadcast an emergency notice or school circular with high-priority FCM push
     */
    @POST("api.php?action=broadcast-circular")
    suspend fun broadcastCircular(
        @Body request: BroadcastCircularRequest
    ): Response<ApiResponse>

    /**
     * Check for mandatory or optional app updates
     */
    @GET("api.php?action=check-update")
    suspend fun checkUpdate(
        @Query("current_version") currentVersion: Int
    ): Response<AppUpdateInfo>

    @GET("api.php?action=my-proxy-duties")
    suspend fun getMyProxyDuties(
        @Query("staff_id") staffId: Int,
        @Query("date") date: String
    ): Response<List<ProxyDutyItem>>

    @GET("api.php?action=available-substitutes")
    suspend fun getAvailableSubstitutes(
        @Query("date") date: String,
        @Query("period") period: Int
    ): Response<List<AvailableProxyStaff>>

    @POST("api.php?action=assign-proxy-period")
    suspend fun assignProxyPeriod(
        @Body payload: AssignProxyPayload
    ): Response<ApiResponse>

    @POST("api.php?action=respond-proxy-duty")
    suspend fun respondProxyDuty(
        @Body payload: Map<String, String> // Assuming status update payload
    ): Response<ApiResponse>

    @GET("api.php?action=active-beacons")
    suspend fun getActiveBeacons(): Response<List<BeaconConfigItem>>

    @POST("api.php?action=proximity-punch")
    suspend fun proximityPunch(
        @Body payload: ProximityPunchRequest
    ): Response<CheckInResponse>

    // 13. Bus Transit Endpoints
    @GET("api.php?action=my-bus-route")
    suspend fun getMyBusRoute(
        @Query("staff_id") staffId: Int
    ): Response<BusRouteInfo>

    @POST("api.php?action=update-bus-telemetry")
    suspend fun updateBusTelemetry(
        @Body payload: Map<String, Any> // Simplified payload structure
    ): Response<ApiResponse>

    @POST("api.php?action=update-student-boarding")
    suspend fun updateStudentBoarding(
        @Body payload: BoardingUpdatePayload
    ): Response<ApiResponse>

    @POST("api.php?action=start-end-trip")
    suspend fun startEndTrip(
        @Body payload: Map<String, String>
    ): Response<ApiResponse> // TripControlResponse equivalent

    // 14. Visitor Pass Endpoints
    @POST("api.php?action=create-visitor-pass")
    suspend fun createVisitorPass(
        @Body payload: VisitorPassPayload
    ): Response<ApiResponse>

    @GET("api.php?action=active-visitors-gate")
    suspend fun getActiveVisitors(): Response<List<VisitorPassItem>>

    @POST("api.php?action=checkout-visitor")
    suspend fun checkoutVisitor(
        @Body payload: Map<String, String>
    ): Response<ApiResponse>

    @POST("api.php?action=host-respond-visitor")
    suspend fun hostRespondVisitor(
        @Body payload: HostApprovalResponsePayload
    ): Response<ApiResponse>

    // 15. Staff Appraisal Endpoints
    @GET("api.php?action=my-performance-kpis")
    suspend fun getMyPerformanceKpis(
        @Query("staff_id") staffId: Int,
        @Query("year") year: String
    ): Response<StaffAppraisalReport>

    @POST("api.php?action=submit-self-appraisal")
    suspend fun submitSelfAppraisal(
        @Body payload: SubmitSelfAppraisalPayload
    ): Response<ApiResponse>

    @GET("api.php?action=admin-staff-rankings")
    suspend fun getAdminStaffRankings(
        @Query("department") department: String
    ): Response<List<StaffAppraisalReport>>

    // 16. Asset Inventory Endpoints
    @GET("api.php?action=search-assets")
    suspend fun searchAssets(
        @Query("query") query: String,
        @Query("category") category: String
    ): Response<List<AssetItem>>

    @POST("api.php?action=checkout-asset")
    suspend fun checkoutAsset(
        @Body payload: AssetCheckoutPayload
    ): Response<ApiResponse>

    @POST("api.php?action=return-asset")
    suspend fun returnAsset(
        @Body payload: AssetReturnPayload
    ): Response<ApiResponse>

    @GET("api.php?action=my-custody-assets")
    suspend fun getMyCustodyAssets(
        @Query("staff_id") staffId: Int
    ): Response<List<AssetItem>>

    // 17. Emergency SOS and Evacuation Endpoints
    @POST("api.php?action=trigger-emergency-sos")
    suspend fun triggerEmergencySos(
        @Body payload: SosAlertPayload
    ): Response<ApiResponse>

    @GET("api.php?action=active-emergency-status")
    suspend fun getActiveEmergencyStatus(): Response<ActiveEmergencyState>

    @POST("api.php?action=update-evacuation-roll")
    suspend fun updateEvacuationRoll(
        @Body payload: EvacuationStaffStatus
    ): Response<ApiResponse>

    @POST("api.php?action=all-clear-emergency")
    suspend fun allClearEmergency(): Response<ApiResponse>

    // 18. Support Ticket Endpoints
    @POST("api.php?action=create-support-ticket")
    suspend fun createSupportTicket(
        @Body payload: SubmitTicketPayload
    ): Response<ApiResponse>

    @GET("api.php?action=my-support-tickets")
    suspend fun getMySupportTickets(
        @Query("staff_id") staffId: Int
    ): Response<List<SupportTicketItem>>

    // 19. Telemetry & Crash Reporting Endpoints
    @POST("api.php?action=ingest-device-telemetry")
    suspend fun ingestDeviceTelemetry(
        @Body payload: DeviceMetricPayload
    ): Response<ApiResponse>

    @POST("api.php?action=report-app-crash")
    suspend fun reportAppCrash(
        @Body payload: CrashReportPayload
    ): Response<ApiResponse>
}
