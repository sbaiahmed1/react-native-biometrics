package com.sbaiahmed1.reactnativebiometrics

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.security.keystore.StrongBoxUnavailableException
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.LifecycleEventListener
import java.io.IOException
import java.security.InvalidAlgorithmParameterException
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.NoSuchAlgorithmException
import java.security.NoSuchProviderException
import java.security.Signature
import java.security.UnrecoverableKeyException
import java.security.cert.CertificateException
import java.security.interfaces.RSAPublicKey
import androidx.core.content.edit

/**
 * Shared implementation for ReactNativeBiometrics that contains all the core logic.
 * This class is used by both old architecture and new architecture implementations.
 */
class ReactNativeBiometricsSharedImpl(private val context: ReactApplicationContext) {

  companion object {
    const val DEFAULT_KEY_ALIAS = "biometric_key"
    const val PREFS_NAME = "ReactNativeBiometricsPrefs"
    const val KEY_ALIAS_PREF = "keyAlias"
  }

  // Data class for biometric state tracking
  private data class BiometricState(
    val available: Boolean,
    val enrolled: Boolean,
    val biometryType: String,
    val keyCount: Int,
    val statusCode: Int,
    val timestamp: Long
  ) {
    fun toWritableMap(): WritableMap {
      val map = Arguments.createMap()
      map.putBoolean("available", available)
      map.putBoolean("enrolled", enrolled)
      map.putString("biometryType", biometryType)
      map.putInt("keyCount", keyCount)
      map.putInt("statusCode", statusCode)
      map.putLong("timestamp", timestamp)
      return map
    }
  }

  // Biometric change detection
  private var biometricChangeListener: ((WritableMap) -> Unit)? = null
  private var isDetectionActive = false
  private var lastBiometricState: BiometricState? = null

  // Lifecycle listener for detecting when app resumes (similar to iOS approach)
  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() {
      // Check for biometric changes when app comes to foreground
      debugLog("onHostResume called - isDetectionActive: $isDetectionActive")

      if (isDetectionActive) {
        debugLog("App resumed - checking for biometric changes")
        checkForBiometricChanges()
      }
    }

    override fun onHostPause() {
      // No action needed on pause
      debugLog("onHostPause called")
    }

