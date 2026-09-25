package com.kidsvatika.hrms.ui.screens.diagnostics

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

import com.kidsvatika.hrms.ui.components.QRBadgeGenerator

@Composable
fun SystemDiagnosticsScreen() {
    var showBadge by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("System Diagnostics", style = MaterialTheme.typography.headlineMedium)
        
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Text("Preview Staff Badge")
            Spacer(modifier = Modifier.weight(1f))
            Switch(checked = showBadge, onCheckedChange = { showBadge = it })
        }
        
        if (showBadge) {
            Spacer(modifier = Modifier.height(16.dp))
            QRBadgeGenerator(content = "STAFF_ID_12345")
        }
    }
}

@Composable
fun CrashRecoveryDialog(onRestart: () -> Unit) {
    AlertDialog(
        onDismissRequest = {},
        title = { Text("App Error") },
        text = { Text("A non-fatal error occurred.") },
        confirmButton = { Button(onClick = onRestart) { Text("Restart") } }
    )
}
