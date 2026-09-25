package com.kidsvatika.hrms.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

enum class TripState {
    TRIP_NOT_STARTED, TRIP_IN_PROGRESS, TRIP_PAUSED, TRIP_COMPLETED
}

class BusTransitViewModel : ViewModel() {
    private val _tripState = MutableStateFlow(TripState.TRIP_NOT_STARTED)
    val tripState: StateFlow<TripState> = _tripState

    fun startTrip() {
        _tripState.value = TripState.TRIP_IN_PROGRESS
    }

    fun endTrip() {
        _tripState.value = TripState.TRIP_COMPLETED
    }

    fun markStudentBoarded(studentId: Int) {
        // Implementation: Update status in Room and queue sync
    }
}

class VisitorPassViewModel : ViewModel() {
    // Implement visitor registration & check-out logic
}

class AppraisalViewModel : ViewModel() {
    // Implement KPI aggregation & self-appraisal logic
}
