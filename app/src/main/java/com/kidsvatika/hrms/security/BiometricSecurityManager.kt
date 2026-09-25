package com.kidsvatika.hrms.security

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
 * Biometric Status Enum representing device security and biometric hardware readiness.
 */
enum class BiometricStatus {
    READY,
    NOT_ENROLLED,
    NO_HARDWARE,
    HW_UNAVAILABLE;

    val isReady: Boolean
        get() = this == READY

    val isAvailable: Boolean
        get() = this == READY

    val requiresEnrollment: Boolean
        get() = this == NOT_ENROLLED
}

/**
 * Sealed result type for BiometricPrompt callbacks.
 */
sealed class BiometricResult {
    data class Success(
        val result: BiometricPrompt.AuthenticationResult? = null,
        val cryptoObject: BiometricPrompt.CryptoObject? = result?.cryptoObject
    ) : BiometricResult()
    data class Failed(val message: String = "Biometric signature not recognized.") : BiometricResult()
    data class Error(
        val errorCode: Int,
        val errString: CharSequence,
        val isUserCancelled: Boolean = false
    ) : BiometricResult()
    object Cancelled : BiometricResult()
}

/**
 * Lifecycle-safe Hardware Biometric Security Manager for Kids Vatika HRMS.
 *
 * Package: com.kidsvatika.hrms.security
 *
 * Key Capabilities:
 * - Helper method `canAuthenticate(context: Context)` checking BIOMETRIC_STRONG and device credential capability.
 * - Lifecycle-safe `authenticate()` function using AndroidX BiometricPrompt.
 * - Automatic cancellation on lifecycle events (onStop/onDestroy) to prevent memory and window leaks.
 * - Comprehensive error handling for ERROR_USER_CANCELED, ERROR_LOCKOUT, ERROR_LOCKOUT_PERMANENT, ERROR_TIMEOUT, etc.
 */
