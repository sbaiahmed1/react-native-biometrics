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
  fun validateKeyIntegrity(keyAlias: String?, biometricStrength: String?, promise: Promise) {
    sharedImpl.validateKeyIntegrity(keyAlias, biometricStrength, promise)
  }

  @ReactMethod
  fun createSignature(payload: String, keyAlias: String?, biometricStrength: String?, promise: Promise) {
    sharedImpl.createSignature(payload, keyAlias, biometricStrength, promise)
  }

  @ReactMethod
  fun verifySignature(signature: String, payload: String, keyAlias: String?, promise: Promise) {
    sharedImpl.verifySignature(signature, payload, keyAlias, promise)
  }

  @ReactMethod
  fun getDefaultKeyAlias(promise: Promise) {
    sharedImpl.getDefaultKeyAlias(promise)
  }
}