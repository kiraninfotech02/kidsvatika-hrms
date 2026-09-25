package com.kidsvatika.hrms.data.remote

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.Interceptor
import okhttp3.Response
import java.util.concurrent.TimeUnit

enum class NetworkQuality {
    EXCELLENT, MODERATE, POOR, OFFLINE
}

class NetworkTelemetryInterceptor : Interceptor {

    private val _networkQuality = MutableStateFlow(NetworkQuality.EXCELLENT)
    val networkQuality: StateFlow<NetworkQuality> = _networkQuality

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val startTime = System.nanoTime()

        val response = try {
            chain.proceed(request)
        } catch (e: Exception) {
            _networkQuality.value = NetworkQuality.OFFLINE
            throw e
        }

        val durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime)
        
        // Update network quality based on latency
        _networkQuality.value = when {
            durationMs < 200 -> NetworkQuality.EXCELLENT
            durationMs < 500 -> NetworkQuality.MODERATE
            else -> NetworkQuality.POOR
        }

        return response
    }
}
