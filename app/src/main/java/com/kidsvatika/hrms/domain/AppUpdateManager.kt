package com.kidsvatika.hrms.domain

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import com.kidsvatika.hrms.data.model.AppUpdateInfo
import com.kidsvatika.hrms.data.remote.ApiService
import retrofit2.Response
import java.io.File

class AppUpdateManager(
    private val context: Context,
    private val apiService: ApiService
) {

    suspend fun checkForUpdates(currentVersion: Int): Response<AppUpdateInfo> {
        return apiService.checkUpdate(currentVersion)
    }

    fun downloadAndInstallUpdate(updateInfo: AppUpdateInfo) {
        val request = DownloadManager.Request(Uri.parse(updateInfo.apkDownloadUrl))
            .setTitle("Updating Kids Vatika HRMS")
            .setDescription("Downloading version ${updateInfo.latestVersionName}")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, "update.apk")
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)

        val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        downloadManager.enqueue(request)
        // NOTE: A BroadcastReceiver should be registered to handle ACTION_DOWNLOAD_COMPLETE and call installApk(File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "update.apk"))
    }

    fun installApk(file: File) {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
