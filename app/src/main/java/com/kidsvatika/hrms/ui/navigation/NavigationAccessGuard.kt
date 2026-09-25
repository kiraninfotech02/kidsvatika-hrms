package com.kidsvatika.hrms.ui.navigation

import androidx.navigation.NavController

object NavigationAccessGuard {
    fun canAccess(route: String, userRole: String): Boolean {
        // Implement role-based route filtering logic
        return true
    }
}
