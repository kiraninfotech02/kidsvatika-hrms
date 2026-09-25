package com.kidsvatika.hrms.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.kidsvatika.hrms.data.model.StaffAttendanceStatusItem

/**
 * Room Entity to cache the daily campus attendance roster locally.
 * Enables the Principal or Director to view who is on campus, who is late,
 * and who is absent even during complete Wi-Fi or cellular network drops.
 */
@Entity(tableName = "cached_campus_roster")
data class CachedCampusRosterEntity(
    @PrimaryKey
    @ColumnInfo(name = "staff_id")
    val staffId: Int,

    @ColumnInfo(name = "staff_code")
    val staffCode: String,

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "designation")
    val designation: String,

    @ColumnInfo(name = "department")
    val department: String,

    @ColumnInfo(name = "phone")
    val phone: String,

    @ColumnInfo(name = "punch_status")
    val punchStatus: String, // "PRESENT", "ABSENT", "LATE", "ON_LEAVE"

    @ColumnInfo(name = "check_in_time")
    val checkInTime: String?,

    @ColumnInfo(name = "check_in_distance_metres")
    val checkInDistanceMetres: Double?,

    @ColumnInfo(name = "verification_mode")
    val verificationMode: String?,

    @ColumnInfo(name = "selfie_url")
    val selfieUrl: String?,

    @ColumnInfo(name = "roster_date")
    val rosterDate: String,

    @ColumnInfo(name = "cached_at_timestamp")
    val cachedAtTimestamp: Long = System.currentTimeMillis()
) {
    fun toStaffAttendanceStatusItem(): StaffAttendanceStatusItem {
        return StaffAttendanceStatusItem(
            staffId = staffId,
            staffCode = staffCode,
            name = name,
            designation = designation,
            department = department,
            phone = phone,
            punchStatus = punchStatus,
            checkInTime = checkInTime,
            checkInDistanceMetres = checkInDistanceMetres,
            verificationMode = verificationMode,
            selfieUrl = selfieUrl
        )
    }

    companion object {
        fun fromModel(item: StaffAttendanceStatusItem, rosterDate: String): CachedCampusRosterEntity {
            return CachedCampusRosterEntity(
                staffId = item.staffId,
                staffCode = item.staffCode,
                name = item.name,
                designation = item.designation,
                department = item.department,
                phone = item.phone,
                punchStatus = item.punchStatus,
                checkInTime = item.checkInTime,
                checkInDistanceMetres = item.checkInDistanceMetres,
                verificationMode = item.verificationMode,
                selfieUrl = item.selfieUrl,
                rosterDate = rosterDate
            )
        }
    }
}
