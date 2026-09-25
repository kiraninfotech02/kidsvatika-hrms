package com.kidsvatika.hrms.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kidsvatika.hrms.ui.viewmodel.ProxyViewModel

@Composable
fun ProxyDutiesScreen(
    viewModel: ProxyViewModel,
    onOpenRegister: (Int) -> Unit
) {
    val duties by viewModel.proxyDuties.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Today's Proxy Load", style = MaterialTheme.typography.headlineMedium)
        Text("${duties.size} Proxy Periods Assigned Today")
        
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(duties) { duty ->
                Card {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Class: ${duty.className}")
                        Text("Subject: ${duty.subject}")
                        Text("Room: ${duty.roomNumber}")
                        Text("Slot: ${duty.periodTime}")
                        Button(onClick = { onOpenRegister(duty.classId) }) {
                            Text("Open Classroom Register")
                        }
                    }
                }
            }
        }
    }
}
