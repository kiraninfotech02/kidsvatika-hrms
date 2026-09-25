package com.kidsvatika.hrms.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kidsvatika.hrms.ui.viewmodel.DiagnosticsViewModel

@Composable
fun DiagnosticsScreen(
    viewModel: DiagnosticsViewModel,
    onNavigateBack: () -> Unit
) {
    val results by viewModel.diagnosticResults.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Text("System Diagnostics", style = MaterialTheme.typography.headlineMedium)
        Button(onClick = { viewModel.runDiagnostics() }) {
            Text("Run Tests")
        }
        LazyColumn {
            items(results) { result ->
                ListItem(
                    headlineContent = { Text(result.name) },
                    supportingContent = { Text(result.message) },
                    trailingContent = { 
                        Text(if (result.isPassed) "✅" else "❌") 
                    }
                )
            }
        }
    }
}