    override fun onHostDestroy() {
      // Cleanup on destroy
      debugLog("onHostDestroy called")
      stopBiometricChangeDetection()
    }
  }

  private var configuredKeyAlias: String? = null

  private fun getKeyAlias(keyAlias: String? = null): String {
    return keyAlias ?: configuredKeyAlias ?: run {
      val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      sharedPrefs.getString(KEY_ALIAS_PREF, DEFAULT_KEY_ALIAS) ?: DEFAULT_KEY_ALIAS
    }
  }

  private fun createSignatureErrorResult(message: String, code: String): WritableMap {
    val errorResult = Arguments.createMap()
    errorResult.putBoolean("success", false)
    errorResult.putString("error", message)
    errorResult.putString("errorCode", code)
    return errorResult
  }

  private fun mapBiometricPromptErrorCode(errorCode: Int): String {
    return when (errorCode) {
      BiometricPrompt.ERROR_USER_CANCELED -> "USER_CANCELED"
      BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "USER_CANCELED"
      BiometricPrompt.ERROR_HW_UNAVAILABLE -> "BIOMETRIC_UNAVAILABLE"
      BiometricPrompt.ERROR_UNABLE_TO_PROCESS -> "BIOMETRIC_ERROR"
      BiometricPrompt.ERROR_TIMEOUT -> "BIOMETRIC_TIMEOUT"
      BiometricPrompt.ERROR_NO_SPACE -> "BIOMETRIC_ERROR"
      BiometricPrompt.ERROR_CANCELED -> "SYSTEM_CANCELED"
      BiometricPrompt.ERROR_LOCKOUT -> "BIOMETRIC_LOCKOUT"
      BiometricPrompt.ERROR_VENDOR -> "BIOMETRIC_ERROR"
      BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "BIOMETRIC_LOCKOUT_PERMANENT"
      BiometricPrompt.ERROR_NO_BIOMETRICS -> "NO_BIOMETRICS_ENROLLED"
      BiometricPrompt.ERROR_HW_NOT_PRESENT -> "NO_BIOMETRIC_HARDWARE"
      BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL -> "NO_DEVICE_CREDENTIAL"
      else -> "BIOMETRIC_ERROR"
    }
  }

  fun isSensorAvailable(promise: Promise) {
    debugLog("isSensorAvailable called")
    isSensorAvailable(null, promise)
  }

  fun isSensorAvailable(biometricStrength: String?, promise: Promise) {
    debugLog("isSensorAvailable called with biometricStrength: $biometricStrength")
    try {
      val biometricManager = BiometricManager.from(context)
      val result = Arguments.createMap()

      // Use shared helper to determine authenticator with fallback logic
      val authResult = BiometricUtils.determineAuthenticator(context, biometricStrength)
      val authenticator = authResult.authenticator
      val status = biometricManager.canAuthenticate(authenticator)

      debugLog("Biometric status: $status for authenticator: $authenticator")
      if (authResult.fallbackUsed) {
        debugLog("Fallback to weak biometrics was used")
        result.putString("fallbackUsed", "weak")
      }

      when (status) {
        BiometricManager.BIOMETRIC_SUCCESS -> {
          debugLog("Biometric authentication available")
          result.putBoolean("available", true)
          result.putString("biometryType", "Biometrics")
          result.putString("biometricStrength", authResult.actualStrength)
        }
        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
          debugLog("No biometric hardware available")
          result.putBoolean("available", false)
          result.putString("error", "No biometric hardware available")
          result.putString("errorCode", "BiometricErrorNoHardware")
        }
        BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> {
          debugLog("Biometric hardware unavailable")
          result.putBoolean("available", false)
          result.putString("error", "Biometric hardware unavailable")
          result.putString("errorCode", "BiometricErrorHwUnavailable")
        }
        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
          debugLog("No biometric credentials enrolled")
          result.putBoolean("available", false)
          result.putString("error", "No biometric credentials enrolled")
          result.putString("errorCode", "BiometricErrorNoneEnrolled")
        }
        BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> {
          debugLog("Security update required")
          result.putBoolean("available", false)
          result.putString("error", "Security update required")
          result.putString("errorCode", "BiometricErrorSecurityUpdateRequired")
        }
        BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> {
          debugLog("Biometric authentication unsupported")
          result.putBoolean("available", false)
          result.putString("error", "Biometric authentication unsupported")
          result.putString("errorCode", "BiometricErrorUnsupported")
        }
        BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> {
          debugLog("Biometric status unknown")
          result.putBoolean("available", false)
          result.putString("error", "Biometric status unknown")
          result.putString("errorCode", "BiometricStatusUnknown")
        }
        else -> {
          debugLog("Unknown biometric status: $status")
          result.putBoolean("available", false)
          result.putString("error", "Unknown biometric status")
          result.putString("errorCode", "BiometricStatusUnknown")
        }
      }

      debugLog("isSensorAvailable result: ${result.toHashMap()}")
      promise.resolve(result)
    } catch (e: Exception) {
      debugLog("Error in isSensorAvailable: ${e.message}")
      promise.reject("BIOMETRIC_ERROR", "Error checking biometric availability: ${e.message}", e)
    }
  }

  fun simplePrompt(promptMessage: String, promise: Promise) {
    simplePrompt(promptMessage, "Cancel", promise)
  }

  fun simplePrompt(promptMessage: String, cancelButtonText: String, promise: Promise) {
    // Delegate to the new implementation with default (strong) strength
    simplePrompt(promptMessage, cancelButtonText, null, promise)
  }

  fun simplePrompt(
    promptMessage: String,
    cancelButtonText: String,
    biometricStrength: String?,
    promise: Promise
  ) {
    debugLog(
      "simplePrompt called with message: $promptMessage, cancelButton: $cancelButtonText, strength: ${biometricStrength ?: "strong"}"
    )
    val biometricManager = BiometricManager.from(context)
    val executor = ContextCompat.getMainExecutor(context)

    val requestedAuthenticator = when (biometricStrength?.lowercase()) {
      "weak" -> BiometricManager.Authenticators.BIOMETRIC_WEAK
      "strong" -> BiometricManager.Authenticators.BIOMETRIC_STRONG
      else -> BiometricManager.Authenticators.BIOMETRIC_STRONG
    }

    val biometricStatus = biometricManager.canAuthenticate(requestedAuthenticator)
    debugLog("simplePrompt - Biometric status for requested strength: $biometricStatus")

    val authenticators = if (biometricStatus == BiometricManager.BIOMETRIC_SUCCESS) {
      if (requestedAuthenticator == BiometricManager.Authenticators.BIOMETRIC_WEAK) {
        debugLog("simplePrompt - Using BIOMETRIC_WEAK authenticator")
        BiometricManager.Authenticators.BIOMETRIC_WEAK
      } else {
        debugLog("simplePrompt - Using BIOMETRIC_STRONG authenticator")
        BiometricManager.Authenticators.BIOMETRIC_STRONG
      }
    } else {
      debugLog("simplePrompt - Using DEVICE_CREDENTIAL fallback")
      // Check API level for device credential support
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
        BiometricManager.Authenticators.DEVICE_CREDENTIAL
      } else {
         // On API < 30, we use BIOMETRIC_WEAK | DEVICE_CREDENTIAL to allow credential fallback
         // since pure DEVICE_CREDENTIAL might not be fully supported in all contexts
         BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL
      }
    }

    val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle(promptMessage)
      .setAllowedAuthenticators(authenticators)

    // Negative button is only allowed when DEVICE_CREDENTIAL is NOT used
    val includesDeviceCredential = (authenticators and BiometricManager.Authenticators.DEVICE_CREDENTIAL) != 0
    if (!includesDeviceCredential) {
      promptInfoBuilder.setNegativeButtonText(cancelButtonText)
    }

    val promptInfo = promptInfoBuilder.build()

    val callback = object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
        debugLog("simplePrompt authentication succeeded")
        val successResult = Arguments.createMap()
        successResult.putBoolean("success", true)
        promise.resolve(successResult)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        debugLog("simplePrompt authentication error: $errorCode - $errString")

        val mappedErrorCode = mapBiometricPromptErrorCode(errorCode)

        promise.reject(mappedErrorCode, errString.toString(), null)
      }

      override fun onAuthenticationFailed() {
        debugLog("simplePrompt authentication failed - allowing retry")
      }
    }

    Handler(Looper.getMainLooper()).post {
      val activity = context.currentActivity as? androidx.fragment.app.FragmentActivity
      if (activity != null && !activity.isFinishing && !activity.isDestroyed) {
        try {
          val biometricPrompt = BiometricPrompt(activity, executor, callback)
          biometricPrompt.authenticate(promptInfo)
        } catch (e: Exception) {
          debugLog("simplePrompt failed to show biometric prompt: ${e.message}")
          promise.reject("PROMPT_ERROR", "Failed to show biometric prompt: ${e.message}", e)
        }
      } else {
        debugLog("simplePrompt failed - Activity not available or in invalid state")
        promise.reject("ACTIVITY_ERROR", "Activity not available or in invalid state", null)
      }
    }
  }

  fun createKeys(keyAlias: String?, promise: Promise) {
    createKeysWithType(keyAlias, null, null, false, promise)
  }

  fun createKeysWithType(keyAlias: String?, keyType: String?, biometricStrength: String?, allowDeviceCredentials: Boolean, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    val actualKeyType = keyType?.lowercase() ?: "rsa2048"
    val requestedStrength = biometricStrength ?: "strong"
    debugLog("createKeys called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias, keyType: $actualKeyType, biometricStrength: $requestedStrength, allowDeviceCredentials: $allowDeviceCredentials")

    if (allowDeviceCredentials && android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.R) {
      debugLog("createKeys failed - allowDeviceCredentials requires Android API 30+")
      promise.reject("CREATE_KEYS_ERROR", "allowDeviceCredentials requires Android API 30+", null)
      return
    }

    try {
      // Check if key already exists
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      if (keyStore.containsAlias(actualKeyAlias)) {
        debugLog("Key already exists, deleting existing key")
        keyStore.deleteEntry(actualKeyAlias)
      }

      // Generate new key pair based on key type
      when (actualKeyType) {
        "rsa2048" -> {
          val keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore")
          val useStrongBox = BiometricUtils.isStrongBoxAvailable(context)
          debugLog("StrongBox available: $useStrongBox")

          fun buildRsaSpec(strongBox: Boolean): KeyGenParameterSpec {
            val builder = KeyGenParameterSpec.Builder(
              actualKeyAlias,
              KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
              .setDigests(KeyProperties.DIGEST_SHA256)
              .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
              .setKeySize(2048)

            builder.setUserAuthenticationRequired(true)
            if (allowDeviceCredentials) {
              builder.setUserAuthenticationParameters(
                0, // require auth for every use
                KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL
              )

            } else {
              builder.setUserAuthenticationValidityDurationSeconds(-1) // Biometric only
            }

            if (strongBox) {
              builder.setIsStrongBoxBacked(true)
            }

            return builder.build()
          }

          try {
            val keyPair = if (useStrongBox) {
              try {
                keyPairGenerator.initialize(buildRsaSpec(true))
                debugLog("Attempting RSA key generation with StrongBox")
                keyPairGenerator.generateKeyPair()
              } catch (e: Exception) {
                when {
                  e is android.security.keystore.StrongBoxUnavailableException ||
                  e.cause is android.security.keystore.StrongBoxUnavailableException ->
                    debugLog("StrongBox unavailable for RSA 2048, falling back to TEE: $e")
                  else ->
                    debugLog("StrongBox failed unexpectedly for RSA 2048, falling back to TEE: $e")
                }
                keyPairGenerator.initialize(buildRsaSpec(false))
                keyPairGenerator.generateKeyPair()
              }
            } else {
              keyPairGenerator.initialize(buildRsaSpec(false))
              keyPairGenerator.generateKeyPair()
            }

            // Get public key and encode it
            val publicKey = keyPair.public
            val publicKeyBytes = publicKey.encoded
            val publicKeyString = BiometricUtils.encodeBase64(publicKeyBytes)

            val result = Arguments.createMap()
            result.putString("publicKey", publicKeyString)

            debugLog("RSA Keys created successfully with alias: $actualKeyAlias")
            promise.resolve(result)
          } catch (e: java.security.InvalidAlgorithmParameterException) {
            // Check for enrollment error in both exception message and cause
            val message = e.message ?: ""
            val causeMessage = e.cause?.message ?: ""
            val isEnrollmentError = (e.cause is IllegalStateException && causeMessage.contains("At least one biometric must be enrolled")) ||
                                    message.contains("At least one biometric must be enrolled")

            // Handle case where enrollment is missing despite checks
            if (isEnrollmentError) {
              promise.reject("CREATE_KEYS_ERROR", "At least one biometric must be enrolled", null)
            } else {
              throw e
            }
          }
        }

        "ec256" -> {
          val keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
          val useStrongBox = BiometricUtils.isStrongBoxAvailable(context)
          debugLog("StrongBox available: $useStrongBox")

          fun buildEcSpec(strongBox: Boolean): KeyGenParameterSpec {
            val builder = KeyGenParameterSpec.Builder(
              actualKeyAlias,
              KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
              .setDigests(KeyProperties.DIGEST_SHA256)
              .setKeySize(256)

            builder.setUserAuthenticationRequired(true)
            if (allowDeviceCredentials) {
              builder.setUserAuthenticationParameters(
                0, // require auth for every use
                KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL
              )

            } else {
              builder.setUserAuthenticationValidityDurationSeconds(-1) // Biometric only
            }

            if (strongBox) {
              builder.setIsStrongBoxBacked(true)
            }

            return builder.build()
          }

          try {
            val keyPair = if (useStrongBox) {
              try {
                keyPairGenerator.initialize(buildEcSpec(true))
                debugLog("Attempting EC key generation with StrongBox")
                keyPairGenerator.generateKeyPair()
              } catch (e: Exception) {
                when {
                  e is android.security.keystore.StrongBoxUnavailableException ||
                  e.cause is android.security.keystore.StrongBoxUnavailableException ->
                    debugLog("StrongBox unavailable for EC 256, falling back to TEE: $e")
                  else ->
                    debugLog("StrongBox failed unexpectedly for EC 256, falling back to TEE: $e")
                }
                keyPairGenerator.initialize(buildEcSpec(false))
                keyPairGenerator.generateKeyPair()
              }
            } else {
              keyPairGenerator.initialize(buildEcSpec(false))
              keyPairGenerator.generateKeyPair()
            }

            // Get public key and encode it
            val publicKey = keyPair.public
            val publicKeyBytes = publicKey.encoded
            val publicKeyString = BiometricUtils.encodeBase64(publicKeyBytes)

            val result = Arguments.createMap()
            result.putString("publicKey", publicKeyString)

            debugLog("EC Keys created successfully with alias: $actualKeyAlias")
            promise.resolve(result)
          } catch (e: java.security.InvalidAlgorithmParameterException) {
            // Check for enrollment error in both exception message and cause
            val message = e.message ?: ""
            val causeMessage = e.cause?.message ?: ""
            val isEnrollmentError = (e.cause is IllegalStateException && causeMessage.contains("At least one biometric must be enrolled")) ||
                                    message.contains("At least one biometric must be enrolled")

            // Handle case where enrollment is missing despite checks
            if (isEnrollmentError) {
              promise.reject("CREATE_KEYS_ERROR", "At least one biometric must be enrolled", null)
            } else {
              throw e
            }
          }
        }

        else -> {
          debugLog("createKeys failed - Unsupported key type: $actualKeyType")
          promise.reject("CREATE_KEYS_ERROR", "Unsupported key type: $actualKeyType. Supported types: rsa2048, ec256", null)
          return
        }
      }

    } catch (e: NoSuchAlgorithmException) {
      debugLog("createKeys failed - Algorithm not supported: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "Algorithm not supported: ${e.message}", e)
    } catch (e: InvalidAlgorithmParameterException) {
      debugLog("createKeys failed - Invalid parameters: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "Invalid key parameters: ${e.message}", e)
    } catch (e: NoSuchProviderException) {
      debugLog("createKeys failed - Provider not found: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "KeyStore provider not found: ${e.message}", e)
    } catch (e: KeyStoreException) {
      debugLog("createKeys failed - KeyStore error: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "KeyStore error: ${e.message}", e)
    } catch (e: CertificateException) {
      debugLog("createKeys failed - Certificate error: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "Certificate error: ${e.message}", e)
    } catch (e: IOException) {
      debugLog("createKeys failed - IO error: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "IO error: ${e.message}", e)
    } catch (e: Exception) {
      debugLog("createKeys failed - Unexpected error: ${e.message}")
      promise.reject("CREATE_KEYS_ERROR", "Failed to create keys: ${e.message}", e)
    }
  }

  fun deleteKeys(keyAlias: String?, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    debugLog("deleteKeys called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias")
    try {

      // Access the Android KeyStore
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      // Check if the key exists
      if (keyStore.containsAlias(actualKeyAlias)) {
        // Delete the key
        keyStore.deleteEntry(actualKeyAlias)
        debugLog("Key with alias '$actualKeyAlias' deleted successfully")

        // Verify deletion
        if (!keyStore.containsAlias(actualKeyAlias)) {
          val result = Arguments.createMap()
          result.putBoolean("success", true)
          debugLog("Keys deleted and verified successfully")
          promise.resolve(result)
        } else {
          debugLog("deleteKeys failed - Key still exists after deletion attempt")
          promise.reject("DELETE_KEYS_ERROR", "Key deletion verification failed", null)
        }
      } else {
        // Key doesn't exist, but this is not necessarily an error
        debugLog("No key found with alias '$actualKeyAlias' - nothing to delete")
        val result = Arguments.createMap()
        result.putBoolean("success", true)
        promise.resolve(result)
      }

    } catch (e: KeyStoreException) {
      debugLog("deleteKeys failed - KeyStore error: ${e.message}")
      promise.reject("DELETE_KEYS_ERROR", "KeyStore error: ${e.message}", e)
    } catch (e: CertificateException) {
      debugLog("deleteKeys failed - Certificate error: ${e.message}")
      promise.reject("DELETE_KEYS_ERROR", "Certificate error: ${e.message}", e)
    } catch (e: IOException) {
      debugLog("deleteKeys failed - IO error: ${e.message}")
      promise.reject("DELETE_KEYS_ERROR", "IO error: ${e.message}", e)
    } catch (e: Exception) {
      debugLog("deleteKeys failed - Unexpected error: ${e.message}")
      promise.reject("DELETE_KEYS_ERROR", "Failed to delete keys: ${e.message}", e)
    }
  }

  fun getDiagnosticInfo(promise: Promise) {
    val biometricManager = BiometricManager.from(context)
    val result = Arguments.createMap()

    result.putString("platform", "Android")
    result.putString("osVersion", android.os.Build.VERSION.RELEASE)
    result.putString("deviceModel", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
    result.putArray("biometricCapabilities", getBiometricCapabilities())
    result.putString("securityLevel", getSecurityLevel())
    result.putBoolean("keyguardSecure", isKeyguardSecure())
    result.putArray("enrolledBiometrics", getEnrolledBiometrics())

    promise.resolve(result)
  }

  fun setDebugMode(enabled: Boolean, promise: Promise) {
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    sharedPrefs.edit { putBoolean("debugMode", enabled) }

    if (enabled) {
      android.util.Log.d("ReactNativeBiometrics", "Debug mode enabled")
    } else {
      android.util.Log.d("ReactNativeBiometrics", "Debug mode disabled")
    }

    promise.resolve(null)
  }

  fun configureKeyAlias(keyAlias: String, promise: Promise) {
    debugLog("configureKeyAlias called with: $keyAlias")

    if (keyAlias.isEmpty()) {
      promise.reject("INVALID_KEY_ALIAS", "Key alias cannot be empty", null)
      return
    }

    configuredKeyAlias = keyAlias
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    sharedPrefs.edit { putString(KEY_ALIAS_PREF, keyAlias) }

    debugLog("Key alias configured successfully: $keyAlias")
    promise.resolve(null)
  }

  fun getDefaultKeyAlias(promise: Promise) {
    val currentAlias = getKeyAlias()
    debugLog("getDefaultKeyAlias returning: $currentAlias")
    promise.resolve(currentAlias)
  }

  private fun getBiometricCapabilities(): com.facebook.react.bridge.WritableArray {
    val capabilities = Arguments.createArray()
    val biometricManager = BiometricManager.from(context)

    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_SUCCESS -> {
        capabilities.pushString("Fingerprint")
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
          capabilities.pushString("Face")
          capabilities.pushString("Iris")
        }
      }
      else -> capabilities.pushString("None")
    }

    return capabilities
  }

  private fun getSecurityLevel(): String {
    return if (isSecureHardware()) {
      "SecureHardware"
    } else {
      "Software"
    }
  }

  private fun isKeyguardSecure(): Boolean {
    val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
    return keyguardManager.isKeyguardSecure
  }

  private fun getEnrolledBiometrics(): com.facebook.react.bridge.WritableArray {
    val enrolled = Arguments.createArray()
    val biometricManager = BiometricManager.from(context)

    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_SUCCESS -> {
        enrolled.pushString("Biometric")
      }
    }

    return enrolled
  }

  private fun isSecureHardware(): Boolean {
    return try {
      val biometricManager = BiometricManager.from(context)
      biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) != BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED
    } catch (e: Exception) {
      false
    }
  }

  private fun isDebugModeEnabled(): Boolean {
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return sharedPrefs.getBoolean("debugMode", false)
  }

  private fun debugLog(message: String) {
    if (isDebugModeEnabled()) {
      android.util.Log.d("ReactNativeBiometrics Debug", message)
    }
  }

  fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    debugLog("authenticateWithOptions called with options: ${options.toHashMap()}")
    val executor = ContextCompat.getMainExecutor(context)
    val result = Arguments.createMap()

    val title = if (options.hasKey("title")) options.getString("title") else "Biometric Authentication"
    val subtitle = if (options.hasKey("subtitle")) options.getString("subtitle") else "Please verify your identity"
    val description = if (options.hasKey("description")) options.getString("description") else null
    val cancelLabel = if (options.hasKey("cancelLabel")) options.getString("cancelLabel") else "Cancel"
    val allowDeviceCredentials = if (options.hasKey("allowDeviceCredentials")) options.getBoolean("allowDeviceCredentials") else false
    val disableDeviceFallback = if (options.hasKey("disableDeviceFallback")) options.getBoolean("disableDeviceFallback") else false
    val biometricStrength = if (options.hasKey("biometricStrength")) options.getString("biometricStrength") else null

    debugLog("Authentication options - title: $title, allowDeviceCredentials: $allowDeviceCredentials, disableDeviceFallback: $disableDeviceFallback, biometricStrength: $biometricStrength")

    // Use shared helper to determine authenticator with fallback logic
    val authenticatorResult = BiometricUtils.determineAuthenticator(context, biometricStrength)
    val baseAuthenticator = authenticatorResult.authenticator
    val fallbackUsed = authenticatorResult.fallbackUsed
    val actualStrength = authenticatorResult.actualStrength

    val authenticators = if (allowDeviceCredentials && !disableDeviceFallback) {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
        baseAuthenticator or BiometricManager.Authenticators.DEVICE_CREDENTIAL
      } else {
        // For API 28-29, we can't combine BIOMETRIC_STRONG with DEVICE_CREDENTIAL in the same way
        // But BIOMETRIC_WEAK | DEVICE_CREDENTIAL is supported
        BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL
      }
    } else {
      baseAuthenticator
    }

    debugLog("Using authenticators: $authenticators (base: $baseAuthenticator, fallback used: $fallbackUsed)")

    val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle(title!!)
      .setSubtitle(subtitle!!)
      .setAllowedAuthenticators(authenticators)

    if (description != null) {
      promptInfoBuilder.setDescription(description)
    }

    if (!allowDeviceCredentials || disableDeviceFallback) {
      promptInfoBuilder.setNegativeButtonText(cancelLabel!!)
    }

    val promptInfo = promptInfoBuilder.build()

    val callback = object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
        debugLog("authenticateWithOptions authentication succeeded")
        val successResult = Arguments.createMap()
        successResult.putBoolean("success", true)

        // Include information about fallback usage and actual strength used
        if (fallbackUsed) {
          successResult.putString("fallbackUsed", "weak")
        }
        successResult.putString("biometricStrength", actualStrength)

        promise.resolve(successResult)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        debugLog("authenticateWithOptions authentication error: $errorCode - $errString")

        // Map Android BiometricPrompt error codes to consistent error codes
        val mappedErrorCode = mapBiometricPromptErrorCode(errorCode)

        promise.reject(mappedErrorCode, errString.toString(), null)
      }

      override fun onAuthenticationFailed() {
        debugLog("authenticateWithOptions authentication failed - allowing retry")
        // Do not resolve promise here - this allows the user to retry
        // The promise will only be resolved on success or unrecoverable error
      }
    }

    Handler(Looper.getMainLooper()).post {
      val activity = context.currentActivity as? androidx.fragment.app.FragmentActivity
      if (activity != null && !activity.isFinishing && !activity.isDestroyed) {
        try {
          val biometricPrompt = BiometricPrompt(activity, executor, callback)
          biometricPrompt.authenticate(promptInfo)
        } catch (e: Exception) {
          debugLog("authenticateWithOptions failed to show biometric prompt: ${e.message}")
          promise.reject("PROMPT_ERROR", "Failed to show biometric prompt: ${e.message}", e)
        }
      } else {
        debugLog("authenticateWithOptions - No valid activity available")
        promise.reject("NO_ACTIVITY", "No active activity available for biometric authentication", null)
      }
    }
  }

  fun getAllKeys(customAlias: String? = null, promise: Promise) {
    debugLog("getAllKeys called with customAlias: ${customAlias ?: "null"}")
        try {
          val keyStore = KeyStore.getInstance("AndroidKeyStore")
          keyStore.load(null)

          val keysList = Arguments.createArray()
          val aliases = keyStore.aliases()

          while (aliases.hasMoreElements()) {
            val alias = aliases.nextElement()

            // Filter for our biometric keys
            val shouldIncludeKey = if (customAlias != null) {
              // If customAlias is provided, filter for that specific alias
              alias.equals(getKeyAlias(customAlias))
            } else {
              // Default behavior: check if it contains the default key alias
              alias.equals(getKeyAlias())
            }

            if (shouldIncludeKey) {
              try {
                val keyEntry = keyStore.getEntry(alias, null)
                if (keyEntry is KeyStore.PrivateKeyEntry) {
                  val publicKey = keyEntry.certificate.publicKey
                  val publicKeyBytes = publicKey.encoded
                  val publicKeyString = BiometricUtils.encodeBase64(publicKeyBytes)

                  val keyInfo = Arguments.createMap()
                  keyInfo.putString("alias", alias)
                  keyInfo.putString("publicKey", publicKeyString)
                  // Note: Android KeyStore doesn't provide creation date easily
                  // You could store this separately if needed

                  keysList.pushMap(keyInfo)
                  debugLog("Found key with alias: $alias")
                }
              } catch (e: Exception) {
                debugLog("Error processing key $alias: ${e.message}")
                // Continue with other keys
              }
            }
          }

          val result = Arguments.createMap()
          result.putArray("keys", keysList)

          debugLog("getAllKeys completed successfully, found ${keysList.size()} keys")
          promise.resolve(result)

        } catch (e: KeyStoreException) {
          debugLog("getAllKeys failed - KeyStore error: ${e.message}")
          promise.reject("GET_ALL_KEYS_ERROR", "KeyStore error: ${e.message}", e)
        } catch (e: CertificateException) {
          debugLog("getAllKeys failed - Certificate error: ${e.message}")
          promise.reject("GET_ALL_KEYS_ERROR", "Certificate error: ${e.message}", e)
        } catch (e: IOException) {
          debugLog("getAllKeys failed - IO error: ${e.message}")
          promise.reject("GET_ALL_KEYS_ERROR", "IO error: ${e.message}", e)
        } catch (e: NoSuchAlgorithmException) {
          debugLog("getAllKeys failed - Algorithm error: ${e.message}")
          promise.reject("GET_ALL_KEYS_ERROR", "Algorithm error: ${e.message}", e)
        } catch (e: UnrecoverableKeyException) {
          debugLog("getAllKeys failed - Unrecoverable key error: ${e.message}")
          promise.reject("GET_ALL_KEYS_ERROR", "Unrecoverable key error: ${e.message}", e)
        } catch (e: Exception) {
          debugLog("getAllKeys failed - Unexpected error: ${e.message}")
          promise.reject("GET_ALL_KEYS_ERROR", "Failed to get all keys: ${e.message}", e)
        }
  }

  fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
    validateKeyIntegrity(keyAlias, "strong", promise)
  }

  fun validateKeyIntegrity(keyAlias: String?, biometricStrength: String?, promise: Promise) {
      debugLog("validateKeyIntegrity called with keyAlias: ${keyAlias ?: "default"}")

      val actualKeyAlias = getKeyAlias(keyAlias)
      val result = Arguments.createMap()
      val integrityChecks = Arguments.createMap()

      result.putBoolean("valid", false)
      result.putBoolean("keyExists", false)
      integrityChecks.putBoolean("keyFormatValid", false)
      integrityChecks.putBoolean("keyAccessible", false)
      integrityChecks.putBoolean("signatureTestPassed", false)
      integrityChecks.putBoolean("hardwareBacked", false)

      try {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        if (!keyStore.containsAlias(actualKeyAlias)) {
          debugLog("validateKeyIntegrity - Key not found")
          result.putMap("integrityChecks", integrityChecks)
          promise.resolve(result)
          return
        }

        result.putBoolean("keyExists", true)

        val keyEntry = keyStore.getEntry(actualKeyAlias, null)
        if (keyEntry !is KeyStore.PrivateKeyEntry) {
          debugLog("validateKeyIntegrity - Invalid key type")
          result.putString("error", "Invalid key type")
          result.putMap("integrityChecks", integrityChecks)
          promise.resolve(result)
          return
        }

        val privateKey = keyEntry.privateKey
        val publicKey = keyEntry.certificate.publicKey

        // Check key attributes
        val keyAttributes = Arguments.createMap()
        keyAttributes.putString("algorithm", privateKey.algorithm)
        keyAttributes.putInt("keySize", if (publicKey is RSAPublicKey) publicKey.modulus.bitLength() else 2048)
        keyAttributes.putString("securityLevel", if (this.isHardwareBacked(privateKey)) "Hardware" else "Software")
        result.putMap("keyAttributes", keyAttributes)

        // Update integrity checks
        integrityChecks.putBoolean("keyFormatValid", true)
        integrityChecks.putBoolean("keyAccessible", true)
        integrityChecks.putBoolean("hardwareBacked", this.isHardwareBacked(privateKey))

        // Check if the key requires user authentication
        val requiresAuth = try {
          val keyFactory = java.security.KeyFactory.getInstance(privateKey.algorithm, "AndroidKeyStore")
          val keyInfo = keyFactory.getKeySpec(privateKey, android.security.keystore.KeyInfo::class.java)
          keyInfo.isUserAuthenticationRequired
        } catch (e: Exception) {
          false
        }

        // If the key doesn't require authentication, we can test it directly
        if (!requiresAuth) {
          debugLog("validateKeyIntegrity - Key doesn't require authentication, testing directly")
          try {
            val testSignature = java.security.Signature.getInstance("SHA256withRSA")
            testSignature.initSign(privateKey)

            val testData = "integrity_test_data".toByteArray()
            testSignature.update(testData)
            val signatureBytes = testSignature.sign()

            // Verify the signature
            val verifySignature = java.security.Signature.getInstance(BiometricUtils.getSignatureAlgorithm(publicKey))
            verifySignature.initVerify(publicKey)
            verifySignature.update(testData)
            val isValid = verifySignature.verify(signatureBytes)

            integrityChecks.putBoolean("signatureTestPassed", isValid)
            result.putBoolean("valid", isValid)
            result.putMap("integrityChecks", integrityChecks)
            debugLog("validateKeyIntegrity completed without authentication - valid: $isValid")
            promise.resolve(result)
            return
          } catch (e: Exception) {
            debugLog("validateKeyIntegrity - Direct signature test failed: ${e.message}")
            integrityChecks.putBoolean("signatureTestPassed", false)
            result.putString("error", "Signature test failed: ${e.message}")
            result.putMap("integrityChecks", integrityChecks)
            promise.resolve(result)
            return
          }
        }

        // For authentication-required keys, we need biometric authentication before signature test
        debugLog("validateKeyIntegrity - Key requires authentication, proceeding with biometric prompt")
        val executor = ContextCompat.getMainExecutor(context)
        val biometricManager = BiometricManager.from(context)

        // Use shared helper to determine authenticator with fallback logic
        val authenticatorResult = BiometricUtils.determineAuthenticator(context, biometricStrength)
        val authenticator = authenticatorResult.authenticator
        val fallbackUsed = authenticatorResult.fallbackUsed
        val actualStrength = authenticatorResult.actualStrength
        val biometricStatus = biometricManager.canAuthenticate(authenticator)

        val authenticators = if (biometricStatus == BiometricManager.BIOMETRIC_SUCCESS) {
          authenticator
        } else {
          // Check API level for device credential support
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            BiometricManager.Authenticators.DEVICE_CREDENTIAL
          } else {
             // On API < 30, we use BIOMETRIC_WEAK | DEVICE_CREDENTIAL
             BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL
          }
        }

        val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
          .setTitle("Authenticate to test key integrity")
          .setSubtitle("Please verify your identity to test the key")
          .setAllowedAuthenticators(authenticators)

        if (authenticators == BiometricManager.Authenticators.BIOMETRIC_STRONG || authenticators == BiometricManager.Authenticators.BIOMETRIC_WEAK) {
          promptInfoBuilder.setNegativeButtonText("Cancel")
        }

        val promptInfo = promptInfoBuilder.build()

        // Create signature instance and CryptoObject for authentication-required keys
        val testSignature = java.security.Signature.getInstance("SHA256withRSA")
        testSignature.initSign(privateKey)
        val cryptoObject = BiometricPrompt.CryptoObject(testSignature)

        val activity = context.currentActivity as? FragmentActivity
        if (activity == null || activity.isFinishing || activity.isDestroyed) {
          debugLog("validateKeyIntegrity failed - No valid activity available")
          result.putString("error", "No valid activity available for biometric authentication")
          result.putMap("integrityChecks", integrityChecks)
          promise.resolve(result)
          return
        }

        val biometricPrompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
          override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
            debugLog("validateKeyIntegrity - Authentication succeeded, performing signature test")

            try {
              // Use the authenticated signature from the CryptoObject
              val authenticatedSignature = authResult.cryptoObject?.signature
              if (authenticatedSignature == null) {
                debugLog("validateKeyIntegrity - No authenticated signature available")
                integrityChecks.putBoolean("signatureTestPassed", false)
                val errorResult = Arguments.createMap()
                errorResult.putString("error", "No authenticated signature available")
                errorResult.putMap("integrityChecks", integrityChecks)
                promise.resolve(errorResult)
                return
              }

              val testData = "integrity_test_data".toByteArray()
              authenticatedSignature.update(testData)
              val signatureBytes = authenticatedSignature.sign()

              // Verify the signature
              val verifySignature = java.security.Signature.getInstance(BiometricUtils.getSignatureAlgorithm(publicKey))
              verifySignature.initVerify(publicKey)
              verifySignature.update(testData)
              val isValid = verifySignature.verify(signatureBytes)

              integrityChecks.putBoolean("signatureTestPassed", isValid)

              val successResult = Arguments.createMap()
              if (isValid) {
                successResult.putBoolean("valid", true)
              }

              successResult.putBoolean("fallbackUsed", fallbackUsed)
              successResult.putString("biometricStrength", actualStrength)
              successResult.putMap("integrityChecks", integrityChecks)
              debugLog("validateKeyIntegrity completed - valid: ${successResult.getBoolean("valid")}")
              promise.resolve(successResult)

            } catch (e: Exception) {
              debugLog("validateKeyIntegrity - Signature test failed: ${e.message}")
              integrityChecks.putBoolean("signatureTestPassed", false)
              val errorResult = Arguments.createMap()
              errorResult.putMap("integrityChecks", integrityChecks)
              promise.resolve(errorResult)
            }
          }

          override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
            debugLog("validateKeyIntegrity - Authentication error: $errorCode - $errString")
            integrityChecks.putBoolean("signatureTestPassed", false)
            val errorResult = Arguments.createMap()
            errorResult.putString("error", "Authentication failed: $errString")
            errorResult.putMap("integrityChecks", integrityChecks)
            promise.resolve(errorResult)
          }

          override fun onAuthenticationFailed() {
            debugLog("validateKeyIntegrity - Authentication failed - allowing retry")
            // Do not resolve promise here - this allows the user to retry
            // The promise will only be resolved on success or unrecoverable error
          }
        })

        // Show biometric prompt on main thread with CryptoObject
        Handler(Looper.getMainLooper()).post {
          try {
            biometricPrompt.authenticate(promptInfo, cryptoObject)
          } catch (e: Exception) {
            debugLog("validateKeyIntegrity failed to show biometric prompt: ${e.message}")
            result.putString("error", "Failed to show biometric prompt: ${e.message}")
            result.putMap("integrityChecks", integrityChecks)
            promise.resolve(result)
          }
        }

      } catch (e: Exception) {
        debugLog("validateKeyIntegrity failed - ${e.message}")
        result.putString("error", e.message)
        result.putMap("integrityChecks", integrityChecks)
        promise.resolve(result)
      }
  }

  fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, promise: Promise) {
    verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, null, false, "utf8", promise)
  }

  fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, biometricStrength: String?, promise: Promise) {
    verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, biometricStrength, false, "utf8", promise)
  }

  fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, biometricStrength: String?, disableDeviceFallback: Boolean, promise: Promise) {
    verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, biometricStrength, disableDeviceFallback, "utf8", promise)
  }

  /**
   * Converts input data to bytes based on the specified encoding.
   * @param data The input data string
   * @param inputEncoding Either "utf8" or "base64"
   * @return ByteArray of the data, or null if decoding fails
   */
  private fun decodeInputData(data: String, inputEncoding: String): ByteArray? {
    return when (inputEncoding.lowercase()) {
      "base64" -> {
        try {
          BiometricUtils.decodeBase64(data)
        } catch (e: Exception) {
          debugLog("Failed to decode base64 data: ${e.message}")
          null
        }
      }
      else -> data.toByteArray(Charsets.UTF_8)
    }
  }

  fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, biometricStrength: String?, disableDeviceFallback: Boolean, inputEncoding: String, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    debugLog("verifyKeySignature called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias, biometricStrength: ${biometricStrength ?: "strong"}, disableDeviceFallback: $disableDeviceFallback, inputEncoding: $inputEncoding")

    // Decode input data based on encoding
    val dataBytes = decodeInputData(data, inputEncoding)
    if (dataBytes == null) {
      promise.resolve(createSignatureErrorResult("Invalid base64 data", "INVALID_INPUT_ENCODING"))
      return
    }

    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      if (!keyStore.containsAlias(actualKeyAlias)) {
        promise.resolve(createSignatureErrorResult("Key not found", "KEY_NOT_FOUND"))
        return
      }

      val keyEntry = keyStore.getEntry(actualKeyAlias, null)
      if (keyEntry !is KeyStore.PrivateKeyEntry) {
        promise.resolve(createSignatureErrorResult("Invalid key type", "INVALID_KEY_TYPE"))
        return
      }

      val privateKey = keyEntry.privateKey

      // Check if the key requires user authentication
      val requiresAuth = try {
        val keyFactory = java.security.KeyFactory.getInstance(privateKey.algorithm, "AndroidKeyStore")
        val keyInfo = keyFactory.getKeySpec(privateKey, android.security.keystore.KeyInfo::class.java)
        keyInfo.isUserAuthenticationRequired
      } catch (e: Exception) {
        false
      }

      // If the key doesn't require authentication, we can sign directly
      if (!requiresAuth) {
        debugLog("verifyKeySignature - Key doesn't require authentication, signing directly")
        try {
          val signature = Signature.getInstance(BiometricUtils.getSignatureAlgorithm(privateKey))
          signature.initSign(privateKey)
          signature.update(dataBytes)
          val signatureBytes = signature.sign()
          val signatureString = BiometricUtils.encodeBase64(signatureBytes)

          val result = Arguments.createMap()
          result.putBoolean("success", true)
          result.putString("signature", signatureString)
          debugLog("verifyKeySignature completed without authentication")
          promise.resolve(result)
          return
        } catch (e: Exception) {
          debugLog("verifyKeySignature - Direct signing failed: ${e.message}")
          val message = "Signing failed: ${e.message ?: "Unknown error"}"
          promise.resolve(createSignatureErrorResult(message, "SIGNATURE_CREATION_FAILED"))
          return
        }
      }

      // For authentication-required keys, we need biometric authentication before signing
      debugLog("verifyKeySignature - Key requires authentication, proceeding with biometric prompt")

      // Create signature instance and initialize it with the private key
      val signature = Signature.getInstance(BiometricUtils.getSignatureAlgorithm(privateKey))
      signature.initSign(privateKey)

      // Create CryptoObject with the signature for authentication-required keys
      val cryptoObject = BiometricPrompt.CryptoObject(signature)

      // For authentication-required keys, we need biometric authentication before signing
      val executor = ContextCompat.getMainExecutor(context)
      val biometricManager = BiometricManager.from(context)

      // Use shared helper to determine authenticator with fallback logic
      val authenticatorResult = BiometricUtils.getKeyAuthenticator(context, privateKey)

      // Start from what the key actually requires (may be BIOMETRIC_STRONG, DEVICE_CREDENTIAL, or both).
      var authenticators = authenticatorResult.authenticator

      // If the caller wants biometric-only, strip DEVICE_CREDENTIAL from the mask.
      // This lets the user enforce biometric without changing the key's base requirements.
      if (disableDeviceFallback) {
        authenticators = authenticators and BiometricManager.Authenticators.DEVICE_CREDENTIAL.inv()
        if (authenticators == 0) {
          // Key only supports DEVICE_CREDENTIAL but caller requires biometric-only — impossible to satisfy.
          debugLog("verifyKeySignature - Key only supports device credential but biometric-only is required")
          promise.resolve(
            createSignatureErrorResult(
              "Key only supports device credential but biometric-only is required",
              "BIOMETRIC_NOT_AVAILABLE"
            )
          )
          return
        }
      }

      val biometricStatus = biometricManager.canAuthenticate(authenticators)
      if (biometricStatus != BiometricManager.BIOMETRIC_SUCCESS) {
        debugLog("verifyKeySignature - Authentication not available: $biometricStatus for authenticator: $authenticators")
        promise.resolve(
          createSignatureErrorResult(
            "Authentication not available for this key",
            "BIOMETRIC_NOT_AVAILABLE"
          )
        )
        return
      }

      debugLog("verifyKeySignature - Using authenticator: $authenticators")

      val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
        .setTitle(promptTitle ?: "Authenticate to sign data")
        .setSubtitle(promptSubtitle ?: "Please verify your identity to generate signature")
        .setAllowedAuthenticators(authenticators)

      if ((authenticators and BiometricManager.Authenticators.DEVICE_CREDENTIAL) == 0) {
        promptInfoBuilder.setNegativeButtonText(cancelButtonText ?: "Cancel")
      }

      val promptInfo = promptInfoBuilder.build()

      val activity = context.currentActivity as? FragmentActivity
      if (activity == null || activity.isFinishing || activity.isDestroyed) {
        debugLog("verifyKeySignature failed - No valid activity available")
        promise.resolve(
          createSignatureErrorResult(
            "No valid activity available for biometric authentication",
            "ACTIVITY_NOT_AVAILABLE"
          )
        )
        return
      }

      val biometricPrompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
          debugLog("verifyKeySignature - Authentication succeeded, generating signature")

          try {
            // If cryptoObject carries the signature, the user authenticated via biometrics
            // (hardware-atomic binding — highest security).
            // If null, the user chose device credential: Android does not bind CryptoObject
            // to device credential auth, but the Keystore key is still unlocked
            // via the fresh auth token, so we can call sign() on the pre-initialized signature.
            val usedDeviceCredential = authResult.cryptoObject?.signature == null
            val authenticatedSignature = authResult.cryptoObject?.signature ?: signature

            if (usedDeviceCredential) {
              debugLog("verifyKeySignature - Device credential used, signing with pre-initialized signature")
            }

            authenticatedSignature.update(dataBytes)
            val signatureBytes = authenticatedSignature.sign()
            val signatureString = BiometricUtils.encodeBase64(signatureBytes)

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("signature", signatureString)
            result.putBoolean("fallbackUsed", usedDeviceCredential)
            result.putString("biometricStrength", if (usedDeviceCredential) "device_credential" else authenticatorResult.actualStrength)
            debugLog("verifyKeySignature completed successfully (deviceCredential=$usedDeviceCredential)")
            promise.resolve(result)

          } catch (e: Exception) {
            debugLog("verifyKeySignature - Signature generation failed: ${e.message}")
            val message = "Failed to generate signature: ${e.message ?: "Unknown error"}"
            promise.resolve(createSignatureErrorResult(message, "SIGNATURE_CREATION_FAILED"))
          }
        }

        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          debugLog("verifyKeySignature - Authentication error: $errorCode - $errString")
          val mappedErrorCode = mapBiometricPromptErrorCode(errorCode)
          val message = "Authentication failed: $errString"
          promise.resolve(createSignatureErrorResult(message, mappedErrorCode))
        }

        override fun onAuthenticationFailed() {
          debugLog("verifyKeySignature - Authentication failed - allowing retry")
          // Do not resolve promise here - this allows the user to retry
          // The promise will only be resolved on success or unrecoverable error
        }
      })

      // Show biometric prompt on main thread with CryptoObject
      Handler(Looper.getMainLooper()).post {
        try {
          biometricPrompt.authenticate(promptInfo, cryptoObject)
        } catch (e: Exception) {
          debugLog("verifyKeySignature failed to show biometric prompt: ${e.message}")
          val message = "Failed to show biometric prompt: ${e.message ?: "Unknown error"}"
          promise.resolve(createSignatureErrorResult(message, "PROMPT_ERROR"))
        }
      }

    } catch (e: Exception) {
      debugLog("verifyKeySignature failed - ${e.message}")
      val message = "Failed to verify signature: ${e.message ?: "Unknown error"}"
      promise.resolve(createSignatureErrorResult(message, "SIGNATURE_CREATION_FAILED"))
    }
  }

  fun validateSignature(keyAlias: String?, data: String, signature: String, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    debugLog("validateSignature called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias")

    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      if (!keyStore.containsAlias(actualKeyAlias)) {
        val errorResult = Arguments.createMap()
        errorResult.putBoolean("valid", false)
        errorResult.putString("error", "Key not found")
        promise.resolve(errorResult)
        return
      }

      val publicKey = keyStore.getCertificate(actualKeyAlias).publicKey
      val signatureInstance = Signature.getInstance(BiometricUtils.getSignatureAlgorithm(publicKey))
      signatureInstance.initVerify(publicKey)
      signatureInstance.update(data.toByteArray())

      val signatureBytes = BiometricUtils.decodeBase64(signature)
      val isValid = signatureInstance.verify(signatureBytes)

      val result = Arguments.createMap()
      result.putBoolean("valid", isValid)
      promise.resolve(result)

    } catch (e: Exception) {
      debugLog("validateSignature failed - ${e.message}")
      val errorResult = Arguments.createMap()
      errorResult.putBoolean("valid", false)
      errorResult.putString("error", "Failed to validate signature: ${e.message}")
      promise.resolve(errorResult)
    }
  }

  fun getKeyAttributes(keyAlias: String?, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    debugLog("getKeyAttributes called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias")

    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      if (!keyStore.containsAlias(actualKeyAlias)) {
        val result = Arguments.createMap()
        result.putBoolean("exists", false)
        promise.resolve(result)
        return
      }

      val certificate = keyStore.getCertificate(actualKeyAlias)
      val publicKey = certificate.publicKey

      val attributes = Arguments.createMap()
      attributes.putString("algorithm", publicKey.algorithm)
      attributes.putString("format", publicKey.format)

      // Check if the key actually requires user authentication
      val requiresAuth = try {
        val privateKey = keyStore.getKey(actualKeyAlias, null) as java.security.PrivateKey
        val keyFactory = java.security.KeyFactory.getInstance(privateKey.algorithm, "AndroidKeyStore")
        val keyInfo = keyFactory.getKeySpec(privateKey, android.security.keystore.KeyInfo::class.java)
        keyInfo.isUserAuthenticationRequired
      } catch (e: Exception) {
        // If we can't determine, assume it doesn't require auth
        false
      }
      attributes.putBoolean("userAuthenticationRequired", requiresAuth)

      attributes.putString("securityLevel", "Hardware")
      attributes.putBoolean("hardwareBacked", true)

      // Add default values for required fields
      val purposes = Arguments.createArray()
      purposes.pushString("sign")
      purposes.pushString("verify")
      attributes.putArray("purposes", purposes)

      val digests = Arguments.createArray()
      digests.pushString("SHA256")
      attributes.putArray("digests", digests)

      val padding = Arguments.createArray()
      padding.pushString("PKCS1")
      attributes.putArray("padding", padding)

      if (publicKey is RSAPublicKey) {
        attributes.putInt("keySize", publicKey.modulus.bitLength())
      }

      val result = Arguments.createMap()
      result.putBoolean("exists", true)
      result.putMap("attributes", attributes)
      promise.resolve(result)

    } catch (e: Exception) {
      debugLog("getKeyAttributes failed - ${e.message}")
      val result = Arguments.createMap()
      result.putBoolean("exists", false)
      result.putString("error", "Failed to get key attributes: ${e.message}")
      promise.resolve(result)
    }
  }

  fun runBiometricTest(promise: Promise) {
    runBiometricTest("strong", promise)
  }

  fun runBiometricTest(biometricStrength: String?, promise: Promise) {
    debugLog("runBiometricTest called")

    val biometricManager = BiometricManager.from(context)
    val result = Arguments.createMap()
    val results = Arguments.createMap()
    val errors = Arguments.createArray()
    val warnings = Arguments.createArray()

    // Test sensor availability based on requested strength
    val requestedStrength = biometricStrength ?: "strong"
    val authenticator = if (requestedStrength == "weak") {
      BiometricManager.Authenticators.BIOMETRIC_WEAK
    } else {
      BiometricManager.Authenticators.BIOMETRIC_STRONG
    }

    val canAuthenticateRequested = biometricManager.canAuthenticate(authenticator)
    val sensorAvailable = canAuthenticateRequested == BiometricManager.BIOMETRIC_SUCCESS
    results.putBoolean("sensorAvailable", sensorAvailable)
    results.putString("testedStrength", requestedStrength)

    if (!sensorAvailable) {
      when (canAuthenticateRequested) {
        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE ->
          errors.pushString("No biometric hardware available")
        BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE ->
          errors.pushString("Biometric hardware unavailable")
        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED ->
          warnings.pushString("No biometrics enrolled")
        BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
          errors.pushString("Security update required")
        BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED ->
          errors.pushString("Biometric authentication unsupported")
        BiometricManager.BIOMETRIC_STATUS_UNKNOWN ->
          warnings.pushString("Biometric status unknown")
      }
    }

    // Test authentication capability
    val canAuthenticateAny = biometricManager.canAuthenticate(
      BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
    )
    results.putBoolean("canAuthenticate", canAuthenticateAny == BiometricManager.BIOMETRIC_SUCCESS)

    // Check hardware detection
    val hardwareDetected = canAuthenticateRequested != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
    results.putBoolean("hardwareDetected", hardwareDetected)

    // Check enrolled biometrics
    val hasEnrolledBiometrics = canAuthenticateRequested != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED
    results.putBoolean("hasEnrolledBiometrics", hasEnrolledBiometrics)

    // Check secure hardware
    val secureHardware = isSecureHardware()
    results.putBoolean("secureHardware", secureHardware)

    result.putBoolean("success", errors.size() == 0)
    result.putMap("results", results)
    result.putArray("errors", errors)
    result.putArray("warnings", warnings)

    promise.resolve(result)
  }
    private fun isHardwareBacked(key: java.security.Key): Boolean {
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

  fun getDeviceIntegrityStatus(promise: Promise) {
    debugLog("getDeviceIntegrityStatus called")

    try {
      val integrityStatus = BiometricUtils.getDeviceIntegrityStatus(context)
      debugLog("Device integrity check completed - isCompromised: ${integrityStatus.getBoolean("isCompromised")}")
      promise.resolve(integrityStatus)
    } catch (e: Exception) {
      debugLog("getDeviceIntegrityStatus failed - ${e.message}")
      val errorResult = Arguments.createMap()
      errorResult.putBoolean("isRooted", false)
      errorResult.putBoolean("isKeyguardSecure", false)
      errorResult.putBoolean("hasSecureHardware", false)
      errorResult.putBoolean("isCompromised", true)
      errorResult.putString("riskLevel", "UNKNOWN")
      errorResult.putString("error", "Failed to check device integrity: ${e.message}")
      promise.resolve(errorResult)
    }
  }

  /**
   * Creates a signature for the given payload using the specified key alias.
   * This method is used by the old architecture module.
   */
  fun createSignature(payload: String, keyAlias: String?, biometricStrength: String?, promise: Promise) {
    createSignature(payload, keyAlias, biometricStrength, false, promise)
  }

  fun createSignature(payload: String, keyAlias: String?, biometricStrength: String?, disableDeviceFallback: Boolean, promise: Promise) {
    debugLog("createSignature called with keyAlias: ${keyAlias ?: "default"}, biometricStrength: ${biometricStrength ?: "strong"}, disableDeviceFallback: $disableDeviceFallback")

    // Validate payload parameter
    if (payload.isEmpty()) {
      debugLog("createSignature failed - payload is empty")
      val errorResult = Arguments.createMap()
      errorResult.putBoolean("success", false)
      errorResult.putString("error", "Payload cannot be empty")
      promise.resolve(errorResult)
      return
    }

    // Delegate to verifyKeySignature with default prompt messages
    verifyKeySignature(keyAlias, payload, "Biometric Authentication", "Use your biometric to sign", "Cancel", biometricStrength, disableDeviceFallback, promise)
  }

  /**
   * Verifies a signature against the given payload using the specified key alias.
   * This method is used by the old architecture module.
   */
  fun verifySignature(signature: String, payload: String, keyAlias: String?, promise: Promise) {
    debugLog("verifySignature called with keyAlias: ${keyAlias ?: "default"}")

    // Validate signature parameter
    if (signature.isEmpty()) {
      debugLog("verifySignature failed - signature is empty")
      val errorResult = Arguments.createMap()
      errorResult.putBoolean("valid", false)
      errorResult.putString("error", "Signature cannot be empty")
      promise.resolve(errorResult)
      return
    }

    // Validate payload parameter
    if (payload.isEmpty()) {
      debugLog("verifySignature failed - payload is empty")
      val errorResult = Arguments.createMap()
      errorResult.putBoolean("valid", false)
      errorResult.putString("error", "Payload cannot be empty")
      promise.resolve(errorResult)
      return
    }

    // Delegate to validateSignature
    validateSignature(keyAlias, payload, signature, promise)
  }

  // Biometric change detection methods
  fun setBiometricChangeListener(listener: (WritableMap) -> Unit) {
    biometricChangeListener = listener
  }

  fun startBiometricChangeDetection() {
    if (!isDetectionActive) {
      isDetectionActive = true
      lastBiometricState = getCurrentBiometricState()
      context.addLifecycleEventListener(lifecycleListener)
      debugLog("Started biometric change detection with lifecycle listener")
    }
  }

  fun stopBiometricChangeDetection() {
    if (isDetectionActive) {
      isDetectionActive = false
      context.removeLifecycleEventListener(lifecycleListener)
      lastBiometricState = null
      debugLog("Stopped biometric change detection")
    }
  }

  private fun getCurrentBiometricState(): BiometricState {
    val biometricManager = BiometricManager.from(context)

    // Get biometric authentication status
    val canAuthenticateResult = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK)

    val (available, biometryType, enrolled) = when (canAuthenticateResult) {
      BiometricManager.BIOMETRIC_SUCCESS -> Triple(true, "Biometrics", true)
      BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> Triple(false, "None", false)
      BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> Triple(false, "Unavailable", false)
      BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> Triple(true, "Biometrics", false)
      else -> Triple(false, "Unknown", false)
    }

    // Count biometric-protected keys as a proxy for biometric state
    // This helps detect when biometrics are re-enrolled (which invalidates crypto keys)
    val keyCount = try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      var biometricKeyCount = 0
      val aliases = keyStore.aliases()
      while (aliases.hasMoreElements()) {
        val alias = aliases.nextElement()
        try {
          val entry = keyStore.getEntry(alias, null)
          if (entry is KeyStore.PrivateKeyEntry) {
            biometricKeyCount++
          }
        } catch (e: Exception) {
          // Key might be inaccessible, which could indicate biometric change
        }
      }
      biometricKeyCount
    } catch (e: Exception) {
      debugLog("Error getting keystore info: ${e.message}")
      -1
    }

    return BiometricState(
      available = available,
      enrolled = enrolled,
      biometryType = biometryType,
      keyCount = keyCount,
      statusCode = canAuthenticateResult,
      timestamp = System.currentTimeMillis()
    )
  }

  private fun checkForBiometricChanges() {
    try {
      val currentState = getCurrentBiometricState()
      val lastState = lastBiometricState

      // If this is the first check, just save the state without emitting an event
      if (lastState == null) {
        lastBiometricState = currentState
        debugLog("Initial biometric state recorded")
        return
      }

      // Check for changes using data class equality
      if (currentState != lastState) {
        val changeType = when {
          !lastState.available && currentState.available -> "BIOMETRIC_ENABLED"
          lastState.available && !currentState.available -> "BIOMETRIC_DISABLED"
          lastState.biometryType != currentState.biometryType -> "HARDWARE_UNAVAILABLE"
          lastState.enrolled != currentState.enrolled -> "ENROLLMENT_CHANGED"
          lastState.keyCount != currentState.keyCount -> "ENROLLMENT_CHANGED"
          else -> "STATE_CHANGED"
        }

        // Create event map with timestamp and change info
        val changeEvent = Arguments.createMap().apply {
          putDouble("timestamp", currentState.timestamp.toDouble())
          putString("biometryType", currentState.biometryType)
          putBoolean("available", currentState.available)
          putBoolean("enrolled", currentState.enrolled)
          putString("changeType", changeType)
        }

        lastBiometricState = currentState
        biometricChangeListener?.invoke(changeEvent)
        debugLog("Biometric state changed: $changeType")
      } else {
        debugLog("No change detected")
      }
    } catch (e: Exception) {
      debugLog("Error checking biometric changes: ${e.message}")
    }
  }
}
