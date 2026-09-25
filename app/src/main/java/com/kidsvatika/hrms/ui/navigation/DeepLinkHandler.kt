package com.kidsvatika.hrms.ui.navigation

import android.content.Intent
import androidx.navigation.NavHostController
import com.kidsvatika.hrms.ui.navigation.AppDestinations

object DeepLinkHandler {
    fun handleDeepLink(intent: Intent?, navController: NavHostController) {
        val data = intent?.data ?: return
        when {
            data.toString().contains("approval/") -> {
                val id = data.lastPathSegment
                navController.navigate("approval/$id")
            }
            data.toString().contains("emergency_sos") -> {
                navController.navigate(AppDestinations.SosEmergencyCenter.route)
            }
        }
    }
}
