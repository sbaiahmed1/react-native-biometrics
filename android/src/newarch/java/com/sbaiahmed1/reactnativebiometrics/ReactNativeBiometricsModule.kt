package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * New Architecture (TurboModule) implementation of ReactNativeBiometricsModule
 * This extends ReactNativeBiometricsSpec which implements TurboModule
 */
class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  ReactNativeBiometricsSpec(reactContext) {
  
  companion object {
    const val NAME = "ReactNativeBiometrics"
  }
  
  private val sharedImpl = ReactNativeBiometricsSharedImpl(reactContext)

  override fun getName() = NAME

  @ReactMethod
  override fun isSensorAvailable(promise: Promise) {
    sharedImpl.isSensorAvailable(promise)
  }

  @ReactMethod
  override fun simplePrompt(reason: String, promise: Promise) {
    sharedImpl.simplePrompt(reason, promise)
  }

  // Delegate all other methods to shared implementation
  @ReactMethod
  override fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.authenticateWithOptions(options, promise)
  }
  
  @ReactMethod
  override fun createKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.createKeys(keyAlias, promise)
  }
  
  @ReactMethod
  override fun deleteKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.deleteKeys(keyAlias, promise)
  }
  
  @ReactMethod
  override fun getAllKeys(promise: Promise) {
    sharedImpl.getAllKeys(promise)
  }
  
  @ReactMethod
  override fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
    sharedImpl.validateKeyIntegrity(keyAlias, promise)
  }
  
  @ReactMethod
  override fun verifyKeySignature(keyAlias: String?, data: String, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promise)
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
}