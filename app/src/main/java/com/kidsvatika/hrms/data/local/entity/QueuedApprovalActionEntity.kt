package com.kidsvatika.hrms.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.kidsvatika.hrms.data.model.ApprovalActionPayload

/**
 * Room Entity for queuing administrator approval/rejection decisions offline.
 * Processed and dispatched by WorkManager once network connectivity returns.
 */
@Entity(tableName = "queued_approval_actions")
data class QueuedApprovalActionEntity(
    @PrimaryKey
    @ColumnInfo(name = "approval_id")
    val approvalId: String,

    @ColumnInfo(name = "request_type")
    val requestType: String, // "LEAVE_APPLICATION" or "MISSED_PUNCH_REGULARIZATION"

    @ColumnInfo(name = "decision")
    val decision: String, // "APPROVED" or "REJECTED"

    @ColumnInfo(name = "reviewer_remarks")
    val reviewerRemarks: String?,

    @ColumnInfo(name = "staff_name")
    val staffName: String,

    @ColumnInfo(name = "action_timestamp")
    val actionTimestamp: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "PENDING_SYNC", // "PENDING_SYNC", "SYNCED", "FAILED"

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0
) {
    fun toPayload(): ApprovalActionPayload {
        return ApprovalActionPayload(
            approvalId = approvalId,
            requestType = requestType,
            decision = decision,
            reviewerRemarks = reviewerRemarks
        )
    }
}
