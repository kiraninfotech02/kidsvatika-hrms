package com.kidsvatika.hrms.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface CrashReportDao {
    @Insert
    suspend fun insert(crash: CrashReportEntity)

    @Query("SELECT * FROM crash_reports WHERE isSynced = 0")
    suspend fun getPendingCrashes(): List<CrashReportEntity>

    @Update
    suspend fun update(crash: CrashReportEntity)
}
