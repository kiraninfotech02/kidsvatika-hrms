package com.kidsvatika.hrms.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kidsvatika.hrms.data.model.ProxyDutyItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ProxyViewModel : ViewModel() {
    private val _proxyDuties = MutableStateFlow<List<ProxyDutyItem>>(emptyList())
    val proxyDuties: StateFlow<List<ProxyDutyItem>> = _proxyDuties

    init {
        loadProxyDuties()
    }

    private fun loadProxyDuties() {
        // Implementation: Fetch from Room then refresh from API
    }

    fun respondToDuty(proxyId: String, accept: Boolean) {
        viewModelScope.launch {
            // Implementation: API call + Room update
        }
    }
}
