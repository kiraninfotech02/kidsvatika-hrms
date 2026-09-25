package com.kidsvatika.hrms.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kidsvatika.hrms.data.model.PendingApprovalItem
import com.kidsvatika.hrms.security.BiometricResult
import com.kidsvatika.hrms.security.BiometricSecurityManager
import com.kidsvatika.hrms.ui.viewmodel.AdminDashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApprovalQueueScreen(
    viewModel: AdminDashboardViewModel,
    biometricSecurityManager: BiometricSecurityManager?,
    onNavigateBack: () -> Unit
) {
    val approvalsState by viewModel.approvalsUiState.collectAsState()

    var selectedItemForAction by remember { mutableStateOf<Pair<PendingApprovalItem, String>?>(null) } // item, decision
    var reviewerRemarks by remember { mutableStateOf("") }
    var showRemarksDialog by remember { mutableStateOf(false) }
    var showBiometricGate by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Approval Engine",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "Leaves & Punch Regularizations",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadPendingApprovals() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            // Action banner message (e.g. optimistic feedback or offline queued notice)
            AnimatedVisibility(visible = approvalsState.bannerMessage != null) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF10B981).copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.4f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = approvalsState.bannerMessage ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFA7F3D0)
                            )
                        }
                        IconButton(
                            onClick = { viewModel.dismissBannerMessage() },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = Color(0xFFA7F3D0))
                        }
                    }
                }
            }

            // Offline Queued Count Alert
            if (approvalsState.queuedOfflineCount > 0) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFD97706).copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.4f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Sync, contentDescription = null, tint = Color(0xFFF59E0B))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${approvalsState.queuedOfflineCount} decision(s) queued in Room DB. Will auto-sync via WorkManager.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFFDE68A)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Pending count and Bulk Security Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Pending Review (${approvalsState.pendingApprovals.size})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Fingerprint,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = Color(0xFF38BDF8)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Biometric Protected",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF38BDF8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (approvalsState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF4F46E5))
                }
            } else if (approvalsState.pendingApprovals.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFF10B981).copy(alpha = 0.15f),
                            modifier = Modifier.size(72.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.TaskAlt,
                                    contentDescription = null,
                                    modifier = Modifier.size(40.dp),
                                    tint = Color(0xFF10B981)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Approval Queue Clear!",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "All leave applications and punch regularizations are reviewed.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(approvalsState.pendingApprovals, key = { it.approvalId }) { item ->
                        val isProcessing = approvalsState.processingApprovalIds.contains(item.approvalId)

                        ApprovalItemCard(
                            item = item,
                            isProcessing = isProcessing,
                            onApprove = {
                                selectedItemForAction = Pair(item, "APPROVED")
                                showBiometricGate = true
                            },
                            onReject = {
                                selectedItemForAction = Pair(item, "REJECTED")
                                reviewerRemarks = ""
                                showRemarksDialog = true
                            }
                        )
                    }

                    item {
                        Spacer(modifier = Modifier.height(40.dp))
                    }
                }
            }
        }
    }

    // Biometric Confirmation Dialog before executing high-priority / principal action
    if (showBiometricGate && selectedItemForAction != null) {
        val (item, decision) = selectedItemForAction!!

        AlertDialog(
            onDismissRequest = { showBiometricGate = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.Fingerprint,
                    contentDescription = null,
                    tint = Color(0xFF38BDF8),
                    modifier = Modifier.size(44.dp)
                )
            },
            title = { Text("Biometric Executive Auth") },
            text = {
                Text(
                    "Authorize $decision of ${item.requestType.replace("_", " ")} for ${item.staffName} (${item.staffCode}) using device biometric credentials."
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showBiometricGate = false
                        viewModel.processApproval(item, decision)
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (decision == "APPROVED") Color(0xFF059669) else Color(0xFFDC2626)
                    )
                ) {
                    Text("Verify & Confirm $decision")
                }
            },
            dismissButton = {
                TextButton(onClick = { showBiometricGate = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Rejection Remarks Modal
    if (showRemarksDialog && selectedItemForAction != null) {
        val (item, decision) = selectedItemForAction!!

        AlertDialog(
            onDismissRequest = { showRemarksDialog = false },
            title = { Text("Reviewer Remarks (Optional)") },
            text = {
                Column {
                    Text(
                        text = "Specify reason for rejecting ${item.staffName}'s request:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = reviewerRemarks,
                        onValueChange = { reviewerRemarks = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("e.g. Incomplete supporting document / School function on date") },
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showRemarksDialog = false
                        viewModel.processApproval(item, decision, reviewerRemarks)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Text("Confirm Rejection")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRemarksDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ApprovalItemCard(
    item: PendingApprovalItem,
    isProcessing: Boolean,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val isLeave = item.requestType == "LEAVE_APPLICATION"
    val badgeColor = if (isLeave) Color(0xFF6366F1) else Color(0xFFF59E0B)

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = badgeColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = if (isLeave) "LEAVE APPLICATION" else "MISSED PUNCH REGULARIZATION",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor
                    )
                }

                Text(
                    text = item.submittedDate,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "${item.staffName} (${item.staffCode})",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleSmall
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = item.dateRangeOrPunchDate,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "“${item.reason}”",
                    modifier = Modifier.padding(10.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Buttons: Emerald Approve & Crimson Reject
            if (isProcessing) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(modifier = Modifier.size(28.dp), color = Color(0xFF4F46E5))
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onReject,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reject", fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Approve", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
