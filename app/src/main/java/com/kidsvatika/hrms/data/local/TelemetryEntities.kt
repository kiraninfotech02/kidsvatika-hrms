package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "crash_reports")
data class CrashReportEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val staffId: Int?,
    val crashTimestamp: String,
    val exceptionType: String,
    val stackTrace: String,
    val isSynced: Boolean = false
)
