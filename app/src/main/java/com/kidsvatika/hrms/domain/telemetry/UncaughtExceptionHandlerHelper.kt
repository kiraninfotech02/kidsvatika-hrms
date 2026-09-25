package com.kidsvatika.hrms.domain.telemetry

import android.content.Context
import com.kidsvatika.hrms.data.local.AppDatabase
import com.kidsvatika.hrms.data.local.CrashReportEntity
import kotlinx.coroutines.runBlocking
import java.io.PrintWriter
import java.io.StringWriter
import java.util.Date

class UncaughtExceptionHandlerHelper(private val context: Context) : Thread.UncaughtExceptionHandler {
    override fun uncaughtException(t: Thread, e: Throwable) {
        val stackTrace = StringWriter().apply { e.printStackTrace(PrintWriter(this)) }.toString()
        
        val crash = CrashReportEntity(
            staffId = 0, // Placeholder
            crashTimestamp = Date().toString(),
            exceptionType = e.javaClass.simpleName,
            stackTrace = stackTrace
        )
        
        runBlocking {
            AppDatabase.getInstance(context).crashReportDao().insert(crash)
        }
        
        System.exit(1)
    }
}
