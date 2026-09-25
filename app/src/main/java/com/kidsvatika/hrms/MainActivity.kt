package com.kidsvatika.hrms

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.kidsvatika.hrms.security.BiometricResult
import com.kidsvatika.hrms.security.BiometricSecurityManager
import com.kidsvatika.hrms.ui.screens.*
import com.kidsvatika.hrms.ui.theme.KidsVatikaTheme
import com.kidsvatika.hrms.ui.viewmodel.AdminDashboardViewModel
import com.kidsvatika.hrms.ui.viewmodel.AttendanceViewModel
import com.kidsvatika.hrms.ui.viewmodel.AuthViewModel
import com.kidsvatika.hrms.ui.viewmodel.QrScannerViewModel
import com.kidsvatika.hrms.utils.NotificationHelper

class MainActivity : FragmentActivity() {

    private val authViewModel: AuthViewModel by viewModels()
    private val attendanceViewModel: AttendanceViewModel by viewModels()
    private val qrScannerViewModel: QrScannerViewModel by viewModels()
    private val adminDashboardViewModel: AdminDashboardViewModel by viewModels()
    val biometricSecurityManager: BiometricSecurityManager by lazy { BiometricSecurityManager(this) }

    @OptIn(ExperimentalPermissionsApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(biometricSecurityManager)

        // Read intent extras from FCM push click
        val initialAction = intent?.action
        val navigateToTarget = intent?.getStringExtra("navigate_to")
            ?: if (initialAction == NotificationHelper.ACTION_CHECK_IN) "attendance_camera" else null

        setContent {
            var isDarkTheme by remember { mutableStateOf(true) }
            var isBiometricUnlocked by remember { mutableStateOf(false) }
            var showBroadcastDialog by remember { mutableStateOf(false) }

            KidsVatikaTheme(darkTheme = isDarkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val loggedStaff by authViewModel.loggedStaff.collectAsState()

                    // Request essential permissions (Fine Location, Camera, POST_NOTIFICATIONS)
                    val permissionsToRequest = buildList {
                        add(Manifest.permission.ACCESS_FINE_LOCATION)
                        add(Manifest.permission.ACCESS_COARSE_LOCATION)
                        add(Manifest.permission.CAMERA)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }

                    val permissionState = rememberMultiplePermissionsState(permissions = permissionsToRequest)

                    LaunchedEffect(Unit) {
                        if (!permissionState.allPermissionsGranted) {
                            permissionState.launchMultiplePermissionRequest()
                        }
                    }

                    // Biometric Security Gate on Application Launch / Resume
                    val currentStaff = loggedStaff
                    if (currentStaff != null && !isBiometricUnlocked) {
                        BiometricAppLockScreen(
                            staffName = currentStaff.name,
                            onAuthenticate = {
                                biometricSecurityManager.authenticateForAppUnlock(
                                    activity = this@MainActivity,
                                    staffName = currentStaff.name
                                ) { result ->
                                    if (result is BiometricResult.Success) {
                                        isBiometricUnlocked = true
                                    }
                                }
                            }
                        )
                    } else {
                        NavHost(
                            navController = navController,
                            startDestination = "login"
                        ) {
                            composable("login") {
                                LoginScreen(
                                    authViewModel = authViewModel,
                                    onLoginSuccess = {
                                        isBiometricUnlocked = true
                                        val staff = authViewModel.loggedStaff.value
                                        val destination = if (staff?.isExecutiveOrAdmin == true) {
                                            "admin_dashboard"
                                        } else {
                                            "dashboard"
                                        }

                                        navController.navigate(destination) {
                                            popUpTo("login") { inclusive = true }
                                        }

                                        if (navigateToTarget == "attendance_camera") {
                                            navController.navigate("attendance_camera")
                                        }
                                    }
                                )
                            }

                            // Staff Personal Dashboard
                            composable("dashboard") {
                                val staff = loggedStaff
                                if (staff != null) {
                                    DashboardScreen(
                                        staff = staff,
                                        attendanceViewModel = attendanceViewModel,
                                        isDarkTheme = isDarkTheme,
                                        onToggleTheme = { isDarkTheme = !isDarkTheme },
                                        onNavigateToCheckIn = {
                                            navController.navigate("attendance_camera")
                                        },
                                        onNavigateToQrScanner = {
                                            navController.navigate("qr_scanner")
                                        },
                                        onNavigateToAdmin = {
                                            if (staff.isExecutiveOrAdmin) {
                                                navController.navigate("admin_dashboard")
                                            }
                                        },
                                        onLogout = {
                                            isBiometricUnlocked = false
                                            authViewModel.logout()
                                            navController.navigate("login") {
                                                popUpTo(0) { inclusive = true }
                                            }
                                        }
                                    )
                                } else {
                                    LaunchedEffect(Unit) {
                                        navController.navigate("login") {
                                            popUpTo(0) { inclusive = true }
                                        }
                                    }
                                }
                            }

                            // Principal & Management Executive Dashboard (RBAC Protected)
                            composable("admin_dashboard") {
                                val staff = loggedStaff
                                if (staff != null && staff.isExecutiveOrAdmin) {
                                    AdminDashboardScreen(
                                        staff = staff,
                                        viewModel = adminDashboardViewModel,
                                        isDarkTheme = isDarkTheme,
                                        onToggleTheme = { isDarkTheme = !isDarkTheme },
                                        onNavigateToApprovals = {
                                            navController.navigate("approval_queue")
                                        },
                                        onNavigateToBroadcast = {
                                            showBroadcastDialog = true
                                        },
                                        onLogout = {
                                            isBiometricUnlocked = false
                                            authViewModel.logout()
                                            navController.navigate("login") {
                                                popUpTo(0) { inclusive = true }
                                            }
                                        }
                                    )

                                    if (showBroadcastDialog) {
                                        BroadcastNoticeDialog(
                                            staff = staff,
                                            viewModel = adminDashboardViewModel,
                                            onDismiss = { showBroadcastDialog = false },
                                            onBroadcastSent = {
                                                showBroadcastDialog = false
                                            }
                                        )
                                    }
                                } else {
                                    // Unauthorized or unauthenticated: redirect to personal staff dashboard or login
                                    LaunchedEffect(Unit) {
                                        if (staff != null) {
                                            navController.navigate("dashboard") {
                                                popUpTo("admin_dashboard") { inclusive = true }
                                            }
                                        } else {
                                            navController.navigate("login") {
                                                popUpTo(0) { inclusive = true }
                                            }
                                        }
                                    }
                                }
                            }

                            // Leave & Regularization Approval Engine
                            composable("approval_queue") {
                                val staff = loggedStaff
                                if (staff != null && staff.isExecutiveOrAdmin) {
                                    ApprovalQueueScreen(
                                        viewModel = adminDashboardViewModel,
                                        biometricSecurityManager = biometricSecurityManager,
                                        onNavigateBack = {
                                            navController.popBackStack()
                                        }
                                    )
                                } else {
                                    LaunchedEffect(Unit) {
                                        navController.popBackStack()
                                    }
                                }
                            }

                            composable("attendance_camera") {
                                val staff = loggedStaff
                                if (staff != null) {
                                    AttendanceCameraScreen(
                                        staff = staff,
                                        attendanceViewModel = attendanceViewModel,
                                        onNavigateBack = {
                                            navController.popBackStack()
                                        }
                                    )
                                }
                            }

                            composable("qr_scanner") {
                                val staff = loggedStaff
                                if (staff != null) {
                                    QrScannerScreen(
                                        staff = staff,
                                        qrViewModel = qrScannerViewModel,
                                        onNavigateBack = {
                                            navController.popBackStack()
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
