package com.kidsvatika.hrms.ui.screens

import android.location.Location
import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.kidsvatika.hrms.data.model.StaffUser
import com.kidsvatika.hrms.security.BiometricResult
import com.kidsvatika.hrms.security.BiometricSecurityManager
import com.kidsvatika.hrms.ui.viewmodel.QrScannerUiState
import com.kidsvatika.hrms.ui.viewmodel.QrScannerViewModel
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * ImageAnalysis.Analyzer integrating Google ML Kit BarcodeScanning for QR code detection.
 * Configured specifically for Barcode.FORMAT_QR_CODE with concurrency-safe debouncing.
 */
class QrCodeAnalyzer(
    private val debounceTimeMs: Long = 1500L,
    private val onQrCodeDetected: (payload: String) -> Unit
) : ImageAnalysis.Analyzer {

    companion object {
        private const val TAG = "QrCodeAnalyzer"
    }

    private val isAnalyzing = AtomicBoolean(false)
    private var lastScannedTimestamp: Long = 0L

    // Google ML Kit QR Client
    private val barcodeScanner = BarcodeScanning.getClient(
        BarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
            .build()
    )

    @androidx.annotation.OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        val currentTime = System.currentTimeMillis()

        if (mediaImage == null || isAnalyzing.get() || (currentTime - lastScannedTimestamp) < debounceTimeMs) {
            imageProxy.close()
            return
        }

        if (!isAnalyzing.compareAndSet(false, true)) {
            imageProxy.close()
            return
        }

        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        barcodeScanner.process(inputImage)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val rawValue = barcode.rawValue
                    if (!rawValue.isNullOrBlank()) {
                        Log.i(TAG, "ML Kit detected QR payload: $rawValue")
                        lastScannedTimestamp = System.currentTimeMillis()
                        onQrCodeDetected(rawValue)
                        break
                    }
                }
            }
            .addOnFailureListener { error ->
                Log.w(TAG, "ML Kit BarcodeScanning failed", error)
            }
            .addOnCompleteListener {
                isAnalyzing.set(false)
                imageProxy.close()
            }
    }
}

/**
 * QrScannerScreen composable for Kids Vatika HRMS.
 *
 * Architecture:
 * 1. CameraX preview via AndroidView with PreviewView and backpressure-safe ImageAnalysis.
 * 2. Google ML Kit BarcodeScanning.getClient() for QR code detection within QrCodeAnalyzer.
 * 3. Custom Canvas-based laser viewfinder with infinite animation and neon reticles.
 * 4. Torch control button toggling hardware flashlight via CameraControl.
 * 5. Attendance dispatch flow that triggers BiometricSecurityManager for authentication
 *    prior to calling viewModel.submitQrAttendance().
 */
