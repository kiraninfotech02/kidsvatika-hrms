package com.kidsvatika.hrms.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [AttendanceEntity::class, CrashReportEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun attendanceDao(): AttendanceDao
    abstract fun securityDao(): SecurityDao
    abstract fun crashReportDao(): CrashReportDao

    companion object {
        @Volatile private var instance: AppDatabase? = null
        fun getInstance(context: android.content.Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(context, AppDatabase::class.java, "hrms.db").build().also { instance = it }
            }
        }
    }
}
