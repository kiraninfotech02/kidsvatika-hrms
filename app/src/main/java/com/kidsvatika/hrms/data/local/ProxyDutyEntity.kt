package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "proxy_duties")
data class ProxyDutyEntity(
    @PrimaryKey val proxyId: String,
    val originalTeacherId: Int,
    val assignedTeacherId: Int,
    val periodNumber: Int,
    val className: String,
    val date: String,
    val status: String
)
