package com.sbaiahmed1.reactnativebiometrics

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
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

  private var configuredKeyAlias: String? = null

  private fun getKeyAlias(keyAlias: String? = null): String {
    return keyAlias ?: configuredKeyAlias ?: run {
      val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      sharedPrefs.getString(KEY_ALIAS_PREF, DEFAULT_KEY_ALIAS) ?: DEFAULT_KEY_ALIAS
    }
  }

  fun isSensorAvailable(promise: Promise) {
    debugLog("isSensorAvailable called")
      debugLog("isSensorAvailable called")
        try {
          val biometricManager = BiometricManager.from(context)
          val result = Arguments.createMap()
          val status = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
          debugLog("Biometric status: $status")

          when (status) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
              debugLog("Biometric authentication available")
              result.putBoolean("available", true)
              result.putString("biometryType", "Biometrics")
            }
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
              debugLog("No biometric hardware available")
              result.putBoolean("available", false)
              result.putString("error", "No biometric hardware available")
            }
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> {
              debugLog("Biometric hardware unavailable")
              result.putBoolean("available", false)
              result.putString("error", "Biometric hardware unavailable")
            }
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
              debugLog("No biometric credentials enrolled")
              result.putBoolean("available", false)
              result.putString("error", "No biometric credentials enrolled")
            }
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> {
              debugLog("Security update required")
              result.putBoolean("available", false)
              result.putString("error", "Security update required")
            }
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> {
              debugLog("Biometric authentication unsupported")
              result.putBoolean("available", false)
              result.putString("error", "Biometric authentication unsupported")
            }
            BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> {
              debugLog("Biometric status unknown")
              result.putBoolean("available", false)
              result.putString("error", "Biometric status unknown")
            }
            else -> {
              debugLog("Unknown biometric status: $status")
              result.putBoolean("available", false)
              result.putString("error", "Unknown biometric status")
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
    debugLog("simplePrompt called with message: $promptMessage, cancelButton: $cancelButtonText")
    val biometricManager = BiometricManager.from(context)
    val result = Arguments.createMap()
    val executor = ContextCompat.getMainExecutor(context)

    val biometricStatus = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    debugLog("simplePrompt - Biometric status: $biometricStatus")

    val authenticators = if (biometricStatus == BiometricManager.BIOMETRIC_SUCCESS) {
      debugLog("simplePrompt - Using BIOMETRIC_STRONG authenticator")
      BiometricManager.Authenticators.BIOMETRIC_STRONG
    } else {
      debugLog("simplePrompt - Using DEVICE_CREDENTIAL fallback")
      BiometricManager.Authenticators.DEVICE_CREDENTIAL
    }

    val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle(promptMessage)
      .setAllowedAuthenticators(authenticators)

    if (authenticators == BiometricManager.Authenticators.BIOMETRIC_STRONG) {
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
        
        // Map Android BiometricPrompt error codes to consistent error codes
        val mappedErrorCode = when (errorCode) {
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
        
        promise.reject(mappedErrorCode, errString.toString(), null)
      }

      override fun onAuthenticationFailed() {
        debugLog("simplePrompt authentication failed - allowing retry")
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
          debugLog("simplePrompt failed to show biometric prompt: ${e.message}")
          promise.reject("PROMPT_ERROR", "Failed to show biometric prompt: ${e.message}", e)
        }
      } else {
        debugLog("simplePrompt - No valid activity available")
        promise.reject("NO_ACTIVITY", "No active activity available for biometric authentication", null)
      }
    }
  }

  fun createKeys(keyAlias: String?, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    debugLog("createKeys called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias")
    try {

      // Check if key already exists
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      if (keyStore.containsAlias(actualKeyAlias)) {
        debugLog("Key already exists, deleting existing key")
        keyStore.deleteEntry(actualKeyAlias)
      }

      // Generate new key pair
      val keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore")

      val keyGenParameterSpec = KeyGenParameterSpec.Builder(
        actualKeyAlias,
        KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
      )
        .setDigests(KeyProperties.DIGEST_SHA256)
        .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
        .setKeySize(2048)
        .setUserAuthenticationRequired(true)
        .setUserAuthenticationValidityDurationSeconds(-1) // Require auth for every use
        .build()

      keyPairGenerator.initialize(keyGenParameterSpec)
      val keyPair = keyPairGenerator.generateKeyPair()

      // Get public key and encode it
      val publicKey = keyPair.public
      val publicKeyBytes = publicKey.encoded
      val publicKeyString = Base64.encodeToString(publicKeyBytes, Base64.DEFAULT)

      val result = Arguments.createMap()
      result.putString("publicKey", publicKeyString)

      debugLog("Keys created successfully with alias: $actualKeyAlias")
      promise.resolve(result)

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

    debugLog("Authentication options - title: $title, allowDeviceCredentials: $allowDeviceCredentials, disableDeviceFallback: $disableDeviceFallback")

    val authenticators = if (allowDeviceCredentials && !disableDeviceFallback) {
      BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
    } else {
      BiometricManager.Authenticators.BIOMETRIC_STRONG
    }

    debugLog("Using authenticators: $authenticators")

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
        promise.resolve(successResult)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        debugLog("authenticateWithOptions authentication error: $errorCode - $errString")
        
        // Map Android BiometricPrompt error codes to consistent error codes
        val mappedErrorCode = when (errorCode) {
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

  fun getAllKeys(promise: Promise) {
    debugLog("getAllKeys called")
        try {
          val keyStore = KeyStore.getInstance("AndroidKeyStore")
          keyStore.load(null)

          val keysList = Arguments.createArray()
          val aliases = keyStore.aliases()

          while (aliases.hasMoreElements()) {
            val alias = aliases.nextElement()

            // Filter for our biometric keys
            if (alias.equals(getKeyAlias())) {
              try {
                val keyEntry = keyStore.getEntry(alias, null)
                if (keyEntry is KeyStore.PrivateKeyEntry) {
                  val publicKey = keyEntry.certificate.publicKey
                  val publicKeyBytes = publicKey.encoded
                  val publicKeyString = Base64.encodeToString(publicKeyBytes, Base64.DEFAULT)

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

        // Create signature instance and initialize it with the private key for authentication-required keys
        val testSignature = java.security.Signature.getInstance("SHA256withRSA")
        testSignature.initSign(privateKey)
        
        // Create CryptoObject with the signature for authentication-required keys
        val cryptoObject = BiometricPrompt.CryptoObject(testSignature)
        
        // For authentication-required keys, we need biometric authentication before signature test
        val executor = ContextCompat.getMainExecutor(context)
        val biometricManager = BiometricManager.from(context)
        val biometricStatus = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)

        val authenticators = if (biometricStatus == BiometricManager.BIOMETRIC_SUCCESS) {
          BiometricManager.Authenticators.BIOMETRIC_STRONG
        } else {
          BiometricManager.Authenticators.DEVICE_CREDENTIAL
        }

        val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
          .setTitle("Authenticate to test key integrity")
          .setSubtitle("Please verify your identity to test the key")
          .setAllowedAuthenticators(authenticators)

        if (authenticators == BiometricManager.Authenticators.BIOMETRIC_STRONG) {
          promptInfoBuilder.setNegativeButtonText("Cancel")
        }

        val promptInfo = promptInfoBuilder.build()

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
              val verifySignature = java.security.Signature.getInstance("SHA256withRSA")
              verifySignature.initVerify(publicKey)
              verifySignature.update(testData)
              val isValid = verifySignature.verify(signatureBytes)

              integrityChecks.putBoolean("signatureTestPassed", isValid)

              val successResult = Arguments.createMap()
              if (isValid) {
                successResult.putBoolean("valid", true)
              }

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

  fun verifyKeySignature(keyAlias: String?, data: String, promise: Promise) {
    val actualKeyAlias = getKeyAlias(keyAlias)
    debugLog("verifyKeySignature called with keyAlias: ${keyAlias ?: "default"}, using: $actualKeyAlias")

    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)

      if (!keyStore.containsAlias(actualKeyAlias)) {
        val errorResult = Arguments.createMap()
        errorResult.putBoolean("success", false)
        errorResult.putString("error", "Key not found")
        promise.resolve(errorResult)
        return
      }

      val keyEntry = keyStore.getEntry(actualKeyAlias, null)
      if (keyEntry !is KeyStore.PrivateKeyEntry) {
        val errorResult = Arguments.createMap()
        errorResult.putBoolean("success", false)
        errorResult.putString("error", "Invalid key type")
        promise.resolve(errorResult)
        return
      }

      val privateKey = keyEntry.privateKey
      
      // Create signature instance and initialize it with the private key
      val signature = Signature.getInstance("SHA256withRSA")
      signature.initSign(privateKey)
      
      // Create CryptoObject with the signature for authentication-required keys
      val cryptoObject = BiometricPrompt.CryptoObject(signature)
      
      // For authentication-required keys, we need biometric authentication before signing
      val executor = ContextCompat.getMainExecutor(context)
      val biometricManager = BiometricManager.from(context)
      val biometricStatus = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)

      val authenticators = if (biometricStatus == BiometricManager.BIOMETRIC_SUCCESS) {
        BiometricManager.Authenticators.BIOMETRIC_STRONG
      } else {
        BiometricManager.Authenticators.DEVICE_CREDENTIAL
      }

      val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
        .setTitle("Authenticate to sign data")
        .setSubtitle("Please verify your identity to generate signature")
        .setAllowedAuthenticators(authenticators)

      if (authenticators == BiometricManager.Authenticators.BIOMETRIC_STRONG) {
        promptInfoBuilder.setNegativeButtonText("Cancel")
      }

      val promptInfo = promptInfoBuilder.build()

      val activity = context.currentActivity as? FragmentActivity
      if (activity == null || activity.isFinishing || activity.isDestroyed) {
        debugLog("verifyKeySignature failed - No valid activity available")
        val errorResult = Arguments.createMap()
        errorResult.putBoolean("success", false)
        errorResult.putString("error", "No valid activity available for biometric authentication")
        promise.resolve(errorResult)
        return
      }

      val biometricPrompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
          debugLog("verifyKeySignature - Authentication succeeded, generating signature")

          try {
            // Use the authenticated signature from the CryptoObject
            val authenticatedSignature = authResult.cryptoObject?.signature
            if (authenticatedSignature == null) {
              debugLog("verifyKeySignature - No authenticated signature available")
              val errorResult = Arguments.createMap()
              errorResult.putBoolean("success", false)
              errorResult.putString("error", "No authenticated signature available")
              promise.resolve(errorResult)
              return
            }
            
            authenticatedSignature.update(data.toByteArray())
            val signatureBytes = authenticatedSignature.sign()
            val signatureString = Base64.encodeToString(signatureBytes, Base64.DEFAULT)

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("signature", signatureString)
            debugLog("verifyKeySignature completed successfully")
            promise.resolve(result)

          } catch (e: Exception) {
            debugLog("verifyKeySignature - Signature generation failed: ${e.message}")
            val errorResult = Arguments.createMap()
            errorResult.putBoolean("success", false)
            errorResult.putString("error", "Failed to generate signature: ${e.message}")
            promise.resolve(errorResult)
          }
        }

        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          debugLog("verifyKeySignature - Authentication error: $errorCode - $errString")
          val errorResult = Arguments.createMap()
          errorResult.putBoolean("success", false)
          errorResult.putString("error", "Authentication failed: $errString")
          promise.resolve(errorResult)
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
          val errorResult = Arguments.createMap()
          errorResult.putBoolean("success", false)
          errorResult.putString("error", "Failed to show biometric prompt: ${e.message}")
          promise.resolve(errorResult)
        }
      }

    } catch (e: Exception) {
      debugLog("verifyKeySignature failed - ${e.message}")
      val errorResult = Arguments.createMap()
      errorResult.putBoolean("success", false)
      errorResult.putString("error", "Failed to verify signature: ${e.message}")
      promise.resolve(errorResult)
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
      val signatureInstance = Signature.getInstance("SHA256withRSA")
      signatureInstance.initVerify(publicKey)
      signatureInstance.update(data.toByteArray())

      val signatureBytes = Base64.decode(signature, Base64.DEFAULT)
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
      attributes.putBoolean("userAuthenticationRequired", true)
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
    debugLog("runBiometricTest called")

    val biometricManager = BiometricManager.from(context)
    val result = Arguments.createMap()
    val results = Arguments.createMap()
    val errors = Arguments.createArray()
    val warnings = Arguments.createArray()

    // Test sensor availability
    val canAuthenticateStrong = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    val sensorAvailable = canAuthenticateStrong == BiometricManager.BIOMETRIC_SUCCESS
    results.putBoolean("sensorAvailable", sensorAvailable)

    if (!sensorAvailable) {
      when (canAuthenticateStrong) {
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
    val hardwareDetected = canAuthenticateStrong != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
    results.putBoolean("hardwareDetected", hardwareDetected)

    // Check enrolled biometrics
    val hasEnrolledBiometrics = canAuthenticateStrong != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED
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
}
