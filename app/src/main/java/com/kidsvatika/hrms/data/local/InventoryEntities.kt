package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "inventory_assets")
data class InventoryAssetEntity(
    @PrimaryKey val assetId: String,
    val barcodeTag: String,
    val assetName: String,
    val category: String,
    val isAvailable: Boolean
)

@Entity(tableName = "cached_asset_checkouts")
data class CachedAssetCheckoutEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val assetId: String,
    val type: String, // "CHECKOUT" or "RETURN"
    val timestamp: String,
    val isSynced: Boolean = false
)
