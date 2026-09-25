package com.kidsvatika.hrms.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kidsvatika.hrms.ui.viewmodel.InventoryViewModel
import com.kidsvatika.hrms.ui.components.AssetBarcodeScannerView

@Composable
fun AssetInventoryDashboardScreen(viewModel: InventoryViewModel) {
    var showScanner by remember { mutableStateOf(false) }
    val scannedAsset by viewModel.scannedAsset.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Asset Inventory Dashboard", style = MaterialTheme.typography.headlineMedium)
        
        Button(onClick = { showScanner = true }) {
            Text("Scan Tag to Issue/Return")
        }
        
        if (showScanner) {
            AssetBarcodeScannerView { barcode ->
                viewModel.onBarcodeScanned(barcode)
                showScanner = false
            }
        }
        
        scannedAsset?.let {
            Text("Last Scanned: $it")
        }
    }
}

@Composable
fun AssetCheckoutDialog() { Text("Asset Checkout Dialog") }

@Composable
fun DamageReportBottomSheet() { Text("Damage Report Sheet") }
