package com.kidsvatika.hrms.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kidsvatika.hrms.ui.viewmodel.ProximityViewModel

@Composable
fun ProximityRadarScreen(
    viewModel: ProximityViewModel
) {
    val scanStatus by viewModel.scanStatus.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("BLE & NFC Attendance", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        Text("Status: $scanStatus")
        Button(onClick = { viewModel.startScanning() }) {
            Text("Start Scanning")
        }
    }
}
