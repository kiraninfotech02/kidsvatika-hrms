package com.kidsvatika.hrms.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kidsvatika.hrms.ui.viewmodel.BusTransitViewModel
import com.kidsvatika.hrms.ui.viewmodel.TripState

@Composable
fun BusTripDashboardScreen(viewModel: BusTransitViewModel) {
    val tripState by viewModel.tripState.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Route: Route 4 - Sector 20 to School", style = MaterialTheme.typography.headlineSmall)
        Text("Status: ${tripState.name}")
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(onClick = { 
            if (tripState == TripState.TRIP_IN_PROGRESS) viewModel.endTrip() 
            else viewModel.startTrip() 
        }) {
            Text(if (tripState == TripState.TRIP_IN_PROGRESS) "End Trip" else "Start Trip")
        }
    }
}

@Composable
fun GatekeeperDashboardScreen() { Text("Gatekeeper Dashboard") }

@Composable
fun StaffAppraisalDashboardScreen() { Text("Performance Appraisal Dashboard") }
