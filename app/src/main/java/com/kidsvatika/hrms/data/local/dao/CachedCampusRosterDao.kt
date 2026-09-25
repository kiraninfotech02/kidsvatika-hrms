package com.kidsvatika.hrms.data.local.dao

import androidx.room.*
import com.kidsvatika.hrms.data.local.entity.CachedCampusRosterEntity
import kotlinx.coroutines.flow.Flow

/**
 * Room DAO for accessing cached campus attendance roster data offline.
 */
@Dao
interface CachedCampusRosterDao {

    @Query("SELECT * FROM cached_campus_roster WHERE roster_date = :date ORDER BY name ASC")
    fun getRosterFlowForDate(date: String): Flow<List<CachedCampusRosterEntity>>

    @Query("SELECT * FROM cached_campus_roster WHERE roster_date = :date ORDER BY name ASC")
    suspend fun getRosterForDate(date: String): List<CachedCampusRosterEntity>

    @Query("SELECT * FROM cached_campus_roster ORDER BY cached_at_timestamp DESC")
    fun getLatestRosterFlow(): Flow<List<CachedCampusRosterEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRosterBatch(roster: List<CachedCampusRosterEntity>)

    @Query("DELETE FROM cached_campus_roster WHERE roster_date = :date")
    suspend fun clearRosterForDate(date: String)

    @Query("DELETE FROM cached_campus_roster")
    suspend fun clearAll()
}
