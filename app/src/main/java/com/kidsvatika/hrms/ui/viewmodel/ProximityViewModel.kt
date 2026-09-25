package com.kidsvatika.hrms.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class ProximityViewModel : ViewModel() {
    private val _scanStatus = MutableStateFlow("Idle")
    val scanStatus: StateFlow<String> = _scanStatus

    fun startScanning() {
        // Implementation: BLE scan logic
        _scanStatus.value = "Scanning..."
    }
}
