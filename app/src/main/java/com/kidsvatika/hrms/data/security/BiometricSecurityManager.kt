package com.kidsvatika.hrms.data.security

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import java.lang.ref.WeakReference

/**
 * Comprehensive Biometric Status Enum representing device biometric & security hardware availability.
 */
enum class BiometricStatus {
    AVAILABLE,
    NOT_ENROLLED,
    HARDWARE_MISSING,
    HARDWARE_UNAVAILABLE,
    SECURITY_UPDATE_REQUIRED,
    UNSUPPORTED;

    val isAvailable: Boolean
        get() = this == AVAILABLE
}

/**
 * Biometric Authentication Callback Results
 */
sealed class BiometricResult {
    data class Success(val cryptoObject: BiometricPrompt.CryptoObject? = null) : BiometricResult()
    data class Failed(val message: String) : BiometricResult()
    data class Error(
        val errorCode: Int,
        val errString: CharSequence,
        val isCanceledByUser: Boolean = false
    ) : BiometricResult()
    object Cancelled : BiometricResult()
}

/**
 * Lifecycle-aware Hardware Biometric Security Manager for Kids Vatika HRMS.
 *
 * Requirements:
 * - Lifecycle-aware authentication observing DefaultLifecycleObserver to auto-cancel prompts onStop/onDestroy.
 * - Hardware Biometric Security using AndroidX BiometricPrompt with BIOMETRIC_STRONG or DEVICE_CREDENTIAL fallback.
 * - Comprehensive error handling for ERROR_NO_BIOMETRICS, ERROR_HW_UNAVAILABLE, ERROR_LOCKOUT, ERROR_USER_CANCELED.
 * - Gated execution paths:
 *     1. Application Launch / Resume Gate: authenticate staff before revealing dashboard.
 *     2. Attendance Submission Gate: mandatory challenge immediately before final attendance submission.
 */
