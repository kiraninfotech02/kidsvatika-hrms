package com.kidsvatika.hrms.ui.navigation

sealed class AppDestinations(val route: String) {
    object Splash : AppDestinations("splash")
    object Login : AppDestinations("login")
    object Dashboard : AppDestinations("dashboard")
    object CameraPunch : AppDestinations("camera_punch")
    object TeacherTimetable : AppDestinations("timetable")
    object BusTransit : AppDestinations("bus_transit")
    object SosEmergencyCenter : AppDestinations("sos_emergency")
    // Add other routes as needed
}
