package com.sbaiahmed1.reactnativebiometrics

import android.os.Handler
import android.os.Looper
import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
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
import androidx.core.content.edit

class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  ReactNativeBiometricsSpec(reactContext) {
  companion object {
    const val NAME = "ReactNativeBiometrics" // Make sure this exists and is correct
    private const val PREFS_NAME = "ReactNativeBiometrics"
    private const val KEY_ALIAS_PREF = "keyAlias"
  }
  private val context: Context = reactContext
  private var configuredKeyAlias: String?

  init {
    // Load configured key alias from SharedPreferences
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    configuredKeyAlias = sharedPrefs.getString(KEY_ALIAS_PREF, null)
  }

  private fun getKeyAlias(customAlias: String? = null): String {
    return customAlias ?: configuredKeyAlias ?: getDefaultKeyAlias()
  }

  private fun getDefaultKeyAlias(): String {
    // Generate app-specific default key alias
    val packageName = context.packageName
    return "$packageName.ReactNativeBiometricsKey"
  }

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
        // Ensure biometric prompt is called on the main thread
        activity.runOnUiThread {
          biometricPrompt.authenticate(promptInfo)
        }
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
        // Ensure biometric prompt is called on the main thread
        activity.runOnUiThread {
          biometricPrompt.authenticate(promptInfo)
        }
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
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    sharedPrefs.edit { putBoolean("debugMode", enabled) }

    if (enabled) {
      android.util.Log.d("ReactNativeBiometrics", "Debug mode enabled")
    } else {
      android.util.Log.d("ReactNativeBiometrics", "Debug mode disabled")
    }

