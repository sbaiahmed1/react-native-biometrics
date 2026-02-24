package com.sbaiahmed1.reactnativebiometrics

import android.content.Context
import android.os.Build
import android.security.keystore.KeyInfo
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.security.KeyFactory
import java.security.KeyStore
import java.security.interfaces.ECKey
import java.security.interfaces.RSAKey

/**
 * Utility functions for React Native Biometrics Android implementation
 */
object BiometricUtils {

    /**
     * Generates a key alias based on custom alias or configured alias
     */
    fun generateKeyAlias(customAlias: String?, configuredKeyAlias: String?, context: Context): String {
        return customAlias ?: configuredKeyAlias ?: generateDefaultKeyAlias(context)
    }

    /**
     * Generates app-specific default key alias
     */
    fun generateDefaultKeyAlias(context: Context): String {
        val packageName = context.packageName
        return "$packageName.ReactNativeBiometricsKey"
    }

    /**
     * Creates KeyGenParameterSpec for biometric key generation with authentication requirements
     */
    fun createKeyGenParameterSpec(keyAlias: String, biometricStrength: String? = null): KeyGenParameterSpec {
        val builder = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
            .setKeySize(2048)

        // Only require authentication if biometric strength is specified
        if (biometricStrength != null) {
            builder.setUserAuthenticationRequired(true)
                .setUserAuthenticationValidityDurationSeconds(-1) // Require auth for every use
        }

        return builder.build()
    }

    /**
     * Encodes arbitrary byte array to Base64 string with NO_WRAP flag
     */
    fun encodeBase64(bytes: ByteArray): String {
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }

    /**
     * Decodes Base64 string to byte array with NO_WRAP flag
     */
    fun decodeBase64(base64String: String): ByteArray {
        return Base64.decode(base64String, Base64.NO_WRAP)
    }

    /**
     * Result of biometric authenticator fallback logic
     */
    data class BiometricAuthenticatorResult(
        val authenticator: Int,
        val fallbackUsed: Boolean,
        val actualStrength: String,
        val isAvailable: Boolean
    )

