package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Old Architecture implementation of ReactNativeBiometricsModule
 * This extends ReactContextBaseJavaModule directly for compatibility with the bridge
 */
class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  
  companion object {
    const val NAME = "ReactNativeBiometrics"
  }
  
  private val sharedImpl = ReactNativeBiometricsSharedImpl(reactContext)
  
  init {
    // Initialize biometric change detection
    sharedImpl.setBiometricChangeListener { event ->
      sendEvent("onBiometricChange", event)
    }
  }

  override fun getName() = NAME

  @ReactMethod
  fun isSensorAvailable(promise: Promise) {
    sharedImpl.isSensorAvailable(promise)
  }

  @ReactMethod
  fun simplePrompt(promptMessage: String, promise: Promise) {
    sharedImpl.simplePrompt(promptMessage, promise)
  }

  @ReactMethod
  fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.authenticateWithOptions(options, promise)
  }

  @ReactMethod
  fun createKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.createKeys(keyAlias, promise)
  }
  
  @ReactMethod
  fun deleteKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.deleteKeys(keyAlias, promise)
  }
  
  @ReactMethod
  fun getAllKeys(promise: Promise) {
    sharedImpl.getAllKeys(promise)
  }
  
  @ReactMethod
  fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
    sharedImpl.validateKeyIntegrity(keyAlias, promise)
  }
  
  @ReactMethod
  fun verifyKeySignature(keyAlias: String?, data: String, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promise)
  }
  
  @ReactMethod
  fun validateSignature(keyAlias: String?, data: String, signature: String, promise: Promise) {
    sharedImpl.validateSignature(keyAlias, data, signature, promise)
  }
  
  @ReactMethod
  fun getKeyAttributes(keyAlias: String?, promise: Promise) {
    sharedImpl.getKeyAttributes(keyAlias, promise)
  }
  
  @ReactMethod
  fun configureKeyAlias(keyAlias: String, promise: Promise) {
    sharedImpl.configureKeyAlias(keyAlias, promise)
  }
  
  @ReactMethod
  fun getDefaultKeyAlias(promise: Promise) {
    sharedImpl.getDefaultKeyAlias(promise)
  }
  
  @ReactMethod
  fun getDiagnosticInfo(promise: Promise) {
    sharedImpl.getDiagnosticInfo(promise)
  }
  
  @ReactMethod
  fun runBiometricTest(promise: Promise) {
    sharedImpl.runBiometricTest(promise)
  }
  
  @ReactMethod
  fun setDebugMode(enabled: Boolean, promise: Promise) {
    sharedImpl.setDebugMode(enabled, promise)
  }
  
  @ReactMethod
  fun getDeviceIntegrityStatus(promise: Promise) {
    sharedImpl.getDeviceIntegrityStatus(promise)
  }
  
  // Event emitter support
  private fun sendEvent(eventName: String, params: com.facebook.react.bridge.WritableMap?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
  
  @ReactMethod
  fun addListener(eventName: String) {
    // Called when JS side starts listening
    sharedImpl.startBiometricChangeDetection()
  }
  
  @ReactMethod
  fun removeListeners(count: Int) {
    // Called when JS side stops listening
    if (count == 0) {
      sharedImpl.stopBiometricChangeDetection()
    }
  }
}