    promise.resolve(null)
  }

  @ReactMethod
  override fun configureKeyAlias(keyAlias: String, promise: Promise) {
    debugLog("configureKeyAlias called with: $keyAlias")

    // Validate key alias
    if (keyAlias.isEmpty()) {
      promise.reject("INVALID_KEY_ALIAS", "Key alias cannot be empty", null)
      return
    }

    // Store the configured key alias
    configuredKeyAlias = keyAlias
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    sharedPrefs.edit { putString(KEY_ALIAS_PREF, keyAlias) }

    debugLog("Key alias configured successfully: $keyAlias")
    promise.resolve(null)
  }

  @ReactMethod
  override fun getDefaultKeyAlias(promise: Promise) {
    val currentAlias = getKeyAlias()
    debugLog("getDefaultKeyAlias returning: $currentAlias")
    promise.resolve(currentAlias)
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
    val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return sharedPrefs.getBoolean("debugMode", false)
  }

  @ReactMethod
  override fun createKeys(keyAlias: String?, promise: Promise) {
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

  @ReactMethod
  override fun deleteKeys(keyAlias: String?, promise: Promise) {
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

  @ReactMethod
  override fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
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
      keyAttributes.putInt("keySize", getKeySize(privateKey))
      keyAttributes.putString("securityLevel", if (isHardwareBacked(privateKey)) "Hardware" else "Software")
      result.putMap("keyAttributes", keyAttributes)
      
      // Update integrity checks
      integrityChecks.putBoolean("keyFormatValid", true)
      integrityChecks.putBoolean("keyAccessible", true)
      integrityChecks.putBoolean("hardwareBacked", isHardwareBacked(privateKey))
      
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
      
      val activity = currentActivity as? FragmentActivity
      if (activity == null) {
        debugLog("validateKeyIntegrity failed - Activity context not available")
        result.putString("error", "Activity context not available")
        result.putMap("integrityChecks", integrityChecks)
        promise.resolve(result)
        return
      }
      
      val biometricPrompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
          debugLog("validateKeyIntegrity - Authentication succeeded, performing signature test")
          
          try {
            val testData = "integrity_test_data".toByteArray()
            val signature = java.security.Signature.getInstance("SHA256withRSA")
            signature.initSign(privateKey)
            signature.update(testData)
            val signatureBytes = signature.sign()
            
            // Verify the signature
            val verifySignature = java.security.Signature.getInstance("SHA256withRSA")
            verifySignature.initVerify(publicKey)
            verifySignature.update(testData)
            val isValid = verifySignature.verify(signatureBytes)
            
            integrityChecks.putBoolean("signatureTestPassed", isValid)
            
            if (isValid) {
              result.putBoolean("valid", true)
            }
            
            result.putMap("integrityChecks", integrityChecks)
            debugLog("validateKeyIntegrity completed - valid: ${result.getBoolean("valid")}")
            promise.resolve(result)
            
          } catch (e: Exception) {
            debugLog("validateKeyIntegrity - Signature test failed: ${e.message}")
            integrityChecks.putBoolean("signatureTestPassed", false)
            result.putMap("integrityChecks", integrityChecks)
            promise.resolve(result)
          }
        }
        
        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          debugLog("validateKeyIntegrity - Authentication error: $errorCode - $errString")
          integrityChecks.putBoolean("signatureTestPassed", false)
          result.putString("error", "Authentication failed: $errString")
          result.putMap("integrityChecks", integrityChecks)
          promise.resolve(result)
        }
        
        override fun onAuthenticationFailed() {
          debugLog("validateKeyIntegrity - Authentication failed")
          integrityChecks.putBoolean("signatureTestPassed", false)
          result.putString("error", "Biometric authentication failed")
          result.putMap("integrityChecks", integrityChecks)
          promise.resolve(result)
        }
      })
      
      // Show biometric prompt on main thread
      activity.runOnUiThread {
        biometricPrompt.authenticate(promptInfo)
      }
      
    } catch (e: Exception) {
      debugLog("validateKeyIntegrity failed - ${e.message}")
      result.putString("error", e.message)
      result.putMap("integrityChecks", integrityChecks)
      promise.resolve(result)
    }
  }
  
  @ReactMethod
  override fun verifyKeySignature(keyAlias: String?, data: String, promise: Promise) {
    debugLog("verifyKeySignature called with keyAlias: ${keyAlias ?: "default"}")
    
    val actualKeyAlias = getKeyAlias(keyAlias)
    val result = Arguments.createMap()
    val executor = ContextCompat.getMainExecutor(context)
    
    // Check if key exists (without accessing the private key which requires authentication)
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      
      if (!keyStore.containsAlias(actualKeyAlias)) {
        debugLog("verifyKeySignature failed - Key not found")
        result.putBoolean("success", false)
        result.putString("error", "Key not found")
        promise.resolve(result)
        return
      }
      
      // Only check if the alias exists, don't access the private key yet
      debugLog("verifyKeySignature - Key alias exists, proceeding with authentication")
    } catch (e: Exception) {
      debugLog("verifyKeySignature failed during key existence check - ${e.message}")
      result.putBoolean("success", false)
      result.putString("error", e.message)
      promise.resolve(result)
      return
    }
    
    // Check biometric availability and set up authenticators
    val biometricManager = BiometricManager.from(context)
    val biometricStatus = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    debugLog("verifyKeySignature - Biometric status: $biometricStatus")
    
    val authenticators = if (biometricStatus == BiometricManager.BIOMETRIC_SUCCESS) {
      debugLog("verifyKeySignature - Using BIOMETRIC_STRONG authenticator")
      BiometricManager.Authenticators.BIOMETRIC_STRONG
    } else {
      debugLog("verifyKeySignature - Using DEVICE_CREDENTIAL fallback")
      BiometricManager.Authenticators.DEVICE_CREDENTIAL
    }
    
    val activity = currentActivity as? FragmentActivity
    if (activity == null) {
      debugLog("verifyKeySignature failed - Activity context not available")
      result.putBoolean("success", false)
      result.putString("error", "Activity context not available")
      promise.resolve(result)
      return
    }
    
    debugLog("verifyKeySignature - Creating BiometricPrompt with activity: ${activity.javaClass.simpleName}")
    
    val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Authenticate to create signature")
      .setSubtitle("Please verify your identity to create the signature")
      .setAllowedAuthenticators(authenticators)
    
    if (authenticators == BiometricManager.Authenticators.BIOMETRIC_STRONG) {
      promptInfoBuilder.setNegativeButtonText("Cancel")
    }
    
    val promptInfo = promptInfoBuilder.build()
    
    val biometricPrompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
       override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
         debugLog("verifyKeySignature - Authentication succeeded, creating signature")
         
         try {
           val keyStore = KeyStore.getInstance("AndroidKeyStore")
           keyStore.load(null)
           
           val keyEntry = keyStore.getEntry(actualKeyAlias, null)
           if (keyEntry !is KeyStore.PrivateKeyEntry) {
             debugLog("verifyKeySignature failed - Invalid key type")
             result.putBoolean("success", false)
             result.putString("error", "Invalid key type")
             promise.resolve(result)
             return
           }
           
           val privateKey = keyEntry.privateKey
           val dataBytes = data.toByteArray()
           
           val signature = java.security.Signature.getInstance("SHA256withRSA")
           signature.initSign(privateKey)
           signature.update(dataBytes)
           val signatureBytes = signature.sign()
           val signatureBase64 = Base64.encodeToString(signatureBytes, Base64.DEFAULT)
           
           result.putBoolean("success", true)
           result.putString("signature", signatureBase64)
           
           debugLog("verifyKeySignature completed successfully")
           promise.resolve(result)
           
         } catch (e: Exception) {
           debugLog("verifyKeySignature failed during signing - ${e.message}")
           result.putBoolean("success", false)
           result.putString("error", e.message)
           promise.resolve(result)
         }
       }
       
       override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
         debugLog("verifyKeySignature - Authentication error: $errorCode - $errString")
         result.putBoolean("success", false)
         result.putString("error", "Authentication failed: $errString")
         promise.resolve(result)
       }
       
       override fun onAuthenticationFailed() {
         debugLog("verifyKeySignature - Authentication failed")
         result.putBoolean("success", false)
         result.putString("error", "Authentication failed")
         promise.resolve(result)
       }
     })
    
    // Show biometric prompt on main thread
    activity.runOnUiThread {
      biometricPrompt.authenticate(promptInfo)
    }
  }
  
  @ReactMethod
  override fun validateSignature(keyAlias: String?, data: String, signature: String, promise: Promise) {
    debugLog("validateSignature called with keyAlias: ${keyAlias ?: "default"}")
    
    val actualKeyAlias = getKeyAlias(keyAlias)
    val result = Arguments.createMap()
    
    // Enhanced input validation
    if (data.isEmpty()) {
      debugLog("validateSignature failed - Empty data provided")
      result.putBoolean("valid", false)
      result.putString("error", "Empty data provided")
      promise.resolve(result)
      return
    }
    
    if (signature.isEmpty()) {
      debugLog("validateSignature failed - Empty signature provided")
      result.putBoolean("valid", false)
      result.putString("error", "Empty signature provided")
      promise.resolve(result)
      return
    }
    
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      
      if (!keyStore.containsAlias(actualKeyAlias)) {
        debugLog("validateSignature failed - Key not found")
        result.putBoolean("valid", false)
        result.putString("error", "Key not found")
        promise.resolve(result)
        return
      }
      
      val keyEntry = keyStore.getEntry(actualKeyAlias, null)
      if (keyEntry !is KeyStore.PrivateKeyEntry) {
        debugLog("validateSignature failed - Invalid key type")
        result.putBoolean("valid", false)
        result.putString("error", "Invalid key type")
        promise.resolve(result)
        return
      }
      
      val publicKey = keyEntry.certificate.publicKey
      val dataBytes = data.toByteArray()
      val signatureBytes = Base64.decode(signature, Base64.DEFAULT)
      
      val verifySignature = java.security.Signature.getInstance("SHA256withRSA")
      verifySignature.initVerify(publicKey)
      verifySignature.update(dataBytes)
      val isValid = verifySignature.verify(signatureBytes)
      
      result.putBoolean("valid", isValid)
      
      debugLog("validateSignature completed - valid: $isValid")
      promise.resolve(result)
      
    } catch (e: Exception) {
      debugLog("validateSignature failed - ${e.message}")
      result.putBoolean("valid", false)
      result.putString("error", e.message)
      promise.resolve(result)
    }
  }
  
  @ReactMethod
  override fun getKeyAttributes(keyAlias: String?, promise: Promise) {
    debugLog("getKeyAttributes called with keyAlias: ${keyAlias ?: "default"}")
    
    val actualKeyAlias = getKeyAlias(keyAlias)
    val result = Arguments.createMap()
    
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      
      if (!keyStore.containsAlias(actualKeyAlias)) {
        debugLog("getKeyAttributes - Key not found")
        result.putBoolean("exists", false)
        promise.resolve(result)
        return
      }
      
      val keyEntry = keyStore.getEntry(actualKeyAlias, null)
      if (keyEntry !is KeyStore.PrivateKeyEntry) {
        debugLog("getKeyAttributes failed - Invalid key type")
        result.putBoolean("exists", false)
        result.putString("error", "Invalid key type")
        promise.resolve(result)
        return
      }
      
      val privateKey = keyEntry.privateKey
      val publicKey = keyEntry.certificate.publicKey
      
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
      attributes.putBoolean("userAuthenticationRequired", true)
      
      result.putBoolean("exists", true)
      result.putMap("attributes", attributes)
      
      debugLog("getKeyAttributes completed successfully")
      promise.resolve(result)
      
    } catch (e: Exception) {
      debugLog("getKeyAttributes failed - ${e.message}")
      result.putBoolean("exists", false)
      result.putString("error", e.message)
      promise.resolve(result)
    }
  }
  
  private fun getKeySize(key: java.security.Key): Int {
    return when (key.algorithm) {
      "RSA" -> {
        try {
          val rsaKey = key as java.security.interfaces.RSAKey
          rsaKey.modulus.bitLength()
        } catch (e: Exception) {
          2048 // Default RSA key size
        }
      }
      "EC" -> {
        try {
          val ecKey = key as java.security.interfaces.ECKey
          ecKey.params.order.bitLength()
        } catch (e: Exception) {
          256 // Default EC key size
        }
      }
      else -> 0
    }
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

  private fun debugLog(message: String) {
    if (isDebugModeEnabled()) {
      android.util.Log.d("ReactNativeBiometrics Debug", message)
    }
  }
}
