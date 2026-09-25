package com.kidsvatika.hrms.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kidsvatika.hrms.data.model.StaffAttendanceStatusItem
import com.kidsvatika.hrms.data.model.StaffUser
import com.kidsvatika.hrms.ui.viewmodel.AdminDashboardViewModel
import com.kidsvatika.hrms.ui.viewmodel.RosterFilter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    staff: StaffUser,
    viewModel: AdminDashboardViewModel,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onNavigateToApprovals: () -> Unit,
    onNavigateToBroadcast: () -> Unit,
    onLogout: () -> Unit
) {
    val rosterState by viewModel.rosterUiState.collectAsState()
    val approvalsState by viewModel.approvalsUiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Principal Portal",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFFFBBF24)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFFD97706).copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = staff.role,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFFBBF24)
                                )
                            }
                        }
                        Text(
                            text = "Kids Vatika Smart School • Live Campus",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                actions = {
                    IconButton(onClick = onNavigateToBroadcast) {
                        BadgedBox(
                            badge = {
                                Badge(containerColor = Color(0xFFE11D48)) {
                                    Text("FCM", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = "Broadcast Notice",
                                tint = Color(0xFF38BDF8)
                            )
                        }
                    }

                    IconButton(onClick = onToggleTheme) {
                        Icon(
                            imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = "Toggle Theme",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Outlined.ExitToApp,
                            contentDescription = "Logout",
                            tint = Color(0xFFEF4444)
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToApprovals,
                containerColor = Color(0xFF4F46E5),
                contentColor = Color.White,
                icon = {
                    BadgedBox(
                        badge = {
                            if (approvalsState.pendingApprovals.isNotEmpty()) {
                                Badge(containerColor = Color(0xFFEF4444)) {
                                    Text("${approvalsState.pendingApprovals.size}")
                                }
                            }
                        }
                    ) {
                        Icon(Icons.Default.AssignmentLate, contentDescription = null)
                    }
                },
                text = { Text("Approvals (${approvalsState.pendingApprovals.size})", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Offline Mode Banner if active
            if (rosterState.isOfflineMode) {
                item {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFB45309).copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CloudOff, contentDescription = null, tint = Color(0xFFF59E0B))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Offline Resilience Active: Viewing cached roster from Room Database.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFFDE68A)
                            )
                        }
                    }
                }
            }

            // 1. Metric Banner Cards
            item {
                Text(
                    text = "Today's Campus Occupancy",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "Total Staff",
                        value = rosterState.totalStaff.toString(),
                        subtitle = "Enrolled",
                        icon = Icons.Default.Groups,
                        tint = Color(0xFF6366F1),
                        background = Color(0xFF6366F1).copy(alpha = 0.1f)
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "On-Campus",
                        value = rosterState.presentCount.toString(),
                        subtitle = "Present Now",
                        icon = Icons.Default.CheckCircle,
                        tint = Color(0xFF10B981),
                        background = Color(0xFF10B981).copy(alpha = 0.1f)
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "Late Arrivals",
                        value = rosterState.lateCount.toString(),
                        subtitle = "> 9:15 AM",
                        icon = Icons.Default.Alarm,
                        tint = Color(0xFFF59E0B),
                        background = Color(0xFFF59E0B).copy(alpha = 0.1f)
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "Absentees",
                        value = rosterState.absentCount.toString(),
                        subtitle = "Unreported",
                        icon = Icons.Default.Cancel,
                        tint = Color(0xFFEF4444),
                        background = Color(0xFFEF4444).copy(alpha = 0.1f)
                    )
                }
            }

            // 2. Search Box
            item {
                OutlinedTextField(
                    value = rosterState.searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search staff by name, code, dept...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    },
                    trailingIcon = {
                        if (rosterState.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }

            // 3. Status Filter Chips
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(RosterFilter.entries.toTypedArray()) { filter ->
                        val isSelected = rosterState.selectedFilter == filter
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.setFilter(filter) },
                            label = {
                                Text(
                                    text = when (filter) {
                                        RosterFilter.ALL -> "All (${rosterState.totalStaff})"
                                        RosterFilter.PRESENT -> "Present (${rosterState.presentCount})"
                                        RosterFilter.LATE -> "Late (${rosterState.lateCount})"
                                        RosterFilter.ABSENT -> "Absent (${rosterState.absentCount})"
                                        RosterFilter.ON_LEAVE -> "On Leave (${rosterState.leaveCount})"
                                    },
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFF4F46E5),
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }

            // 4. Roster List Header & Swipe-to-Refresh trigger
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Campus Roster (${rosterState.filteredRoster.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(
                        onClick = { viewModel.loadCampusRoster(isRefresh = true) },
                        enabled = !rosterState.isRefreshing
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh Roster",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // 5. Staff Cards List
            if (rosterState.isLoading && !rosterState.isRefreshing) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF4F46E5))
                    }
                }
            } else if (rosterState.filteredRoster.isEmpty()) {
                item {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.SearchOff, contentDescription = null, modifier = Modifier.size(44.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "No staff members match this filter",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(rosterState.filteredRoster, key = { it.staffId }) { staffItem ->
                    StaffRosterCard(staffItem = staffItem)
                }
            }

            item {
                Spacer(modifier = Modifier.height(72.dp))
            }
        }
    }
}

@Composable
fun MetricCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    background: Color
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = background,
        border = androidx.compose.foundation.BorderStroke(1.dp, tint.copy(alpha = 0.25f))
    ) {
        Column(
            modifier = Modifier.padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = tint,
                    fontWeight = FontWeight.SemiBold
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun StaffRosterCard(staffItem: StaffAttendanceStatusItem) {
    val statusColor = when (staffItem.punchStatus) {
        "PRESENT" -> Color(0xFF10B981)
        "LATE" -> Color(0xFFF59E0B)
        "ON_LEAVE" -> Color(0xFF38BDF8)
        else -> Color(0xFFEF4444)
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar with Status Rim
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF4F46E5), Color(0xFF7C3AED))
                            )
                        )
                        .border(2.dp, statusColor, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = staffItem.name.take(2).uppercase(),
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 15.sp
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = staffItem.name,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.bodyLarge,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = statusColor.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = staffItem.punchStatus,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = statusColor
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${staffItem.staffCode} • ${staffItem.designation}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
            Spacer(modifier = Modifier.height(8.dp))

            // Punch Details Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        modifier = Modifier.size(15.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = staffItem.checkInTime ?: "Not punched yet",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (staffItem.checkInTime != null) MaterialTheme.colorScheme.onSurface else Color(0xFFEF4444),
                        fontWeight = if (staffItem.checkInTime != null) FontWeight.Medium else FontWeight.Normal
                    )
                }

                if (staffItem.verificationMode != null) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.VerifiedUser,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = Color(0xFF10B981)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = staffItem.verificationMode,
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF10B981),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                if (staffItem.checkInDistanceMetres != null) {
                    Text(
                        text = "${staffItem.checkInDistanceMetres.toInt()}m from gate",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
