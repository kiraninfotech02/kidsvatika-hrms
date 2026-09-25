package com.kidsvatika.hrms.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.kidsvatika.hrms.data.model.StaffUser
import com.kidsvatika.hrms.ui.viewmodel.AdminDashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BroadcastNoticeDialog(
    staff: StaffUser,
    viewModel: AdminDashboardViewModel,
    onDismiss: () -> Unit,
    onBroadcastSent: (title: String) -> Unit
) {
    val broadcastState by viewModel.broadcastUiState.collectAsState()

    var noticeTitle by remember { mutableStateOf("Emergency Staff Briefing & Academic Review") }
    var noticeContent by remember {
        mutableStateOf("All faculty members are requested to assemble in the Main Auditorium today at 2:30 PM for the upcoming CBSE inspection briefing.")
    }
    var targetDepartment by remember { mutableStateOf("ALL") }
    var priority by remember { mutableStateOf("HIGH") }
    var validationError by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxWidth()
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0xFFE11D48).copy(alpha = 0.15f),
                            modifier = Modifier.size(38.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.Campaign,
                                    contentDescription = null,
                                    tint = Color(0xFFE11D48),
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Broadcast Circular",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = "FCM Push Alert to All Staff Phones",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title Input
                OutlinedTextField(
                    value = noticeTitle,
                    onValueChange = {
                        noticeTitle = it
                        validationError = null
                    },
                    label = { Text("Circular Subject / Title") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Content Input
                OutlinedTextField(
                    value = noticeContent,
                    onValueChange = {
                        noticeContent = it
                        validationError = null
                    },
                    label = { Text("Notice Body") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    minLines = 3,
                    maxLines = 5
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Priority & Department Row
                Text(
                    text = "Delivery Priority (Firebase FCM)",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = priority == "HIGH",
                        onClick = { priority = "HIGH" },
                        label = { Text("High Priority ⚡") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFF59E0B),
                            selectedLabelColor = Color.Black
                        )
                    )

                    FilterChip(
                        selected = priority == "CRITICAL",
                        onClick = { priority = "CRITICAL" },
                        label = { Text("Critical Alert 🚨") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFDC2626),
                            selectedLabelColor = Color.White
                        )
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Validation or backend error
                if (validationError != null || broadcastState.errorMessage != null) {
                    Text(
                        text = validationError ?: broadcastState.errorMessage ?: "",
                        color = Color(0xFFEF4444),
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                // Dispatch Button
                Button(
                    onClick = {
                        if (noticeTitle.isBlank()) {
                            validationError = "Please enter circular title."
                            return@Button
                        }
                        if (noticeContent.isBlank()) {
                            validationError = "Please enter notice body."
                            return@Button
                        }

                        viewModel.broadcastCircular(
                            title = noticeTitle,
                            content = noticeContent,
                            targetDepartment = targetDepartment,
                            priority = priority,
                            senderName = staff.name,
                            senderRole = staff.role
                        ) { success ->
                            if (success) {
                                onBroadcastSent(noticeTitle)
                                onDismiss()
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    enabled = !broadcastState.isBroadcasting,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (broadcastState.isBroadcasting) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Transmitting to Staff FCM Nodes...")
                    } else {
                        Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Broadcast Notice to Campus", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
