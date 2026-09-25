package com.kidsvatika.hrms

import androidx.compose.runtime.Composable
import androidx.navigation.compose.rememberNavController
import com.kidsvatika.hrms.ui.components.scaffold.MainScaffold

@Composable
fun KidsVatikaApp() {
    val navController = rememberNavController()
    // Assume userRole is managed in a shared session state
    MainScaffold(navController = navController, userRole = "STAFF")
}
