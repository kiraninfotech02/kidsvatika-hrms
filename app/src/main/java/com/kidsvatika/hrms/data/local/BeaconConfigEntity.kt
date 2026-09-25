package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "beacon_config")
data class BeaconConfigEntity(
    @PrimaryKey val beaconId: String,
    val uuid: String,
    val major: Int,
    val minor: Int,
    val locationTag: String
)
