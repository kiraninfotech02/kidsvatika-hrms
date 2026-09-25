package com.kidsvatika.hrms.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class InventoryViewModel : ViewModel() {
    private val _scannedAsset = MutableStateFlow<String?>(null)
    val scannedAsset: StateFlow<String?> = _scannedAsset

    fun onBarcodeScanned(barcode: String) {
        // Implementation: Look up barcode in Room
        _scannedAsset.value = barcode
    }
}
