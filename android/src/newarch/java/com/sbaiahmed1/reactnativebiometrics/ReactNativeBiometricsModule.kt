package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * New Architecture (TurboModule) implementation of ReactNativeBiometricsModule
 * This extends the generated NativeReactNativeBiometricsSpec from codegen
 */
class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  NativeReactNativeBiometricsSpec(reactContext) {

  companion object {
    const val NAME = "ReactNativeBiometrics"
  }

  private val sharedImpl = ReactNativeBiometricsSharedImpl(reactContext)
  private var listenerCount = 0

  init {
    // Initialize biometric change detection with BOTH new and old event emission for compatibility
    sharedImpl.setBiometricChangeListener { event ->
      // Method 1: New architecture - use codegen-generated emitOnBiometricChange
      try {
        emitOnBiometricChange(event)
        android.util.Log.d("ReactNativeBiometrics", "Emitted via new arch method")
      } catch (e: Exception) {
        android.util.Log.e("ReactNativeBiometrics", "Failed to emit via new arch: ${e.message}")
      }

      // Method 2: Old architecture - use DeviceEventManagerModule for NativeEventEmitter compatibility
      try {
        reactApplicationContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit("onBiometricChange", event)
        android.util.Log.d("ReactNativeBiometrics", "Emitted via DeviceEventManagerModule")
      } catch (e: Exception) {
        android.util.Log.e("ReactNativeBiometrics", "Failed to emit via DeviceEventManagerModule: ${e.message}")
      }
    }

    // Note: Detection is now manually controlled via start/stopBiometricChangeDetection
    // Auto-start was removed to give users explicit control


  }

  override fun getName() = NAME

  @ReactMethod
  override fun isSensorAvailable(biometricStrength: String?, promise: Promise) {
    sharedImpl.isSensorAvailable(biometricStrength, promise)
  }

  @ReactMethod
  override fun simplePrompt(reason: String, biometricStrength: String?, promise: Promise) {
    sharedImpl.simplePrompt(reason, "Cancel", biometricStrength, promise)
  }

  // Delegate all other methods to shared implementation
  @ReactMethod
  override fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.authenticateWithOptions(options, promise)
  }

  @ReactMethod
  override fun createKeys(keyAlias: String?, keyType: String?, biometricStrength: String?, promise: Promise) {
    sharedImpl.createKeysWithType(keyAlias, keyType, biometricStrength, promise)
  }

  @ReactMethod
  override fun deleteKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.deleteKeys(keyAlias, promise)
  }

  @ReactMethod
  override fun getAllKeys(customAlias: String?, promise: Promise) {
    sharedImpl.getAllKeys(customAlias, promise)
  }

  @ReactMethod
  override fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
    sharedImpl.validateKeyIntegrity(keyAlias, promise)
  }

  @ReactMethod
  override fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, promise)
  }

  @ReactMethod
  override fun verifyKeySignatureWithOptions(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, biometricStrength: String?, disableDeviceFallback: Boolean?, inputEncoding: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, biometricStrength, disableDeviceFallback ?: false, inputEncoding ?: "utf8", promise)
  }

  @ReactMethod
  override fun verifyKeySignatureWithEncoding(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, inputEncoding: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, null, false, inputEncoding ?: "utf8", promise)
  }

  @ReactMethod
  override fun validateSignature(keyAlias: String?, data: String, signature: String, promise: Promise) {
    sharedImpl.validateSignature(keyAlias, data, signature, promise)
  }

  @ReactMethod
  override fun getKeyAttributes(keyAlias: String?, promise: Promise) {
    sharedImpl.getKeyAttributes(keyAlias, promise)
  }

  @ReactMethod
  override fun configureKeyAlias(keyAlias: String, promise: Promise) {
    sharedImpl.configureKeyAlias(keyAlias, promise)
  }

  @ReactMethod
  override fun getDefaultKeyAlias(promise: Promise) {
    sharedImpl.getDefaultKeyAlias(promise)
  }

  @ReactMethod
  override fun getDiagnosticInfo(promise: Promise) {
    sharedImpl.getDiagnosticInfo(promise)
  }

  @ReactMethod
  override fun runBiometricTest(promise: Promise) {
    sharedImpl.runBiometricTest(promise)
  }

  @ReactMethod
  override fun setDebugMode(enabled: Boolean, promise: Promise) {
    sharedImpl.setDebugMode(enabled, promise)
  }

  @ReactMethod
  override fun getDeviceIntegrityStatus(promise: Promise) {
    sharedImpl.getDeviceIntegrityStatus(promise)
  }

  // Event emitter support for biometric changes
  // Note: emitOnBiometricChange is now provided by the generated NativeReactNativeBiometricsSpec

  @ReactMethod
  fun addListener(eventName: String) {
    // Increment listener count and start detection when first listener is added
    listenerCount++
    if (listenerCount == 1) {
      sharedImpl.startBiometricChangeDetection()
    }
  }

  @ReactMethod
  fun removeListeners(count: Double) {
    // Decrement listener count and stop detection when all listeners are removed
    listenerCount = maxOf(0, listenerCount - count.toInt())
    if (listenerCount == 0) {
      sharedImpl.stopBiometricChangeDetection()
    }
  }

  @ReactMethod
  override fun startBiometricChangeDetection(promise: Promise) {
    sharedImpl.startBiometricChangeDetection()
    promise.resolve(null)
  }

  @ReactMethod
  override fun stopBiometricChangeDetection(promise: Promise) {
    sharedImpl.stopBiometricChangeDetection()
    promise.resolve(null)
  }

  override fun invalidate() {
    // Cleanup when the React Native instance is destroyed
    sharedImpl.stopBiometricChangeDetection()
    super.invalidate()
  }
}
