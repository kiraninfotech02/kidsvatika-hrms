package com.kidsvatika.hrms.data.local.dao

import androidx.room.*
import com.kidsvatika.hrms.data.local.entity.QueuedApprovalActionEntity
import kotlinx.coroutines.flow.Flow

/**
 * Room DAO for administrator offline decision queuing and WorkManager synchronization.
 */
@Dao
interface AdminApprovalDao {

    @Query("SELECT * FROM queued_approval_actions WHERE sync_status = 'PENDING_SYNC' ORDER BY action_timestamp ASC")
    fun getPendingQueuedApprovalsFlow(): Flow<List<QueuedApprovalActionEntity>>

    @Query("SELECT * FROM queued_approval_actions WHERE sync_status = 'PENDING_SYNC' ORDER BY action_timestamp ASC")
    suspend fun getPendingQueuedApprovals(): List<QueuedApprovalActionEntity>

    @Query("SELECT COUNT(*) FROM queued_approval_actions WHERE sync_status = 'PENDING_SYNC'")
    fun getPendingQueueCountFlow(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueueApprovalAction(action: QueuedApprovalActionEntity)

    @Query("UPDATE queued_approval_actions SET sync_status = :status, retry_count = retry_count + 1 WHERE approval_id = :approvalId")
    suspend fun updateSyncStatus(approvalId: String, status: String)

    @Query("DELETE FROM queued_approval_actions WHERE approval_id = :approvalId")
    suspend fun deleteAction(approvalId: String)

    @Query("DELETE FROM queued_approval_actions WHERE sync_status = 'SYNCED'")
    suspend fun purgeSyncedActions()
}
