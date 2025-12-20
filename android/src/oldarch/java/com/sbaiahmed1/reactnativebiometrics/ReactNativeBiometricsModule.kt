package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  com.facebook.react.bridge.ReactContextBaseJavaModule(reactContext) {

  private val sharedImpl = ReactNativeBiometricsSharedImpl(reactContext)

  override fun getName(): String = "ReactNativeBiometrics"

  @ReactMethod
  fun isSensorAvailable(promise: Promise) {
    sharedImpl.isSensorAvailable(promise)
  }

  @ReactMethod
  fun isSensorAvailable(biometricStrength: String?, promise: Promise) {
    sharedImpl.isSensorAvailable(biometricStrength, promise)
  }

  @ReactMethod
  fun simplePrompt(promptMessage: String, biometricStrength: String?, promise: Promise) {
    sharedImpl.simplePrompt(promptMessage, "Cancel", biometricStrength, promise)
  }

  @ReactMethod
  fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.authenticateWithOptions(options, promise)
  }

  @ReactMethod
  fun createKeys(keyAlias: String?, keyType: String?, biometricStrength: String?, promise: Promise) {
    sharedImpl.createKeysWithType(keyAlias, keyType, biometricStrength, promise)
  }

  @ReactMethod
  fun deleteKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.deleteKeys(keyAlias, promise)
  }

  @ReactMethod
  fun getAllKeys(customAlias: String?, promise: Promise) {
    sharedImpl.getAllKeys(customAlias, promise)
  }

  @ReactMethod
  fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
    sharedImpl.validateKeyIntegrity(keyAlias, promise)
  }

  @ReactMethod
  fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, promise)
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

  // Legacy methods kept for backward compatibility
  @ReactMethod
  fun createSignature(payload: String, keyAlias: String?, biometricStrength: String?, promise: Promise) {
    sharedImpl.createSignature(payload, keyAlias, biometricStrength, promise)
  }

  @ReactMethod
  fun verifySignature(signature: String, payload: String, keyAlias: String?, promise: Promise) {
    sharedImpl.verifySignature(signature, payload, keyAlias, promise)
  }
}