@Composable
fun QrScannerScreen(
    staff: StaffUser,
    qrViewModel: QrScannerViewModel,
    biometricSecurityManager: BiometricSecurityManager? = null,
    onNavigateBack: () -> Unit
) {
    val viewModel = qrViewModel
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val activity = context as? FragmentActivity
    val uiState by qrViewModel.uiState.collectAsState()

    val securityManager = remember(context) {
        biometricSecurityManager ?: BiometricSecurityManager(context)
    }

    var cameraControl: CameraControl? by remember { mutableStateOf(null) }
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    // Google ML Kit QR Code Analyzer instance
    val qrAnalyzer = remember {
        QrCodeAnalyzer(
            debounceTimeMs = 1500L,
            onQrCodeDetected = { payload ->
                qrViewModel.onQrCodeScanned(staff.staffId, payload)
            }
        )
    }

    // Toggle hardware torch when ViewModel state changes
    LaunchedEffect(uiState) {
        val torchOn = (uiState as? QrScannerUiState.Scanning)?.isTorchOn ?: false
        cameraControl?.enableTorch(torchOn)
    }

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // 1. CameraX Preview using AndroidView
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build().also {
                            it.setAnalyzer(cameraExecutor, qrAnalyzer)
                        }

                    val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                    try {
                        cameraProvider.unbindAll()
                        val camera = cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            imageAnalysis
                        )
                        cameraControl = camera.cameraControl
                    } catch (e: Exception) {
                        Log.e("QrScanner", "CameraX bind failed", e)
                    }
                }, ContextCompat.getMainExecutor(ctx))

                previewView
            }
        )

        // 2. Custom Canvas-Based Laser Viewfinder with Infinite Animation
        QrScanningLaserOverlay(modifier = Modifier.fillMaxSize())

        // 3. Top Navigation & Torch Toggle Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 48.dp, start = 20.dp, end = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onNavigateBack,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.55f))
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }

            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.Black.copy(alpha = 0.65f),
                border = ButtonDefaults.outlinedButtonBorder
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "ML KIT QR SCANNER",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    )
                }
            }

            // Torch Toggle Button
            val isTorchOn = (uiState as? QrScannerUiState.Scanning)?.isTorchOn ?: false
            IconButton(
                onClick = { viewModel.toggleTorch() },
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (isTorchOn) Color(0xFFF59E0B) else Color.Black.copy(alpha = 0.55f))
            ) {
                Icon(
                    imageVector = if (isTorchOn) Icons.Default.FlashOn else Icons.Default.FlashOff,
                    contentDescription = "Torch Toggle",
                    tint = Color.White
                )
            }
        }

        // 4. Instructions Card
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp, start = 24.dp, end = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color(0xFF0F172A).copy(alpha = 0.88f),
                border = ButtonDefaults.outlinedButtonBorder
            ) {
                Text(
                    text = "Align Kids Vatika Campus Gate QR Code within frame",
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Medium
                    )
                )
            }
        }

        // 5. Attendance Dispatch Flow with BiometricSecurityManager Gating
        when (val state = uiState) {
            is QrScannerUiState.AwaitingBiometricAuth -> {
                // Triggers BiometricSecurityManager for authentication before calling viewModel.submitQrAttendance()
                LaunchedEffect(state) {
                    if (activity != null) {
                        securityManager.authenticateForAttendance(
                            activity = activity,
                            title = "Authorize QR Attendance",
                            subtitle = "Kids Vatika Gate Entry",
                            description = "Confirm hardware biometric identity to submit attendance."
                        ) { result ->
                            when (result) {
                                is BiometricResult.Success -> {
                                    // Hardware biometric verified -> Dispatch check-in API call
                                    viewModel.submitQrAttendance(
                                        staffId = staff.staffId,
                                        payload = state.rawPayload,
                                        location = state.location,
                                        distanceMetres = state.distanceMetres
                                    )
                                }
                                is BiometricResult.Failed -> {
                                    viewModel.onBiometricFailed(result.message)
                                }
                                is BiometricResult.Error -> {
                                    viewModel.onBiometricFailed(result.errString.toString())
                                }
                                is BiometricResult.Cancelled -> {
                                    viewModel.onBiometricFailed("Biometric check-in was cancelled.")
                                }
                            }
                        }
                    } else {
                        viewModel.submitQrAttendance(
                            staffId = staff.staffId,
                            payload = state.rawPayload,
                            location = state.location,
                            distanceMetres = state.distanceMetres
                        )
                    }
                }
            }

            is QrScannerUiState.Submitting -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.72f)),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            CircularProgressIndicator(color = Color(0xFF38BDF8))
                            Text(
                                text = state.message,
                                color = Color.White,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }

            is QrScannerUiState.Success -> {
                AlertDialog(
                    onDismissRequest = {
                        viewModel.resumeScanning()
                        onNavigateBack()
                    },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF22C55E),
                            modifier = Modifier.size(48.dp)
                        )
                    },
                    title = {
                        Text(text = "QR CHECK-IN RECORDED", fontWeight = FontWeight.Bold)
                    },
                    text = {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(text = state.response.message)
                            Text(
                                text = "Punch Time: ${state.response.punchTime}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF94A3B8)
                            )
                            Text(
                                text = "Reference ID: ${state.response.attendanceId}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF94A3B8)
                            )
                            Text(
                                text = "Security: ML Kit + Hardware Biometric Verified ✓",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF38BDF8)
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                viewModel.resumeScanning()
                                onNavigateBack()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
                        ) {
                            Text("Done")
                        }
                    }
                )
            }

            is QrScannerUiState.Error -> {
                AlertDialog(
                    onDismissRequest = { viewModel.resumeScanning() },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = null,
                            tint = Color(0xFFEF4444),
                            modifier = Modifier.size(48.dp)
                        )
                    },
                    title = { Text(text = "Scanner Notice", fontWeight = FontWeight.Bold) },
                    text = { Text(state.message) },
                    confirmButton = {
                        Button(onClick = { viewModel.resumeScanning() }) {
                            Text("Scan Again")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = onNavigateBack) {
                            Text("Cancel")
                        }
                    }
                )
            }

            else -> Unit
        }
    }
}

