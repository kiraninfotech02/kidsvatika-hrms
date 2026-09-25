package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "bus_routes")
data class BusRouteEntity(
    @PrimaryKey val routeId: Int,
    val routeName: String,
    val busNumber: String
)

@Entity(tableName = "bus_boarding")
data class BusBoardingEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val studentId: Int,
    val routeId: Int,
    val status: String,
    val timestamp: String,
    val isSynced: Boolean = false
)

@Entity(tableName = "visitor_passes")
data class VisitorPassEntity(
    @PrimaryKey val passId: String,
    val visitorName: String,
    val status: String,
    val isSynced: Boolean = false
)

@Entity(tableName = "staff_appraisals")
data class StaffAppraisalEntity(
    @PrimaryKey val appraisalId: String,
    val staffId: Int,
    val academicYear: String,
    val overallRating: Float,
    val reviewStatus: String
)
