package com.kidsvatika.hrms.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kidsvatika.hrms.data.local.KidsVatikaDatabase
import com.kidsvatika.hrms.data.local.entity.CachedCampusRosterEntity
import com.kidsvatika.hrms.data.local.entity.QueuedApprovalActionEntity
import com.kidsvatika.hrms.data.model.*
import com.kidsvatika.hrms.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

enum class RosterFilter(val label: String) {
    ALL("All"),
    PRESENT("Present"),
    LATE("Late"),
    ABSENT("Absent"),
    ON_LEAVE("On Leave")
}

data class CampusRosterUiState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val selectedDate: String = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
    val searchQuery: String = "",
    val selectedFilter: RosterFilter = RosterFilter.ALL,
    val totalStaff: Int = 0,
    val presentCount: Int = 0,
    val lateCount: Int = 0,
    val absentCount: Int = 0,
    val leaveCount: Int = 0,
    val fullRoster: List<StaffAttendanceStatusItem> = emptyList(),
    val filteredRoster: List<StaffAttendanceStatusItem> = emptyList(),
    val isOfflineMode: Boolean = false,
    val errorMessage: String? = null
)

data class ApprovalsUiState(
    val isLoading: Boolean = false,
    val pendingApprovals: List<PendingApprovalItem> = emptyList(),
    val processingApprovalIds: Set<String> = emptySet(),
    val queuedOfflineCount: Int = 0,
    val bannerMessage: String? = null,
    val errorMessage: String? = null
)

data class BroadcastNoticeUiState(
    val isBroadcasting: Boolean = false,
    val isSuccess: Boolean = false,
    val lastBroadcastTitle: String? = null,
    val errorMessage: String? = null
)

class AdminDashboardViewModel(application: Application) : AndroidViewModel(application) {

    private val apiService = ApiClient.apiService
    private val database = KidsVatikaDatabase.getDatabase(application)
    private val rosterDao = database.cachedCampusRosterDao()
    private val approvalDao = database.adminApprovalDao()

    private val _rosterUiState = MutableStateFlow(CampusRosterUiState())
    val rosterUiState: StateFlow<CampusRosterUiState> = _rosterUiState.asStateFlow()

    private val _approvalsUiState = MutableStateFlow(ApprovalsUiState())
    val approvalsUiState: StateFlow<ApprovalsUiState> = _approvalsUiState.asStateFlow()

    private val _broadcastUiState = MutableStateFlow(BroadcastNoticeUiState())
    val broadcastUiState: StateFlow<BroadcastNoticeUiState> = _broadcastUiState.asStateFlow()

    init {
        // Observe offline queued approvals count
        viewModelScope.launch {
            approvalDao.getPendingQueueCountFlow().collect { count ->
                _approvalsUiState.update { it.copy(queuedOfflineCount = count) }
            }
        }

        // Initial fetch
        loadCampusRoster()
        loadPendingApprovals()
    }

