package com.kidsvatika.hrms.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "faqs")
data class FaqItemEntity(
    @PrimaryKey val id: String,
    val category: String,
    val question: String,
    val answerMarkdown: String,
    val videoThumbnailRes: Int?,
    val helpfulVotesCount: Int
)
