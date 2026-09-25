package com.kidsvatika.hrms.domain.telemetry

import android.content.Context
import android.util.Base64
import java.io.File

class EncryptedLogBuffer(context: Context) {
    private val logDir = File(context.filesDir, "logs")
    private val logFile = File(logDir, "app_telemetry.enc")
    private val maxEntries = 200

    init {
        if (!logDir.exists()) logDir.mkdirs()
    }

    fun log(message: String) {
        val maskedMessage = maskPII(message)
        val encryptedMessage = Base64.encodeToString(maskedMessage.toByteArray(), Base64.DEFAULT)
        
        val lines = if (logFile.exists()) logFile.readLines() else emptyList()
        val updatedLines = (lines + encryptedMessage).takeLast(maxEntries)
        
        logFile.writeText(updatedLines.joinToString("\n"))
        
        if (logFile.length() > 2 * 1024 * 1024) { // 2 MB limit
            logFile.delete()
        }
    }

    private fun maskPII(message: String): String {
        return message
            .replace(Regex("\\d{12}"), "************")
            .replace(Regex("\\d{10}"), "**********")
    }
}
