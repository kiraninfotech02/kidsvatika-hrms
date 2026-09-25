package com.kidsvatika.hrms.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.kidsvatika.hrms.data.local.dao.*
import com.kidsvatika.hrms.data.local.entity.*

@Database(
    entities = [
        StaffCredentialEntity::class,
        AttendanceLogEntity::class,
        CheckInRequestEntity::class,
        CachedCampusRosterEntity::class,
        QueuedApprovalActionEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class KidsVatikaDatabase : RoomDatabase() {

    abstract fun staffCredentialDao(): StaffCredentialDao
    abstract fun attendanceLogDao(): AttendanceLogDao
    abstract fun checkInRequestDao(): CheckInRequestDao
    abstract fun cachedCampusRosterDao(): CachedCampusRosterDao
    abstract fun adminApprovalDao(): AdminApprovalDao

    companion object {
        @Volatile
        private var INSTANCE: KidsVatikaDatabase? = null

        fun getDatabase(context: Context): KidsVatikaDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    KidsVatikaDatabase::class.java,
                    "kids_vatika_hrms.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