    /**
     * Fetch Live Campus Roster with Room database fallback and caching
     */
    fun loadCampusRoster(isRefresh: Boolean = false) {
        val targetDate = _rosterUiState.value.selectedDate

        viewModelScope.launch {
            if (isRefresh) {
                _rosterUiState.update { it.copy(isRefreshing = true, errorMessage = null) }
            } else {
                _rosterUiState.update { it.copy(isLoading = true, errorMessage = null) }
            }

            // 1. Emit instantly from Room DB cache first
            try {
                val cachedEntities = withContext(Dispatchers.IO) {
                    rosterDao.getRosterForDate(targetDate)
                }
                if (cachedEntities.isNotEmpty()) {
                    val cachedItems = cachedEntities.map { it.toStaffAttendanceStatusItem() }
                    updateRosterState(cachedItems, isOffline = true)
                }
            } catch (_: Exception) { }

            // 2. Fetch from Live Backend
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.getCampusRoster(targetDate)
                }

                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    val liveRoster = body.roster

                    // Cache to Room DB asynchronously
                    withContext(Dispatchers.IO) {
                        val entities = liveRoster.map { CachedCampusRosterEntity.fromModel(it, targetDate) }
                        rosterDao.clearRosterForDate(targetDate)
                        rosterDao.insertRosterBatch(entities)
                    }

                    _rosterUiState.update { current ->
                        val filtered = applyFilter(liveRoster, current.searchQuery, current.selectedFilter)
                        current.copy(
                            isLoading = false,
                            isRefreshing = false,
                            totalStaff = body.totalStaff,
                            presentCount = body.presentCount,
                            lateCount = body.lateCount,
                            absentCount = body.absentCount,
                            leaveCount = body.leaveCount,
                            fullRoster = liveRoster,
                            filteredRoster = filtered,
                            isOfflineMode = false,
                            errorMessage = null
                        )
                    }
                } else {
                    _rosterUiState.update { it.copy(isLoading = false, isRefreshing = false) }
                }
            } catch (e: Exception) {
                // If network fails, maintain cached view
                _rosterUiState.update {
                    it.copy(
                        isLoading = false,
                        isRefreshing = false,
                        isOfflineMode = true,
                        errorMessage = "Working in Offline Mode: Showing cached campus attendance roster."
                    )
                }
            }
        }
    }

    /**
     * Search filter by staff name or staff code
     */
    fun setSearchQuery(query: String) {
        _rosterUiState.update { current ->
            val filtered = applyFilter(current.fullRoster, query, current.selectedFilter)
            current.copy(searchQuery = query, filteredRoster = filtered)
        }
    }

    /**
     * Status Filter: All, Present, Late, Absent, On Leave
     */
    fun setFilter(filter: RosterFilter) {
        _rosterUiState.update { current ->
            val filtered = applyFilter(current.fullRoster, current.searchQuery, filter)
            current.copy(selectedFilter = filter, filteredRoster = filtered)
        }
    }

    private fun applyFilter(
        roster: List<StaffAttendanceStatusItem>,
        query: String,
        filter: RosterFilter
    ): List<StaffAttendanceStatusItem> {
        return roster.filter { staff ->
            val matchesQuery = query.isBlank() ||
                staff.name.contains(query, ignoreCase = true) ||
                staff.staffCode.contains(query, ignoreCase = true) ||
                staff.designation.contains(query, ignoreCase = true) ||
                staff.department.contains(query, ignoreCase = true)

            val matchesStatus = when (filter) {
                RosterFilter.ALL -> true
                RosterFilter.PRESENT -> staff.punchStatus.equals("PRESENT", ignoreCase = true)
                RosterFilter.LATE -> staff.punchStatus.equals("LATE", ignoreCase = true)
                RosterFilter.ABSENT -> staff.punchStatus.equals("ABSENT", ignoreCase = true)
                RosterFilter.ON_LEAVE -> staff.punchStatus.equals("ON_LEAVE", ignoreCase = true)
            }

            matchesQuery && matchesStatus
        }
    }

    private fun updateRosterState(roster: List<StaffAttendanceStatusItem>, isOffline: Boolean) {
        _rosterUiState.update { current ->
            val present = roster.count { it.punchStatus.equals("PRESENT", ignoreCase = true) }
            val late = roster.count { it.punchStatus.equals("LATE", ignoreCase = true) }
            val absent = roster.count { it.punchStatus.equals("ABSENT", ignoreCase = true) }
            val leave = roster.count { it.punchStatus.equals("ON_LEAVE", ignoreCase = true) }
            val filtered = applyFilter(roster, current.searchQuery, current.selectedFilter)

            current.copy(
                totalStaff = roster.size,
                presentCount = present,
                lateCount = late,
                absentCount = absent,
                leaveCount = leave,
                fullRoster = roster,
                filteredRoster = filtered,
                isOfflineMode = isOffline
            )
        }
    }

    // =========================================================================
    // APPROVAL ENGINE (LEAVE & REGULARIZATION)
    // =========================================================================

    /**
     * Load pending approvals
     */
    fun loadPendingApprovals() {
        viewModelScope.launch {
            _approvalsUiState.update { it.copy(isLoading = true, errorMessage = null) }

            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.getPendingApprovals()
                }

                if (response.isSuccessful && response.body() != null) {
                    _approvalsUiState.update {
                        it.copy(
                            isLoading = false,
                            pendingApprovals = response.body()!!.approvals,
                            errorMessage = null
                        )
                    }
                } else {
                    _approvalsUiState.update { it.copy(isLoading = false) }
                }
            } catch (e: Exception) {
                _approvalsUiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Unable to reach server. Any reviews will be queued offline in Room DB."
                    )
                }
            }
        }
    }

    /**
     * Process approval decision with Optimistic UI Update & Offline Room Queuing
     */
    fun processApproval(
        item: PendingApprovalItem,
        decision: String, // "APPROVED" or "REJECTED"
        remarks: String? = null,
        onSuccess: (() -> Unit)? = null
    ) {
        val approvalId = item.approvalId

        // Optimistic UI Update: remove from pending list immediately
        val originalList = _approvalsUiState.value.pendingApprovals
        _approvalsUiState.update { current ->
            current.copy(
                pendingApprovals = current.pendingApprovals.filterNot { it.approvalId == approvalId },
                processingApprovalIds = current.processingApprovalIds + approvalId,
                bannerMessage = "${item.staffName}'s request marked as $decision"
            )
        }

        viewModelScope.launch {
            val payload = ApprovalActionPayload(
                approvalId = approvalId,
                requestType = item.requestType,
                decision = decision,
                reviewerRemarks = remarks
            )

            var isSynced = false
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.processApproval(payload)
                }
                if (response.isSuccessful && response.body()?.status == "success") {
                    isSynced = true
                }
            } catch (_: Exception) {
                // Network failed: store in Room DB queue for WorkManager sync
            }

            if (!isSynced) {
                withContext(Dispatchers.IO) {
                    approvalDao.enqueueApprovalAction(
                        QueuedApprovalActionEntity(
                            approvalId = approvalId,
                            requestType = item.requestType,
                            decision = decision,
                            reviewerRemarks = remarks,
                            staffName = item.staffName,
                            syncStatus = "PENDING_SYNC"
                        )
                    )
                }
                _approvalsUiState.update {
                    it.copy(
                        bannerMessage = "Offline Mode: Decision queued in Room DB. WorkManager will sync upon reconnect."
                    )
                }
            }

            _approvalsUiState.update { current ->
                current.copy(
                    processingApprovalIds = current.processingApprovalIds - approvalId
                )
            }

            onSuccess?.invoke()
        }
    }

    // =========================================================================
    // BROADCAST NOTICE ENGINE
    // =========================================================================

    /**
     * Broadcast an urgent circular to staff members
     */
    fun broadcastCircular(
        title: String,
        content: String,
        targetDepartment: String,
        priority: String,
        senderName: String,
        senderRole: String,
        onComplete: (Boolean) -> Unit
    ) {
        viewModelScope.launch {
            _broadcastUiState.update { it.copy(isBroadcasting = true, isSuccess = false, errorMessage = null) }

            try {
                val request = BroadcastCircularRequest(
                    title = title,
                    content = content,
                    targetDepartment = targetDepartment,
                    priority = priority,
                    broadcastByName = senderName,
                    broadcastByRole = senderRole
                )

                val response = withContext(Dispatchers.IO) {
                    apiService.broadcastCircular(request)
                }

                if (response.isSuccessful && response.body()?.status == "success") {
                    _broadcastUiState.update {
                        it.copy(
                            isBroadcasting = false,
                            isSuccess = true,
                            lastBroadcastTitle = title,
                            errorMessage = null
                        )
                    }
                    onComplete(true)
                } else {
                    _broadcastUiState.update {
                        it.copy(
                            isBroadcasting = false,
                            isSuccess = false,
                            errorMessage = response.body()?.message ?: "Broadcast failed. Please try again."
                        )
                    }
                    onComplete(false)
                }
            } catch (e: Exception) {
                _broadcastUiState.update {
                    it.copy(
                        isBroadcasting = false,
                        isSuccess = false,
                        errorMessage = "Network error: Unable to dispatch push circular to FCM."
                    )
                }
                onComplete(false)
            }
        }
    }

    fun dismissBannerMessage() {
        _approvalsUiState.update { it.copy(bannerMessage = null) }
    }
}
