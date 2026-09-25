package com.kidsvatika.hrms.domain

import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import kotlinx.coroutines.flow.MutableStateFlow

class BleProximityManager {
    private val _scanResults = MutableStateFlow<List<ScanResult>>(emptyList())
    val scanResults = _scanResults

    fun startScanning() {
        // Implementation: BluetoothLeScanner startScan
    }

    fun stopScanning() {
        // Implementation: BluetoothLeScanner stopScan
    }
}
