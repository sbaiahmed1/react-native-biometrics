package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.bridge.ReactContextBaseJavaModule

abstract class ReactNativeBiometricsSpec(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), TurboModule {
  abstract fun isSensorAvailable(promise: Promise)
  abstract fun simplePrompt(reason: String, promise: Promise)
  abstract fun authenticateWithOptions(options: com.facebook.react.bridge.ReadableMap, promise: Promise)
  // Key management
  abstract fun createKeys(keyAlias: String?, promise: Promise)
  abstract fun deleteKeys(keyAlias: String?, promise: Promise)
  abstract fun getAllKeys(promise: Promise)
  // Key integrity validation
  abstract fun validateKeyIntegrity(keyAlias: String?, promise: Promise)
  abstract fun verifyKeySignature(keyAlias: String?, data: String, promise: Promise)
  abstract fun validateSignature(keyAlias: String?, data: String, signature: String, promise: Promise)
  abstract fun getKeyAttributes(keyAlias: String?, promise: Promise)
  // Configuration
  abstract fun configureKeyAlias(keyAlias: String, promise: Promise)
  abstract fun getDefaultKeyAlias(promise: Promise)
  // Debugging utilities
  abstract fun getDiagnosticInfo(promise: Promise)
  abstract fun runBiometricTest(promise: Promise)
  abstract fun setDebugMode(enabled: Boolean, promise: Promise)
  // Device security
  abstract fun getDeviceIntegrityStatus(promise: Promise)
}