    fun getKeyAuthenticator(context: Context, privateKey: java.security.Key): BiometricAuthenticatorResult {
        val biometricManager = BiometricManager.from(context)
        
        // Default: Strong Biometrics
        var requiredAuthenticator = BiometricManager.Authenticators.BIOMETRIC_STRONG

        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                val factory = KeyFactory.getInstance(privateKey.algorithm, "AndroidKeyStore")
                val keyInfo = factory.getKeySpec(privateKey, KeyInfo::class.java)
                val authTypes = keyInfo.userAuthenticationType
                
                // Reset the default; build strictly from flags
                var authenticatorMask = 0

                if ((authTypes and KeyProperties.AUTH_BIOMETRIC_STRONG) != 0) {
                    authenticatorMask = authenticatorMask or BiometricManager.Authenticators.BIOMETRIC_STRONG
                }
                
                if ((authTypes and KeyProperties.AUTH_DEVICE_CREDENTIAL) != 0) {
                    authenticatorMask = authenticatorMask or BiometricManager.Authenticators.DEVICE_CREDENTIAL
                }

                // If mask is 0 (no auth required), use the default
                if (authenticatorMask != 0) {
                    requiredAuthenticator = authenticatorMask
                }
            }
        } catch (e: Exception) {
            debugLog(context, "getKeyAuthenticator failed - default to BIOMETRIC_STRONG: ${e.message}")
        }

        val status = biometricManager.canAuthenticate(requiredAuthenticator)
        val isAvailable = status == BiometricManager.BIOMETRIC_SUCCESS

        val actualStrength = when {
            !isAvailable -> "unavailable"
            (requiredAuthenticator and BiometricManager.Authenticators.DEVICE_CREDENTIAL) == 0 -> "strong_and_device_credentials"
            else -> "strong_or_device_credential"
        }

        return BiometricAuthenticatorResult(
            authenticator = requiredAuthenticator,
            fallbackUsed = false, // Determined at auth time by the caller (cryptoObject null check)
            actualStrength = actualStrength,
            isAvailable = isAvailable
        )
    }

    /**
     * Determines the appropriate biometric authenticator with automatic fallback from strong to weak.
     *
     * If BIOMETRIC_STRONG is requested but not available, automatically falls back to BIOMETRIC_WEAK.
     *
     * @param context The application context
     * @param requestedStrength The requested biometric strength ("strong" or "weak")
     * @return BiometricAuthenticatorResult containing the final authenticator, fallback status, and actual strength
     */
    fun determineAuthenticator(context: Context, requestedStrength: String?): BiometricAuthenticatorResult {
        val biometricManager = BiometricManager.from(context)

        val requestedAuthenticator = when (requestedStrength?.lowercase()) {
            "weak" -> BiometricManager.Authenticators.BIOMETRIC_WEAK
            "strong", null -> BiometricManager.Authenticators.BIOMETRIC_STRONG
            else -> BiometricManager.Authenticators.BIOMETRIC_STRONG
        }

        var authenticator = requestedAuthenticator
        var fallbackUsed = false
        var status = biometricManager.canAuthenticate(authenticator)

        // Implement fallback logic: if strong biometrics is requested but not available, try weak
        if (requestedAuthenticator == BiometricManager.Authenticators.BIOMETRIC_STRONG &&
            status != BiometricManager.BIOMETRIC_SUCCESS) {
            authenticator = BiometricManager.Authenticators.BIOMETRIC_WEAK
            val fallbackStatus = biometricManager.canAuthenticate(authenticator)

            if (fallbackStatus == BiometricManager.BIOMETRIC_SUCCESS) {
                status = fallbackStatus
                fallbackUsed = true
            } else {
                // Fallback failed, revert to original authenticator
                authenticator = requestedAuthenticator
            }
        }

        // Determine actual strength based on availability status
        val isAvailable = status == BiometricManager.BIOMETRIC_SUCCESS
        val actualStrength = when {
            !isAvailable -> "unavailable"
            authenticator == BiometricManager.Authenticators.BIOMETRIC_WEAK -> "weak"
            else -> "strong"
        }

        return BiometricAuthenticatorResult(authenticator, fallbackUsed, actualStrength, isAvailable)
    }

    /**
     * Gets biometric capabilities for the device
     */
    fun getBiometricCapabilities(context: Context): WritableArray {
        val capabilities = Arguments.createArray()
        val biometricManager = BiometricManager.from(context)

        when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                capabilities.pushString("Fingerprint")
                // Note: Android doesn't distinguish between different biometric types in BiometricManager
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    capabilities.pushString("Face")
                    capabilities.pushString("Iris")
                }
            }
            else -> capabilities.pushString("None")
        }

        return capabilities
    }

    /**
     * Gets security level of the device
     */
    fun getSecurityLevel(context: Context): String {
        return if (isSecureHardware(context)) {
            "SecureHardware"
        } else {
            "Software"
        }
    }

    /**
     * Checks if keyguard is secure
     */
    fun isKeyguardSecure(context: Context): Boolean {
        val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
        return keyguardManager.isKeyguardSecure
    }

    /**
     * Gets enrolled biometrics
     */
    fun getEnrolledBiometrics(context: Context): WritableArray {
        val enrolled = Arguments.createArray()
        val biometricManager = BiometricManager.from(context)

        when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                enrolled.pushString("Biometric")
            }
        }

        return enrolled
    }

    /**
     * Checks if device has secure hardware for biometrics
     */
    fun isSecureHardware(context: Context): Boolean {
        return try {
            val biometricManager = BiometricManager.from(context)
            biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) != BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Gets key size for different key types
     */
    fun getKeySize(key: java.security.Key): Int {
        return when (key.algorithm) {
            "RSA" -> {
                try {
                    val rsaKey = key as RSAKey
                    rsaKey.modulus.bitLength()
                } catch (e: Exception) {
                    2048 // Default RSA key size
                }
            }
            "EC" -> {
                try {
                    val ecKey = key as ECKey
                    ecKey.params.order.bitLength()
                } catch (e: Exception) {
                    256 // Default EC key size
                }
            }
            else -> 0
        }
    }

    /**
     * Checks if key is hardware-backed
     */
    fun isHardwareBacked(key: java.security.Key): Boolean {
        return try {
            // Check if the key is hardware-backed
            val keyInfo = android.security.keystore.KeyInfo::class.java
                .getDeclaredMethod("getInstance", java.security.Key::class.java)
                .invoke(null, key) as android.security.keystore.KeyInfo
            keyInfo.isInsideSecureHardware
        } catch (e: Exception) {
            // If we can't determine, assume software-backed
            false
        }
    }

    /**
     * Creates BiometricPrompt.PromptInfo for authentication
     */
    fun createBiometricPromptInfo(
        title: String,
        subtitle: String,
        description: String? = null,
        cancelLabel: String = "Cancel",
        allowDeviceCredentials: Boolean = false,
        disableDeviceFallback: Boolean = false
    ): BiometricPrompt.PromptInfo {
        val authenticators = if (allowDeviceCredentials && !disableDeviceFallback) {
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        } else {
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        }

        val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setAllowedAuthenticators(authenticators)

        if (description != null) {
            promptInfoBuilder.setDescription(description)
        }

        if (!allowDeviceCredentials || disableDeviceFallback) {
            promptInfoBuilder.setNegativeButtonText(cancelLabel)
        }

        return promptInfoBuilder.build()
    }

    /**
     * Creates a map of key attributes including authentication requirements
     */
    fun createKeyAttributesMap(privateKey: java.security.Key): WritableMap {
        val attributes = Arguments.createMap()
        attributes.putString("algorithm", privateKey.algorithm)
        attributes.putInt("keySize", getKeySize(privateKey))

        val purposes = Arguments.createArray()
        purposes.pushString("SIGN")
        purposes.pushString("VERIFY")
        attributes.putArray("purposes", purposes)

        val digests = Arguments.createArray()
        digests.pushString("SHA256")
        attributes.putArray("digests", digests)

        val padding = Arguments.createArray()
        padding.pushString("PKCS1")
        attributes.putArray("padding", padding)

        attributes.putString("securityLevel", if (isHardwareBacked(privateKey)) "Hardware" else "Software")
        attributes.putBoolean("hardwareBacked", isHardwareBacked(privateKey))

        // Check if the key actually requires user authentication
        val requiresAuth = try {
            val keyFactory = java.security.KeyFactory.getInstance(privateKey.algorithm, "AndroidKeyStore")
            val keyInfo = keyFactory.getKeySpec(privateKey, android.security.keystore.KeyInfo::class.java)
            keyInfo.isUserAuthenticationRequired
        } catch (e: Exception) {
            // If we can't determine, assume it doesn't require auth
            false
        }
        attributes.putBoolean("userAuthenticationRequired", requiresAuth)

        return attributes
    }

    /**
     * Checks if debug mode is enabled
     */
    fun isDebugModeEnabled(context: Context): Boolean {
        val sharedPrefs = context.getSharedPreferences("ReactNativeBiometrics", Context.MODE_PRIVATE)
        return sharedPrefs.getBoolean("debugMode", false)
    }

    /**
     * Debug logging utility
     */
    fun debugLog(context: Context, message: String) {
        if (isDebugModeEnabled(context)) {
            android.util.Log.d("ReactNativeBiometrics Debug", message)
        }
    }

    /**
     * Loads Android KeyStore
     */
    fun loadKeyStore(): KeyStore {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)
        return keyStore
    }

    /**
     * Validates input data for signature operations
     */
    fun validateSignatureInput(data: String, signature: String? = null): String? {
        if (data.isEmpty()) {
            return "Empty data provided"
        }

        if (signature != null && signature.isEmpty()) {
            return "Empty signature provided"
        }

        return null
    }

    /**
     * Gets the appropriate signature algorithm for a given key
     */
    fun getSignatureAlgorithm(key: java.security.Key): String {
        return when (key) {
            is RSAKey -> "SHA256withRSA"
            is ECKey -> "SHA256withECDSA"
            else -> "SHA256withRSA" // Default fallback
        }
    }

    /**
     * Checks if the device is rooted
     * This performs multiple checks to detect root access
     */
    fun isDeviceRooted(context: Context): Boolean {
        return checkRootMethod1() || checkRootMethod2() || checkRootMethod3(context)
    }

    /**
     * Check for common root binaries
     */
    private fun checkRootMethod1(): Boolean {
        val rootPaths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su",
            "/system/etc/init.d/99SuperSUDaemon",
            "/dev/com.koushikdutta.superuser.daemon/",
            "/system/xbin/daemonsu"
        )

        for (path in rootPaths) {
            if (java.io.File(path).exists()) {
                return true
            }
        }
        return false
    }

    /**
     * Check for dangerous properties
     */
    private fun checkRootMethod2(): Boolean {
        val dangerousProps = mapOf(
            "ro.debuggable" to "1",
            "ro.secure" to "0"
        )

        for ((prop, value) in dangerousProps) {
            try {
                val process = Runtime.getRuntime().exec("getprop $prop")
                val reader = java.io.BufferedReader(java.io.InputStreamReader(process.inputStream))
                val result = reader.readLine()
                if (result != null && result == value) {
                    return true
                }
            } catch (e: Exception) {
                // Ignore exceptions
            }
        }
        return false
    }

    /**
     * Check for root management apps
     */
    private fun checkRootMethod3(context: Context): Boolean {
        val rootApps = arrayOf(
            "com.noshufou.android.su",
            "com.noshufou.android.su.elite",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.yellowes.su",
            "com.koushikdutta.rommanager",
            "com.koushikdutta.rommanager.license",
            "com.dimonvideo.luckypatcher",
            "com.chelpus.lackypatch",
            "com.ramdroid.appquarantine",
            "com.ramdroid.appquarantinepro",
            "com.devadvance.rootcloak",
            "com.devadvance.rootcloakplus",
            "de.robv.android.xposed.installer",
            "com.saurik.substrate",
            "com.zachspong.temprootremovejb",
            "com.amphoras.hidemyroot",
            "com.amphoras.hidemyrootadfree",
            "com.formyhm.hiderootPremium",
            "com.formyhm.hideroot"
        )

        val packageManager = context.packageManager
        for (packageName in rootApps) {
            try {
                packageManager.getPackageInfo(packageName, 0)
                return true
            } catch (e: Exception) {
                // Package not found, continue
            }
        }
        return false
    }

    /**
     * Checks if the device is compromised (rooted or has security issues)
     */
    fun isDeviceCompromised(context: Context): Boolean {
        return isDeviceRooted(context) || !isKeyguardSecure(context) || !isSecureHardware(context)
    }

    /**
     * Gets device integrity status
     */
    fun getDeviceIntegrityStatus(context: Context): WritableMap {
        val status = Arguments.createMap()
        val isRooted = isDeviceRooted(context)
        val isKeyguardSecure = isKeyguardSecure(context)
        val hasSecureHardware = isSecureHardware(context)

        status.putBoolean("isRooted", isRooted)
        status.putBoolean("isKeyguardSecure", isKeyguardSecure)
        status.putBoolean("hasSecureHardware", hasSecureHardware)
        status.putBoolean("isCompromised", isRooted || !isKeyguardSecure || !hasSecureHardware)
        status.putString("riskLevel", when {
            isRooted -> "HIGH"
            !isKeyguardSecure -> "MEDIUM"
            !hasSecureHardware -> "LOW"
            else -> "NONE"
        })

        return status
    }
}