/**
 * Custom Canvas-Based Laser Viewfinder with Infinite Animation.
 *
 * Visual Components:
 * 1. Darkened vignette cutout mask (PathFillType.EvenOdd) with rounded rectangular bounds.
 * 2. Neon cyan corner brackets.
 * 3. Animated vertical laser beam sweeping infinitely using rememberInfiniteTransition.
 */
@Composable
fun QrScanningLaserOverlay(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "laser_infinite_sweep")
    val laserProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserProgress"
    )

    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val boxSize = width * 0.72f
        val left = (width - boxSize) / 2f
        val top = (height - boxSize) / 2f - 40f
        val right = left + boxSize
        val bottom = top + boxSize
        val cornerLength = 36.dp.toPx()
        val cornerStroke = 4.dp.toPx()
        val reticleColor = Color(0xFF06B6D4)

        // 1. Cutout Mask with Rounded Rectangular Viewport
        drawPath(
            path = Path().apply {
                addRect(Rect(0f, 0f, width, height))
                addRoundRect(
                    androidx.compose.ui.geometry.RoundRect(
                        left = left,
                        top = top,
                        right = right,
                        bottom = bottom,
                        cornerRadius = CornerRadius(24.dp.toPx(), 24.dp.toPx())
                    )
                )
                fillType = PathFillType.EvenOdd
            },
            color = Color.Black.copy(alpha = 0.65f)
        )

        // 2. High-precision neon corner reticles
        // Top-Left corner
        drawLine(reticleColor, Offset(left, top + cornerLength), Offset(left, top), cornerStroke)
        drawLine(reticleColor, Offset(left, top), Offset(left + cornerLength, top), cornerStroke)
        // Top-Right corner
        drawLine(reticleColor, Offset(right - cornerLength, top), Offset(right, top), cornerStroke)
        drawLine(reticleColor, Offset(right, top), Offset(right, top + cornerLength), cornerStroke)
        // Bottom-Left corner
        drawLine(reticleColor, Offset(left, bottom - cornerLength), Offset(left, bottom), cornerStroke)
        drawLine(reticleColor, Offset(left, bottom), Offset(left + cornerLength, bottom), cornerStroke)
        // Bottom-Right corner
        drawLine(reticleColor, Offset(right - cornerLength, bottom), Offset(right, bottom), cornerStroke)
        drawLine(reticleColor, Offset(right, bottom), Offset(right, bottom - cornerLength), cornerStroke)

        // 3. Infinite Animated Laser Scanline
        val laserY = top + (boxSize * laserProgress)
        drawLine(
            brush = Brush.horizontalGradient(
                colors = listOf(
                    Color.Transparent,
                    Color(0xFF22C55E),
                    Color(0xFF06B6D4),
                    Color(0xFF22C55E),
                    Color.Transparent
                )
            ),
            start = Offset(left + 8f, laserY),
            end = Offset(right - 8f, laserY),
            strokeWidth = 3.dp.toPx()
        )
    }
}
