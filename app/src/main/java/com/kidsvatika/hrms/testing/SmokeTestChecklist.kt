package com.kidsvatika.hrms.testing

object SmokeTestChecklist {
    fun getChecklist() = listOf(
        "1. Cold start time < 1.5s",
        "2. SQLCipher DB initialization success",
        "3. CameraX + ML Kit liveness check success",
        "4. Geofence perimeter trigger (in vs out)",
        "5. Offline attendance caching and WorkManager sync verification"
    )
}
