package com.kidsvatika.hrms.ui.components.scaffold

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.kidsvatika.hrms.ui.navigation.AppDestinations
import com.kidsvatika.hrms.ui.screens.*

@Composable
fun MainScaffold(navController: NavHostController, userRole: String) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Text("Campus Operations", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(16.dp))
                // Add drawer items here based on userRole
            }
        }
    ) {
        Scaffold(
            bottomBar = {
                // Dynamically render tabs based on userRole
                NavigationBar {
                    // Example tab
                    NavigationBarItem(
                        selected = true,
                        onClick = { navController.navigate(AppDestinations.Dashboard.route) },
                        label = { Text("Home") },
                        icon = { /* Icon */ }
                    )
                }
            },
            topBar = {
                TopAppBar(title = { Text("Kids Vatika HRMS") })
            }
        ) { paddingValues ->
            NavHost(
                navController = navController,
                startDestination = AppDestinations.Dashboard.route,
                modifier = Modifier.padding(paddingValues)
            ) {
                composable(AppDestinations.Dashboard.route) { /* DashboardScreen() */ }
                // Add other destinations
            }
        }
    }
}
