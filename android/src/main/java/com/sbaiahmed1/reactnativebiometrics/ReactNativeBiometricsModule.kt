package com.sbaiahmed1.reactnativebiometrics

import android.os.Handler
import android.os.Looper
import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.spec.RSAKeyGenParameterSpec
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.PublicKey
import android.util.Base64
import java.security.NoSuchAlgorithmException
import java.security.InvalidAlgorithmParameterException
import java.security.KeyStoreException
import java.security.cert.CertificateException
import java.io.IOException
import java.security.UnrecoverableKeyException
import java.security.NoSuchProviderException

class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  ReactNativeBiometricsSpec(reactContext) {
  companion object {
    const val NAME = "ReactNativeBiometrics" // Make sure this exists and is correct
  }
  private val context: Context = reactContext

  override fun getName() = NAME

  @ReactMethod
  override fun isSensorAvailable(promise: Promise) {
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

  @ReactMethod
  override fun simplePrompt(reason: String, promise: Promise) {
    debugLog("simplePrompt called with message: $reason")
    val executor = ContextCompat.getMainExecutor(context)

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle(reason)
      .setSubtitle(reason)
      .setNegativeButtonText("Cancel")
      .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
      .build()

    val callback = object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        debugLog("simplePrompt authentication succeeded")
        promise.resolve(true)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        debugLog("simplePrompt authentication error: $errorCode - $errString")
        promise.reject("AUTH_ERROR", errString.toString())
      }

      override fun onAuthenticationFailed() {
        debugLog("simplePrompt authentication failed")
        promise.reject("AUTH_FAILED", "Authentication failed")
      }
    }

    Handler(Looper.getMainLooper()).post {
      val activity = currentActivity as? androidx.fragment.app.FragmentActivity
      if (activity != null) {
        debugLog("Showing biometric prompt")
        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
      } else {
        debugLog("No active activity available")
        promise.reject("NO_ACTIVITY", "No active activity")
      }
    }
  }

  @ReactMethod
  override fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
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
        result.putBoolean("success", true)
        promise.resolve(result)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        debugLog("authenticateWithOptions authentication error: $errorCode - $errString")
        result.putBoolean("success", false)
        result.putString("error", errString.toString())
        result.putString("errorCode", errorCode.toString())
        promise.resolve(result)
      }

      override fun onAuthenticationFailed() {
        debugLog("authenticateWithOptions authentication failed")
        result.putBoolean("success", false)
        result.putString("error", "Authentication failed")
        result.putString("errorCode", "AUTH_FAILED")
        promise.resolve(result)
      }
    }

    Handler(Looper.getMainLooper()).post {
      val activity = currentActivity as? androidx.fragment.app.FragmentActivity
      if (activity != null) {
        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
      } else {
        result.putBoolean("success", false)
        result.putString("error", "No active activity")
        result.putString("errorCode", "NO_ACTIVITY")
        promise.resolve(result)
      }
    }
  }

  // MARK: - Debugging Utilities

  @ReactMethod
  override fun getDiagnosticInfo(promise: Promise) {
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

  @ReactMethod
  override fun runBiometricTest(promise: Promise) {
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

  @ReactMethod
  override fun setDebugMode(enabled: Boolean, promise: Promise) {
    val sharedPrefs = context.getSharedPreferences("ReactNativeBiometrics", Context.MODE_PRIVATE)
    sharedPrefs.edit().putBoolean("debugMode", enabled).apply()
    
    if (enabled) {
      android.util.Log.d("ReactNativeBiometrics", "Debug mode enabled")
    } else {
      android.util.Log.d("ReactNativeBiometrics", "Debug mode disabled")
    }
    
    promise.resolve(null)
  }

  // MARK: - Private Helper Methods

  private fun getBiometricCapabilities(): com.facebook.react.bridge.WritableArray {
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
    // Check if device has secure hardware for biometrics
    return try {
      val biometricManager = BiometricManager.from(context)
      biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) != BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED
    } catch (e: Exception) {
      false
    }
  }

  private fun isDebugModeEnabled(): Boolean {
    val sharedPrefs = context.getSharedPreferences("ReactNativeBiometrics", Context.MODE_PRIVATE)
    return sharedPrefs.getBoolean("debugMode", false)
  }

  @ReactMethod
  override fun createKeys(promise: Promise) {
    debugLog("createKeys called")
    try {
      val keyAlias = "ReactNativeBiometricsKey"
      
      // Check if key already exists
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      
      if (keyStore.containsAlias(keyAlias)) {
        debugLog("Key already exists, deleting existing key")
        keyStore.deleteEntry(keyAlias)
      }
      
      // Generate new key pair
      val keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore")
      
      val keyGenParameterSpec = KeyGenParameterSpec.Builder(
        keyAlias,
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
      
      debugLog("Keys created successfully with alias: $keyAlias")
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

  @ReactMethod
  override fun deleteKeys(promise: Promise) {
    debugLog("deleteKeys called")
    try {
      val keyAlias = "ReactNativeBiometricsKey"
      
      // Access the Android KeyStore
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      
      // Check if the key exists
      if (keyStore.containsAlias(keyAlias)) {
        // Delete the key
        keyStore.deleteEntry(keyAlias)
        debugLog("Key with alias '$keyAlias' deleted successfully")
        
        // Verify deletion
        if (!keyStore.containsAlias(keyAlias)) {
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
        debugLog("No key found with alias '$keyAlias' - nothing to delete")
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

  @ReactMethod
  override fun getAllKeys(promise: Promise) {
    debugLog("getAllKeys called")
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      
      val keysList = Arguments.createArray()
      val aliases = keyStore.aliases()
      
      while (aliases.hasMoreElements()) {
        val alias = aliases.nextElement()
        
        // Filter for our biometric keys (you can adjust this filter as needed)
        if (alias.contains("ReactNativeBiometrics") || alias.contains("Biometric")) {
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

  private fun debugLog(message: String) {
    if (isDebugModeEnabled()) {
      android.util.Log.d("ReactNativeBiometrics Debug", message)
    }
  }
}
