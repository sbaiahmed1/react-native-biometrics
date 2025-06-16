package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.bridge.ReactContextBaseJavaModule

abstract class ReactNativeBiometricsSpec(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), TurboModule {
  abstract fun isSensorAvailable(promise: Promise)
  abstract fun simplePrompt(reason: String, promise: Promise)
}
