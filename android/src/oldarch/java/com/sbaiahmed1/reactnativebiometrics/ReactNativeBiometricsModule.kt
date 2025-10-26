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
  fun simplePrompt(promptMessage: String, biometricStrength: String?, promise: Promise) {
    sharedImpl.simplePrompt(promptMessage, "Cancel", biometricStrength, promise)
  }

  @ReactMethod
  fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.authenticateWithOptions(options, promise)
  }
}