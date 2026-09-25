package com.kidsvatika.hrms.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow

class EmergencyViewModel : ViewModel() {
    val panicProgress = MutableStateFlow(0.0f)

    fun startPanicHold() {
        // Implementation
    }
}