class BiometricSecurityManager(
    private val context: Context
) : DefaultLifecycleObserver {

    companion object {
        private const val TAG = "BiometricSecurity"

        // Enforce strong hardware biometrics (Fingerprint / 3D Face) with fallback to PIN/Pattern/Password
        val ALLOWED_AUTHENTICATORS = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            BIOMETRIC_STRONG or DEVICE_CREDENTIAL
        } else {
            BIOMETRIC_STRONG or DEVICE_CREDENTIAL
        }
    }

    private val biometricManager: BiometricManager = BiometricManager.from(context)
    private var activePromptRef: WeakReference<BiometricPrompt>? = null

    /**
     * Cancel active prompt when observing lifecycle onStop
     */
    override fun onStop(owner: LifecycleOwner) {
        super.onStop(owner)
        cancelActivePrompt()
    }

    /**
     * Cleanup prompt and observer on lifecycle onDestroy
     */
    override fun onDestroy(owner: LifecycleOwner) {
        super.onDestroy(owner)
        cancelActivePrompt()
        owner.lifecycle.removeObserver(this)
    }

    /**
     * Safely cancels any active BiometricPrompt session to avoid window leak and crash states.
     */
    fun cancelActivePrompt() {
        try {
            activePromptRef?.get()?.cancelAuthentication()
        } catch (e: Exception) {
            Log.w(TAG, "Error cancelling active BiometricPrompt", e)
        } finally {
            activePromptRef = null
        }
    }

    /**
     * Checks if biometric sensor or device credential lock is operable on the device.
     */
    fun checkBiometricAvailability(): BiometricStatus {
        return when (val code = biometricManager.canAuthenticate(ALLOWED_AUTHENTICATORS)) {
            BiometricManager.BIOMETRIC_SUCCESS -> BiometricStatus.AVAILABLE
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
                Log.w(TAG, "No biometric or screen lock enrolled")
                BiometricStatus.NOT_ENROLLED
            }
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
                Log.w(TAG, "Device lacks biometric sensor hardware")
                BiometricStatus.HARDWARE_MISSING
            }
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> {
                Log.w(TAG, "Biometric hardware is busy or temporarily unavailable")
                BiometricStatus.HARDWARE_UNAVAILABLE
            }
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> {
                BiometricStatus.SECURITY_UPDATE_REQUIRED
            }
            else -> {
                Log.e(TAG, "Biometrics unsupported or error code: $code")
                BiometricStatus.UNSUPPORTED
            }
        }
    }

    /**
     * Gated Path A: Application Launch / Resume Biometric Challenge
     * Prompts staff to authenticate via fingerprint, face, or device screen lock before revealing dashboard.
     */
    fun authenticateForAppUnlock(
        activity: FragmentActivity,
        staffName: String = "Staff Member",
        onResult: (BiometricResult) -> Unit
    ) {
        promptBiometricAuthentication(
            activity = activity,
            title = "Kids Vatika HRMS Security",
            subtitle = "Welcome back, $staffName",
            description = "Confirm fingerprint, face, or device lock credentials to access staff dashboard.",
            onResult = onResult
        )
    }

    /**
     * Gated Path B: Attendance Submission Gate (CameraX Selfie flow or ML Kit QR Scan flow)
     * Mandatory biometric verification immediately prior to final check-in payload submission.
     */
    fun authenticateForAttendance(
        activity: FragmentActivity,
        title: String = "Staff Biometric Verification",
        subtitle: String = "Kids Vatika Smart School Attendance",
        description: String = "Confirm identity using fingerprint or device security to authorize attendance submission.",
        onResult: (BiometricResult) -> Unit
    ) {
        promptBiometricAuthentication(
            activity = activity,
            title = title,
            subtitle = subtitle,
            description = description,
            onResult = onResult
        )
    }

    /**
     * Launches the official Android BiometricPrompt with comprehensive error handling:
     * Handles ERROR_NO_BIOMETRICS, ERROR_HW_UNAVAILABLE, ERROR_LOCKOUT, and ERROR_USER_CANCELED.
     */
    fun promptBiometricAuthentication(
        activity: FragmentActivity,
        title: String = "Staff Biometric Verification",
        subtitle: String = "Kids Vatika Smart School Attendance",
        description: String = "Confirm identity using fingerprint or device security to authorize action.",
        onResult: (BiometricResult) -> Unit
    ) {
        // Register lifecycle observer to automatically cancel prompt on lifecycle transition
        activity.lifecycle.addObserver(this)

        val executor = ContextCompat.getMainExecutor(activity)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                Log.i(TAG, "Biometric authentication SUCCEEDED")
                activePromptRef = null
                onResult(BiometricResult.Success(result.cryptoObject))
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                Log.w(TAG, "Biometric error [$errorCode]: $errString")
                activePromptRef = null

                when (errorCode) {
                    BiometricPrompt.ERROR_USER_CANCELED,
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON,
                    BiometricPrompt.ERROR_CANCELED -> {
                        onResult(BiometricResult.Cancelled)
                    }
                    BiometricPrompt.ERROR_LOCKOUT,
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "Too many failed attempts. Device temporarily locked. Please use device PIN or Pattern fallback.",
                                isCanceledByUser = false
                            )
                        )
                    }
                    BiometricPrompt.ERROR_NO_BIOMETRICS -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "No biometric credentials registered on device. Setup fingerprint in Android Settings.",
                                isCanceledByUser = false
                            )
                        )
                    }
                    BiometricPrompt.ERROR_HW_UNAVAILABLE -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "Biometric sensor hardware is busy. Please try again.",
                                isCanceledByUser = false
                            )
                        )
                    }
                    BiometricPrompt.ERROR_TIMEOUT -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "Biometric sensor timed out waiting for input.",
                                isCanceledByUser = false
                            )
                        )
                    }
                    else -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = errString,
                                isCanceledByUser = false
                            )
                        )
                    }
                }
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                Log.w(TAG, "Biometric sensor touch did not match fingerprint/face")
                onResult(BiometricResult.Failed("Biometric identity not recognized. Please tap sensor again."))
            }
        }

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setConfirmationRequired(true)
            .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS)
            .build()

        val prompt = BiometricPrompt(activity, executor, callback)
        activePromptRef = WeakReference(prompt)
        prompt.authenticate(promptInfo)
    }
}

/**
 * Backward compatibility typealias
 */
typealias BiometricAuthManager = BiometricSecurityManager
