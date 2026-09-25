package com.kidsvatika.hrms.domain

import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*

class BusTrackingService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "bus_tracking_channel"
        val channel = NotificationChannel(channelId, "Bus Tracking", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Transit Active")
            .setContentText("Tracking route: Sector 20 to School")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
        
        // Start location updates using fusedLocationClient
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
