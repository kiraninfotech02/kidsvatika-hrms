package com.kidsvatika.hrms.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun PhoneEmulator(content: @Composable () -> Unit) {
    Box(modifier = Modifier
        .padding(16.dp)
        .size(width = 300.dp, height = 600.dp)
        .border(8.dp, Color.Black, RoundedCornerShape(32.dp))
        .background(Color.White, RoundedCornerShape(32.dp))
        .padding(16.dp)) {
        content()
    }
}
