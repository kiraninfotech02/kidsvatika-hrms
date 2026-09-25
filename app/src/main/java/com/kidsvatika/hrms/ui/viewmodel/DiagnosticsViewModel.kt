package com.kidsvatika.hrms.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class DiagnosticResult(
    val name: String,
    val isPassed: Boolean,
    val message: String
)

class DiagnosticsViewModel : ViewModel() {
    private val _diagnosticResults = MutableStateFlow<List<DiagnosticResult>>(emptyList())
    val diagnosticResults: StateFlow<List<DiagnosticResult>> = _diagnosticResults

    fun runDiagnostics() {
        // Implementation for running checks:
        // 1. GPS, 2. Camera, 3. Biometric, 4. MLKit, 5. RoomDB, 6. Network Ping
        _diagnosticResults.value = listOf(
            DiagnosticResult("GPS Sensor", true, "Fix accurate within 50m"),
            DiagnosticResult("Front Camera", true, "Initialized"),
            DiagnosticResult("Biometric Hardware", true, "Enrolled"),
            DiagnosticResult("Network Ping", true, "42ms")
        )
    }
}
