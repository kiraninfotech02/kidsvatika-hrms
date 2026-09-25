package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "emergency_roster")
data class EmergencyRosterEntity(
    @PrimaryKey val staffId: Int,
    val staffName: String,
    val evacuationStatus: String
)

@Entity(tableName = "cached_sos_dispatch")
data class CachedSosDispatchEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val incidentType: String,
    val triggeredAt: String,
    val isSynced: Boolean = false
)