class BiometricSecurityManager(
    private val context: Context
) : DefaultLifecycleObserver {

    companion object {
        const val TAG = "BiometricSecurity"

        // Enforce strong hardware biometrics (Fingerprint / 3D Face) with device credentials fallback
        const val ALLOWED_AUTHENTICATORS = BIOMETRIC_STRONG or DEVICE_CREDENTIAL

        /**
         * Context-based helper method that checks for BIOMETRIC_STRONG and device credential capability.
         *
         * @param context Application or Activity context
         * @return BiometricStatus indicating availability, enrollment, or hardware state.
         */
        fun canAuthenticate(context: Context): BiometricStatus {
            val biometricManager = BiometricManager.from(context)
            return when (val code = biometricManager.canAuthenticate(ALLOWED_AUTHENTICATORS)) {
                BiometricManager.BIOMETRIC_SUCCESS -> {
                    Log.d(TAG, "Biometrics available and enrolled")
                    BiometricStatus.READY
                }
                BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
                    Log.w(TAG, "No biometric or screen lock enrolled")
                    BiometricStatus.NOT_ENROLLED
                }
                BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
                    Log.w(TAG, "Device lacks biometric sensor hardware")
                    BiometricStatus.NO_HARDWARE
                }
                BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> {
                    Log.w(TAG, "Biometric hardware is temporarily unavailable")
                    BiometricStatus.HW_UNAVAILABLE
                }
                BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> {
                    Log.w(TAG, "Security update required for biometric hardware")
                    BiometricStatus.HW_UNAVAILABLE
                }
                else -> {
                    Log.e(TAG, "canAuthenticate returned unsupported code: $code")
                    BiometricStatus.HW_UNAVAILABLE
                }
            }
        }

        /**
         * Boolean convenience check.
         */
        fun isBiometricSupported(context: Context): Boolean {
            return canAuthenticate(context).isAvailable
        }
    }

    private var activePromptRef: WeakReference<BiometricPrompt>? = null

    /**
     * Instance-level convenience method checking authentication capability.
     */
    fun canAuthenticate(ctx: Context = this.context): BiometricStatus {
        return Companion.canAuthenticate(ctx)
    }

    /**
     * Checks if biometrics are currently enrolled and ready.
     */
    fun isAvailable(): Boolean {
        return canAuthenticate(context).isAvailable
    }

    /**
     * Compatibility helper returning current BiometricStatus.
     */
    fun checkBiometricAvailability(): BiometricStatus {
        return canAuthenticate(context)
    }

    // ---------------------------------------------------------------------------------------------
    // Lifecycle-Safe Cleanup (DefaultLifecycleObserver)
    // ---------------------------------------------------------------------------------------------

    override fun onStop(owner: LifecycleOwner) {
        super.onStop(owner)
        cancelActivePrompt()
    }

    override fun onDestroy(owner: LifecycleOwner) {
        super.onDestroy(owner)
        cancelActivePrompt()
        owner.lifecycle.removeObserver(this)
    }

    /**
     * Safely cancels any active BiometricPrompt to prevent WindowLeaked exceptions.
     */
    fun cancelActivePrompt() {
        try {
            activePromptRef?.get()?.cancelAuthentication()
        } catch (e: Exception) {
            Log.w(TAG, "Error while cancelling active BiometricPrompt", e)
        } finally {
            activePromptRef = null
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Lifecycle-Safe Authentication Execution
    // ---------------------------------------------------------------------------------------------

    /**
     * Lifecycle-safe authentication function using BiometricPrompt.
     * Handles common error codes like ERROR_USER_CANCELED, ERROR_LOCKOUT, and ERROR_TIMEOUT.
     *
     * @param activity Hosting FragmentActivity for BiometricPrompt
     * @param title Title displayed on the Biometric prompt dialog
     * @param subtitle Optional subtitle
     * @param description Optional description
     * @param onResult Callback delivering BiometricResult
     */
    fun authenticate(
        activity: FragmentActivity,
        title: String = "Staff Biometric Verification",
        subtitle: String? = "Kids Vatika HRMS",
        description: String? = "Confirm fingerprint or screen lock to authorize action.",
        onResult: (BiometricResult) -> Unit
    ) {
        // Lifecycle-safe: observe activity lifecycle to automatically dismiss prompt onStop/onDestroy
        activity.lifecycle.addObserver(this)

        val executor = ContextCompat.getMainExecutor(activity)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                Log.i(TAG, "Biometric authentication SUCCEEDED")
                activePromptRef = null
                onResult(BiometricResult.Success(result))
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                Log.w(TAG, "Biometric authentication error [$errorCode]: $errString")
                activePromptRef = null

                when (errorCode) {
                    BiometricPrompt.ERROR_USER_CANCELED,
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON,
                    BiometricPrompt.ERROR_CANCELED -> {
                        // Handle ERROR_USER_CANCELED
                        onResult(BiometricResult.Cancelled)
                    }
                    BiometricPrompt.ERROR_LOCKOUT,
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> {
                        // Handle ERROR_LOCKOUT & permanent lockout
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "Sensor temporarily locked due to failed attempts. Please use device PIN or Pattern.",
                                isUserCancelled = false
                            )
                        )
                    }
                    BiometricPrompt.ERROR_TIMEOUT -> {
                        // Handle ERROR_TIMEOUT
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "Biometric verification timed out. Tap sensor again.",
                                isUserCancelled = false
                            )
                        )
                    }
                    BiometricPrompt.ERROR_NO_BIOMETRICS -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "No biometrics enrolled. Configure screen lock in device settings.",
                                isUserCancelled = false
                            )
                        )
                    }
                    BiometricPrompt.ERROR_HW_UNAVAILABLE -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = "Biometric sensor hardware is temporarily busy.",
                                isUserCancelled = false
                            )
                        )
                    }
                    else -> {
                        onResult(
                            BiometricResult.Error(
                                errorCode = errorCode,
                                errString = errString,
                                isUserCancelled = false
                            )
                        )
                    }
                }
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                Log.w(TAG, "Biometric authentication failed (touch rejected)")
                onResult(BiometricResult.Failed("Biometric identity not recognized. Please tap sensor again."))
            }
        }

        val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setConfirmationRequired(true)
            .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS)

        if (!subtitle.isNullOrBlank()) {
            promptInfoBuilder.setSubtitle(subtitle)
        }
        if (!description.isNullOrBlank()) {
            promptInfoBuilder.setDescription(description)
        }

        val prompt = BiometricPrompt(activity, executor, callback)
        activePromptRef = WeakReference(prompt)
        prompt.authenticate(promptInfoBuilder.build())
    }

    /**
     * Functional callback overload for authenticate().
     */
    fun authenticate(
        activity: FragmentActivity,
        title: String = "Staff Biometric Verification",
        subtitle: String? = "Kids Vatika HRMS",
        description: String? = "Confirm fingerprint or screen lock to authorize action.",
        onSuccess: (BiometricPrompt.AuthenticationResult) -> Unit,
        onError: (errorCode: Int, errString: CharSequence) -> Unit = { _, _ -> },
        onFailed: () -> Unit = {}
    ) {
        authenticate(
            activity = activity,
            title = title,
            subtitle = subtitle,
            description = description
        ) { result ->
            when (result) {
                is BiometricResult.Success -> onSuccess(result.result)
                is BiometricResult.Error -> onError(result.errorCode, result.errString)
                is BiometricResult.Cancelled -> onError(BiometricPrompt.ERROR_USER_CANCELED, "Cancelled by user")
                is BiometricResult.Failed -> onFailed()
            }
        }
    }

    /**
     * Convenience method for app unlock gating.
     */
    fun authenticateForAppUnlock(
        activity: FragmentActivity,
        staffName: String = "Staff Member",
        onResult: (BiometricResult) -> Unit
    ) {
        authenticate(
            activity = activity,
            title = "Kids Vatika HRMS Security",
            subtitle = "Welcome back, $staffName",
            description = "Authenticate with fingerprint or device screen lock to access dashboard.",
            onResult = onResult
        )
    }

    /**
     * Convenience method for attendance submission gating.
     */
    fun authenticateForAttendance(
        activity: FragmentActivity,
        title: String = "Staff Biometric Verification",
        subtitle: String? = "Kids Vatika Campus Attendance",
        description: String? = "Confirm identity to authorize attendance check-in.",
        onResult: (BiometricResult) -> Unit
    ) {
        authenticate(
            activity = activity,
            title = title,
            subtitle = subtitle,
            description = description,
            onResult = onResult
        )
    }

    /**
     * Alias for promptBiometricAuthentication for backward compatibility.
     */
    fun promptBiometricAuthentication(
        activity: FragmentActivity,
        title: String = "Staff Biometric Verification",
        subtitle: String? = "Kids Vatika HRMS",
        description: String? = "Confirm fingerprint or screen lock to authorize action.",
        onResult: (BiometricResult) -> Unit
    ) {
        authenticate(
            activity = activity,
            title = title,
            subtitle = subtitle,
            description = description,
            onResult = onResult
        )
    }
}

/**
 * Backward compatibility typealias
 */
typealias BiometricAuthManager = BiometricSecurityManager

